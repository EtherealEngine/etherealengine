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

import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from '@dimforge/rapier3d-compat'
import { AnimationClip, AnimationMixer, Object3D, Vector3 } from 'three'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { getState, getStateUnsafe } from '@etherealengine/hyperflux'

import { getComponent, hasComponent, setComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { Entity } from '@etherealengine/ecs/src/Entity'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import { setTargetCameraRotation } from '@etherealengine/spatial/src/camera/functions/CameraFunctions'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { UUIDComponent } from '@etherealengine/spatial/src/common/UUIDComponent'
import {
  NetworkObjectComponent,
  NetworkObjectSendPeriodicUpdatesTag
} from '@etherealengine/spatial/src/networking/components/NetworkObjectComponent'
import { WorldState } from '@etherealengine/spatial/src/networking/interfaces/WorldState'
import { Physics } from '@etherealengine/spatial/src/physics/classes/Physics'
import { CollisionComponent } from '@etherealengine/spatial/src/physics/components/CollisionComponent'
import { RigidBodyComponent } from '@etherealengine/spatial/src/physics/components/RigidBodyComponent'
import { AvatarCollisionMask, CollisionGroups } from '@etherealengine/spatial/src/physics/enums/CollisionGroups'
import { getInteractionGroups } from '@etherealengine/spatial/src/physics/functions/getInteractionGroups'
import { PhysicsState } from '@etherealengine/spatial/src/physics/state/PhysicsState'
import { addObjectToGroup } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import {
  DistanceFromCameraComponent,
  FrustumCullCameraComponent
} from '@etherealengine/spatial/src/transform/components/DistanceComponents'
import { EntityTreeComponent } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'
import { GrabberComponent } from '../../interaction/components/GrabbableComponent'
import { EnvmapComponent } from '../../scene/components/EnvmapComponent'
import { ShadowComponent } from '../../scene/components/ShadowComponent'
import { EnvMapSourceType } from '../../scene/constants/EnvMapEnum'
import { proxifyParentChildRelationships } from '../../scene/functions/loadGLTFModel'
import { AnimationComponent } from '../components/AnimationComponent'
import { AvatarAnimationComponent, AvatarRigComponent } from '../components/AvatarAnimationComponent'
import { AvatarComponent } from '../components/AvatarComponent'
import { AvatarControllerComponent } from '../components/AvatarControllerComponent'

export const avatarRadius = 0.125

export const spawnAvatarReceptor = (entityUUID: EntityUUID) => {
  const entity = UUIDComponent.getEntityByUUID(entityUUID)
  if (!entity) return

  const ownerID = getComponent(entity, NetworkObjectComponent).ownerId

  setComponent(entity, AvatarComponent)

  const userNames = getState(WorldState).userNames
  const userName = userNames[entityUUID]
  const shortId = ownerID.substring(0, 7)
  setComponent(entity, NameComponent, 'avatar-' + (userName ? shortId + ' (' + userName + ')' : shortId))
  const obj3d = new Object3D()
  obj3d.entity = entity
  addObjectToGroup(entity, obj3d)
  proxifyParentChildRelationships(obj3d)

  setComponent(entity, VisibleComponent, true)

  setComponent(entity, DistanceFromCameraComponent)
  setComponent(entity, FrustumCullCameraComponent)

  setComponent(entity, EnvmapComponent, {
    type: EnvMapSourceType.Bake,
    envMapIntensity: 0.5,
    envMapSourceEntityUUID: getComponent(SceneState.getRootEntity(), UUIDComponent)
  })

  setComponent(entity, AnimationComponent, {
    mixer: new AnimationMixer(new Object3D()),
    animations: [] as AnimationClip[]
  })

  setComponent(entity, AvatarAnimationComponent, {
    rootYRatio: 1,
    locomotion: new Vector3()
  })

  if (ownerID === Engine.instance.userID) {
    createAvatarController(entity)
  } else {
    createAvatarRigidBody(entity)
    createAvatarCollider(entity)
  }

  setComponent(entity, NetworkObjectSendPeriodicUpdatesTag)

  setComponent(entity, ShadowComponent)
  setComponent(entity, GrabberComponent)
  setComponent(entity, AvatarRigComponent)

  setComponent(entity, EntityTreeComponent)
}

export const createAvatarCollider = (entity: Entity): Collider => {
  const interactionGroups = getInteractionGroups(CollisionGroups.Avatars, AvatarCollisionMask)
  const avatarComponent = getComponent(entity, AvatarComponent)
  const rigidBody = getComponent(entity, RigidBodyComponent)
  const transform = getComponent(entity, TransformComponent)
  rigidBody.position.copy(transform.position)
  rigidBody.rotation.copy(transform.rotation)
  const halfHeight = avatarComponent.avatarHeight * 0.5
  const bodyColliderDesc = ColliderDesc.capsule(halfHeight - avatarRadius - 0.25, avatarRadius).setCollisionGroups(
    interactionGroups
  )
  bodyColliderDesc.setTranslation(0, halfHeight + 0.25, 0)

  return Physics.createColliderAndAttachToRigidBody(
    getStateUnsafe(PhysicsState).physicsWorld,
    bodyColliderDesc,
    rigidBody.body
  )
}

const createAvatarRigidBody = (entity: Entity): RigidBody => {
  const rigidBodyDesc = RigidBodyDesc.kinematicPositionBased()
  const rigidBody = Physics.createRigidBody(entity, getStateUnsafe(PhysicsState).physicsWorld, rigidBodyDesc, [])
  rigidBody.lockRotations(true, false)
  rigidBody.setEnabledRotations(false, true, false, false)

  return rigidBody
}

export const createAvatarController = (entity: Entity) => {
  if (!hasComponent(entity, RigidBodyComponent)) {
    createAvatarRigidBody(entity)
  }

  const rigidbody = getComponent(entity, RigidBodyComponent)
  const transform = getComponent(entity, TransformComponent)
  rigidbody.position.copy(transform.position)
  rigidbody.rotation.copy(transform.rotation)
  rigidbody.targetKinematicPosition.copy(transform.position)
  rigidbody.targetKinematicRotation.copy(transform.rotation)

  const avatarForward = new Vector3(0, 0, 1).applyQuaternion(transform.rotation)
  const cameraForward = new Vector3(0, 0, -1)
  let targetTheta = (cameraForward.angleTo(avatarForward) * 180) / Math.PI
  const orientation = cameraForward.x * avatarForward.z - cameraForward.z * avatarForward.x
  if (orientation > 0) targetTheta = 2 * Math.PI - targetTheta
  setTargetCameraRotation(Engine.instance.cameraEntity, 0, targetTheta, 0.01)

  setComponent(entity, AvatarControllerComponent, {
    bodyCollider: createAvatarCollider(entity),
    controller: Physics.createCharacterController(getStateUnsafe(PhysicsState).physicsWorld, {})
  })

  setComponent(entity, CollisionComponent)
}
