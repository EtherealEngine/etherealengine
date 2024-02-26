/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { ColliderDesc, RigidBodyDesc, RigidBodyType, ShapeType } from '@dimforge/rapier3d-compat'
import { useEffect } from 'react'
import { Quaternion, Vector3 } from 'three'

import { NO_PROXY, getState, getStateUnsafe, useHookstate } from '@etherealengine/hyperflux'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import {
  defineComponent,
  getComponent,
  getOptionalComponent,
  hasComponent,
  setComponent,
  useComponent,
  useOptionalComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { useEntityContext } from '@etherealengine/ecs/src/EntityFunctions'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import { EngineState } from '@etherealengine/spatial/src/EngineState'
import { InputComponent } from '@etherealengine/spatial/src/input/components/InputComponent'
import { Physics } from '@etherealengine/spatial/src/physics/classes/Physics'
import { RigidBodyComponent } from '@etherealengine/spatial/src/physics/components/RigidBodyComponent'
import { CollisionGroups, DefaultCollisionMask } from '@etherealengine/spatial/src/physics/enums/CollisionGroups'
import { PhysicsState } from '@etherealengine/spatial/src/physics/state/PhysicsState'
import { GroupComponent } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { iterateEntityNode } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'
import {
  computeTransformMatrix,
  updateGroupChildren
} from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import matches from 'ts-matches'
import { cleanupAllMeshData } from '../../assets/classes/AssetLoader'
import { GLTFLoadedComponent } from './GLTFLoadedComponent'
import { ModelComponent } from './ModelComponent'
import { SceneAssetPendingTagComponent } from './SceneAssetPendingTagComponent'
import { SceneObjectComponent } from './SceneObjectComponent'

/** @deprecated - use the new API */
export const ColliderComponent = defineComponent({
  name: 'Collider Component',
  jsonID: 'collider',

  onInit(entity) {
    return {
      bodyType: RigidBodyType.Fixed,
      shapeType: ShapeType.Cuboid,
      isTrigger: false,
      /**
       * removeMesh will clean up any objects in the scene hierarchy after the collider bodies have been processed.
       *   This can be used to reduce CPU load by only persisting colliders in the physics simulation.
       */
      removeMesh: false,
      collisionLayer: CollisionGroups.Default,
      collisionMask: DefaultCollisionMask,
      restitution: 0.5,
      triggers: [
        {
          /**
           * The function to call on the CallbackComponent of the targetEntity when the trigger volume is entered.
           */
          onEnter: null as null | string | undefined,
          /**
           * The function to call on the CallbackComponent of the targetEntity when the trigger volume is exited.
           */
          onExit: null as null | string | undefined,
          /**
           * uuid (null as null | string)
           *
           * empty string represents self
           *
           * TODO: how do we handle non-scene entities?
           */
          target: null as null | EntityUUID | undefined
        }
      ]
    }
  },

  onSet(entity, component, json) {
    if (!json) return

    if (typeof json.bodyType === 'number') component.bodyType.set(json.bodyType)
    if (typeof json.shapeType === 'number') component.shapeType.set(json.shapeType)
    if (typeof json.isTrigger === 'boolean' || typeof json.isTrigger === 'number')
      component.isTrigger.set(Boolean(json.isTrigger))
    if (typeof json.removeMesh === 'boolean' || typeof json.removeMesh === 'number')
      component.removeMesh.set(Boolean(json.removeMesh))
    if (typeof json.collisionLayer === 'number') component.collisionLayer.set(json.collisionLayer)
    if (typeof json.collisionMask === 'number') component.collisionMask.set(json.collisionMask)
    if (typeof json.restitution === 'number') component.restitution.set(json.restitution)

    // backwards compatibility
    const onEnter = (json as any).onEnter ?? null
    const onExit = (json as any).onExit ?? null
    const target = (json as any).target ?? null
    if (!!onEnter || !!onExit || !!target) {
      component.triggers.set([{ onEnter, onExit, target }])
    } else if (typeof json.triggers === 'object') {
      if (
        matches
          .arrayOf(
            matches.shape({
              onEnter: matches.nill.orParser(matches.string),
              onExit: matches.nill.orParser(matches.string),
              target: matches.nill.orParser(matches.string)
            })
          )
          .test(json.triggers)
      ) {
        component.triggers.set(json.triggers)
      }
    }

    if (
      !getState(SceneState).sceneLoaded &&
      hasComponent(entity, SceneObjectComponent) &&
      !hasComponent(entity, RigidBodyComponent)
    )
      SceneAssetPendingTagComponent.addResource(entity, ColliderComponent.jsonID)
    setComponent(entity, InputComponent)
  },

  toJSON(entity, component) {
    return {
      bodyType: component.bodyType.value,
      shapeType: component.shapeType.value,
      isTrigger: component.isTrigger.value,
      removeMesh: component.removeMesh.value,
      collisionLayer: component.collisionLayer.value,
      collisionMask: component.collisionMask.value,
      restitution: component.restitution.value,
      triggers: component.triggers.get(NO_PROXY)
    }
  },

  reactor: function () {
    const entity = useEntityContext()

    const transformComponent = useComponent(entity, TransformComponent)
    const colliderComponent = useComponent(entity, ColliderComponent)
    const isLoadedFromGLTF = useOptionalComponent(entity, GLTFLoadedComponent)
    const groupComponent = useOptionalComponent(entity, GroupComponent)
    const modelHierarchy = useHookstate(ModelComponent.entitiesInModelHierarchyState[entity])

    useEffect(() => {
      SceneAssetPendingTagComponent.removeResource(entity, ColliderComponent.jsonID)

      const isMeshCollider = [ShapeType.TriMesh, ShapeType.ConvexPolyhedron].includes(colliderComponent.shapeType.value)
      const physicsWorld = getStateUnsafe(PhysicsState).physicsWorld

      if (isLoadedFromGLTF?.value || isMeshCollider) {
        const colliderComponent = getComponent(entity, ColliderComponent)

        if (hasComponent(entity, RigidBodyComponent)) {
          Physics.removeRigidBody(entity, physicsWorld)
        }

        iterateEntityNode(entity, computeTransformMatrix)
        if (hasComponent(entity, GroupComponent)) {
          updateGroupChildren(entity)
        }

        const meshesToRemove = Physics.createRigidBodyForGroup(entity, physicsWorld, {
          bodyType: colliderComponent.bodyType,
          shapeType: colliderComponent.shapeType,
          isTrigger: colliderComponent.isTrigger,
          collisionLayer: colliderComponent.collisionLayer,
          collisionMask: colliderComponent.collisionMask,
          restitution: colliderComponent.restitution
        })

        if (!getState(EngineState).isEditor)
          for (const mesh of meshesToRemove) {
            cleanupAllMeshData(mesh, {})
          }
      } else {
        const rigidbodyTypeChanged =
          !hasComponent(entity, RigidBodyComponent) ||
          colliderComponent.bodyType.value !== getComponent(entity, RigidBodyComponent).body.bodyType()

        if (rigidbodyTypeChanged) {
          const rigidbody = getOptionalComponent(entity, RigidBodyComponent)?.body
          /**
           * If rigidbody exists, simply change it's type
           */
          if (rigidbody) {
            Physics.changeRigidbodyType(entity, colliderComponent.bodyType.value)
          } else {
            /**
             * If rigidbody does not exist, create one
             */
            let bodyDesc: RigidBodyDesc
            switch (colliderComponent.bodyType.value) {
              case RigidBodyType.Dynamic:
                bodyDesc = RigidBodyDesc.dynamic()
                break
              case RigidBodyType.KinematicPositionBased:
                bodyDesc = RigidBodyDesc.kinematicPositionBased()
                break
              case RigidBodyType.KinematicVelocityBased:
                bodyDesc = RigidBodyDesc.kinematicVelocityBased()
                break
              default:
              case RigidBodyType.Fixed:
                bodyDesc = RigidBodyDesc.fixed()
                break
            }
            Physics.createRigidBody(entity, physicsWorld, bodyDesc, [])
          }
        }

        const rigidbody = getComponent(entity, RigidBodyComponent)

        /**
         * This component only supports one collider, always at index 0
         */
        Physics.removeCollidersFromRigidBody(entity, physicsWorld)
        const colliderDesc = createColliderDescFromScale(
          colliderComponent.shapeType.value,
          transformComponent.scale.value
        )
        Physics.applyDescToCollider(
          colliderDesc,
          {
            shapeType: colliderComponent.shapeType.value,
            isTrigger: colliderComponent.isTrigger.value,
            /** @todo for whatever reason, the character controller will still collide with triggers if they have a collision layer other than trigger  */
            collisionLayer: colliderComponent.isTrigger.value
              ? CollisionGroups.Trigger
              : colliderComponent.collisionLayer.value,
            collisionMask: colliderComponent.collisionMask.value,
            restitution: colliderComponent.restitution.value
          },
          new Vector3(),
          new Quaternion()
        )
        physicsWorld.createCollider(colliderDesc, rigidbody.body)

        rigidbody.body.setTranslation(transformComponent.position.value, true)
        rigidbody.body.setRotation(transformComponent.rotation.value, true)
      }
    }, [isLoadedFromGLTF, colliderComponent, transformComponent, groupComponent?.length, modelHierarchy])

    return null
  }
})

export const createColliderDescFromScale = (shapeType: ShapeType, scale: Vector3) => {
  switch (shapeType as ShapeType) {
    default:
    case ShapeType.Cuboid:
      return ColliderDesc.cuboid(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z))
    case ShapeType.Ball:
      return ColliderDesc.ball(Math.abs(scale.x))
    case ShapeType.Capsule:
      return ColliderDesc.capsule(Math.abs(scale.y), Math.abs(scale.x))
    case ShapeType.Cylinder:
      return ColliderDesc.cylinder(Math.abs(scale.y), Math.abs(scale.x))
  }
}
