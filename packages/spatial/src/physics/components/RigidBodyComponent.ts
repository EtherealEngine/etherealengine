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

import { RigidBody, RigidBodyDesc } from '@dimforge/rapier3d-compat'
import { Types } from 'bitecs'

import { Entity, useEntityContext } from '@etherealengine/ecs'
import {
  defineComponent,
  getMutableComponent,
  removeComponent,
  setComponent,
  useComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { getState } from '@etherealengine/hyperflux'
import { useLayoutEffect } from 'react'
import { proxifyQuaternion, proxifyVector3 } from '../../common/proxies/createThreejsProxy'
import { Physics } from '../classes/Physics'
import { PhysicsState } from '../state/PhysicsState'
import { Body, BodyTypes } from '../types/PhysicsTypes'

const { f64 } = Types
const Vector3Schema = { x: f64, y: f64, z: f64 }
const QuaternionSchema = { x: f64, y: f64, z: f64, w: f64 }
const SCHEMA = {
  previousPosition: Vector3Schema,
  previousRotation: QuaternionSchema,
  position: Vector3Schema,
  rotation: QuaternionSchema,
  targetKinematicPosition: Vector3Schema,
  targetKinematicRotation: QuaternionSchema,
  linearVelocity: Vector3Schema,
  angularVelocity: Vector3Schema
}

export const RigidBodyComponent = defineComponent({
  name: 'RigidBodyComponent',
  jsonID: 'EE_rigidbody',
  schema: SCHEMA,

  onInit(entity) {
    return {
      type: 'fixed' as Body,
      ccd: false,
      allowRolling: true,
      enabledRotations: [true, true, true],
      // internal
      body: null! as RigidBody,
      previousPosition: proxifyVector3(this.previousPosition, entity),
      previousRotation: proxifyQuaternion(this.previousRotation, entity),
      position: proxifyVector3(this.position, entity),
      rotation: proxifyQuaternion(this.rotation, entity),
      targetKinematicPosition: proxifyVector3(this.targetKinematicPosition, entity),
      targetKinematicRotation: proxifyQuaternion(this.targetKinematicRotation, entity),
      linearVelocity: proxifyVector3(this.linearVelocity, entity),
      angularVelocity: proxifyVector3(this.angularVelocity, entity),
      /** If multiplier is 0, ridigbody moves immediately to target pose, linearly interpolating between substeps */
      targetKinematicLerpMultiplier: 0
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return

    if (typeof json.type === 'string') component.type.set(json.type)
    if (typeof json.ccd === 'boolean') component.ccd.set(json.ccd)
    if (typeof json.allowRolling === 'boolean') component.allowRolling.set(json.allowRolling)
    if (Array.isArray(json.enabledRotations) && json.enabledRotations.length === 3)
      component.enabledRotations.set(json.enabledRotations)
  },

  toJSON: (entity, component) => {
    return {
      type: component.type.value as Body,
      ccd: component.ccd.value,
      allowRolling: component.allowRolling.value,
      enabledRotations: component.enabledRotations.value
    }
  },

  onRemove(entity, component) {
    if (!component.body.value) return
    const rigidBody = getMutableComponent(entity, RigidBodyComponent).body
    const world = getState(PhysicsState).physicsWorld
    if (world.bodies.contains(rigidBody.value.handle)) {
      world.removeRigidBody(rigidBody.value)
    }
  },

  reactor: function () {
    const entity = useEntityContext()
    const component = useComponent(entity, RigidBodyComponent)

    useLayoutEffect(() => {
      addRigidbody(entity)
    }, [])

    useLayoutEffect(() => {
      const type = component.type.value
      setComponent(entity, getTagComponentForRigidBody(type))
      Physics.setRigidBodyType(entity, type)
      return () => {
        removeComponent(entity, getTagComponentForRigidBody(type))
      }
    }, [component.type])

    useLayoutEffect(() => {
      const rigidBody = component.body.value
      rigidBody.enableCcd(component.ccd.value)
    }, [component.ccd])

    useLayoutEffect(() => {
      const rigidBody = component.body.value
      rigidBody.lockRotations(component.allowRolling.value, false)
    }, [component.allowRolling])

    useLayoutEffect(() => {
      const rigidBody = component.body.value
      rigidBody.setEnabledRotations(
        component.enabledRotations.value[0],
        component.enabledRotations.value[1],
        component.enabledRotations.value[2],
        false
      )
    }, [component.enabledRotations])

    return null
  }
})

export const RigidBodyDynamicTagComponent = defineComponent({ name: 'RigidBodyDynamicTagComponent' })
export const RigidBodyFixedTagComponent = defineComponent({ name: 'RigidBodyFixedTagComponent' })
export const RigidBodyKinematicTagComponent = defineComponent({ name: 'RigidBodyKinematicTagComponent' })

type RigidBodyTypes =
  | typeof RigidBodyDynamicTagComponent
  | typeof RigidBodyFixedTagComponent
  | typeof RigidBodyKinematicTagComponent

export const getTagComponentForRigidBody = (type: Body): RigidBodyTypes => {
  switch (type) {
    case BodyTypes.Dynamic:
      return RigidBodyDynamicTagComponent
    case BodyTypes.Fixed:
      return RigidBodyFixedTagComponent
    case BodyTypes.Kinematic:
      return RigidBodyKinematicTagComponent
  }
}

export const addRigidbody = (entity: Entity) => {
  const component = getMutableComponent(entity, RigidBodyComponent)
  if (component.body.value) return

  let rigidBodyDesc: RigidBodyDesc = undefined!
  switch (component.type.value) {
    case 'fixed':
    default:
      rigidBodyDesc = RigidBodyDesc.fixed()
      break

    case 'dynamic':
      rigidBodyDesc = RigidBodyDesc.dynamic()
      break

    case 'kinematic':
      rigidBodyDesc = RigidBodyDesc.kinematicPositionBased()
      break
  }

  const world = getState(PhysicsState).physicsWorld
  const rigidBody = Physics.createRigidBody(entity, world, rigidBodyDesc)
  component.body.set(rigidBody)
}
