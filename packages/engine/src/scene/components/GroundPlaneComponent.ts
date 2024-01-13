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

import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d-compat'
import { useEffect } from 'react'
import { Color, Mesh, MeshLambertMaterial, PlaneGeometry, ShadowMaterial } from 'three'

import { getState } from '@etherealengine/hyperflux'

import { matches } from '../../common/functions/MatchesUtils'
import { EngineState } from '../../ecs/classes/EngineState'
import { defineComponent, hasComponent, useComponent } from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { Physics } from '../../physics/classes/Physics'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { CollisionGroups } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { PhysicsState } from '../../physics/state/PhysicsState'
import { ObjectLayers } from '../constants/ObjectLayers'
import { enableObjectLayer } from '../functions/setObjectLayers'
import { addObjectToGroup, removeObjectFromGroup } from './GroupComponent'
import { MeshComponent } from './MeshComponent'
import { SceneAssetPendingTagComponent } from './SceneAssetPendingTagComponent'
import { SceneObjectComponent } from './SceneObjectComponent'

export const GroundPlaneComponent = defineComponent({
  name: 'GroundPlaneComponent',
  jsonID: 'ground-plane',

  onInit(entity) {
    return {
      color: new Color(),
      visible: true,
      mesh: null! as Mesh<PlaneGeometry, MeshLambertMaterial | ShadowMaterial>
    }
  },

  onSet(entity, component, json) {
    if (!json) return

    if (matches.object.test(json.color) || matches.string.test(json.color) || matches.number.test(json.color))
      component.color.value.set(json.color)
    if (matches.boolean.test(json.visible)) component.visible.set(json.visible)
    if (matches.object.test(json.mesh)) component.mesh.set(json.mesh as any)

    /**
     * Add SceneAssetPendingTagComponent to tell scene loading system we should wait for this asset to load
     */
    if (
      !getState(EngineState).sceneLoaded &&
      hasComponent(entity, SceneObjectComponent) &&
      !hasComponent(entity, RigidBodyComponent)
    )
      SceneAssetPendingTagComponent.addResource(entity, GroundPlaneComponent.jsonID)
  },

  toJSON(entity, component) {
    return {
      color: component.color.value,
      visible: component.visible.value
    }
  },

  reactor: function () {
    const entity = useEntityContext()

    const component = useComponent(entity, GroundPlaneComponent)

    useEffect(() => {
      const radius = 10000

      const mesh = new Mesh(
        new PlaneGeometry(radius, radius),
        component.visible.value ? new MeshLambertMaterial() : new ShadowMaterial({ opacity: 0.5 })
      )
      component.mesh.set(mesh)
      mesh.geometry.rotateX(-Math.PI / 2)
      mesh.name = 'GroundPlaneMesh'
      mesh.material.polygonOffset = true
      mesh.material.polygonOffsetFactor = -0.01
      mesh.material.polygonOffsetUnits = 1

      addObjectToGroup(entity, mesh)
      enableObjectLayer(mesh, ObjectLayers.Camera, true)
      setComponent(entity, MeshComponent, mesh)

      const rigidBodyDesc = RigidBodyDesc.fixed()
      const colliderDesc = ColliderDesc.cuboid(radius * 2, 0.001, radius * 2)
      colliderDesc.setCollisionGroups(
        getInteractionGroups(CollisionGroups.Ground, CollisionGroups.Default | CollisionGroups.Avatars)
      )

      const physicsWorld = getState(PhysicsState).physicsWorld
      Physics.createRigidBody(entity, physicsWorld, rigidBodyDesc, [colliderDesc])

      SceneAssetPendingTagComponent.removeResource(entity, GroundPlaneComponent.jsonID)

      return () => {
        Physics.removeRigidBody(entity, physicsWorld)
        removeObjectFromGroup(entity, mesh)
      }
    }, [])

    useEffect(() => {
      if (component.mesh.value) component.mesh.value.material.color.set(component.color.value)
    }, [component.color])

    useEffect(() => {
      if (component.mesh.value)
        component.mesh.value.material = component.visible.value
          ? new MeshLambertMaterial({ color: component.color.value })
          : new ShadowMaterial({ opacity: 0.5 })
    }, [component.visible])

    return null
  }
})
