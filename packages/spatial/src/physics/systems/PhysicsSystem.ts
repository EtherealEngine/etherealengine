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

import { Not } from 'bitecs'
import { useEffect } from 'react'
import { Quaternion, Vector3 } from 'three'

import { smootheLerpAlpha } from '@etherealengine/common/src/utils/smootheLerpAlpha'
import { NO_PROXY_STEALTH, getMutableState, getState, none } from '@etherealengine/hyperflux'

import { getComponent, removeComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { ECSState } from '@etherealengine/ecs/src/ECSState'
import { Entity } from '@etherealengine/ecs/src/Entity'
import { defineQuery } from '@etherealengine/ecs/src/QueryFunctions'
import { defineSystem } from '@etherealengine/ecs/src/SystemFunctions'
import { SimulationSystemGroup } from '@etherealengine/ecs/src/SystemGroups'
import { NetworkState } from '../../networking/NetworkState'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { PhysicsSerialization } from '../PhysicsSerialization'
import { Physics } from '../classes/Physics'
import { CollisionComponent } from '../components/CollisionComponent'
import {
  RigidBodyComponent,
  RigidBodyFixedTagComponent,
  RigidBodyKinematicPositionBasedTagComponent,
  RigidBodyKinematicVelocityBasedTagComponent
} from '../components/RigidBodyComponent'
import { PhysicsState } from '../state/PhysicsState'
import { ColliderHitEvent, CollisionEvents } from '../types/PhysicsTypes'

export function smoothPositionBasedKinematicBody(entity: Entity, dt: number, substep: number) {
  const rigidbodyComponent = getComponent(entity, RigidBodyComponent)
  if (rigidbodyComponent.targetKinematicLerpMultiplier === 0) {
    /** deterministic linear interpolation between substeps */
    rigidbodyComponent.position.lerpVectors(
      rigidbodyComponent.previousPosition,
      rigidbodyComponent.targetKinematicPosition,
      substep
    )
    rigidbodyComponent.rotation
      .copy(rigidbodyComponent.previousRotation)
      .fastSlerp(rigidbodyComponent.targetKinematicRotation, substep)
  } else {
    /** gradual smoothing between substeps */
    const alpha = smootheLerpAlpha(rigidbodyComponent.targetKinematicLerpMultiplier, dt)
    rigidbodyComponent.position.lerp(rigidbodyComponent.targetKinematicPosition, alpha)
    rigidbodyComponent.rotation.fastSlerp(rigidbodyComponent.targetKinematicRotation, alpha)
  }
  if (!rigidbodyComponent.body) return
  rigidbodyComponent.body.setNextKinematicTranslation(rigidbodyComponent.position)
  rigidbodyComponent.body.setNextKinematicRotation(rigidbodyComponent.rotation)
}

export function smoothVelocityBasedKinematicBody(entity: Entity, dt: number, substep: number) {
  const rigidbodyComponent = getComponent(entity, RigidBodyComponent)
  if (rigidbodyComponent.targetKinematicLerpMultiplier === 0) {
    rigidbodyComponent.position.lerpVectors(
      rigidbodyComponent.previousPosition,
      rigidbodyComponent.targetKinematicPosition,
      substep
    )
    rigidbodyComponent.rotation.slerpQuaternions(
      rigidbodyComponent.previousRotation,
      rigidbodyComponent.targetKinematicRotation,
      substep
    )
  } else {
    const alpha = smootheLerpAlpha(rigidbodyComponent.targetKinematicLerpMultiplier, dt)
    rigidbodyComponent.position.lerp(rigidbodyComponent.targetKinematicPosition, alpha)
    rigidbodyComponent.rotation.slerp(rigidbodyComponent.targetKinematicRotation, alpha)
  }
  if (!rigidbodyComponent.body) return
  /** @todo implement proper velocity based kinematic movement */
  rigidbodyComponent.body.setNextKinematicTranslation(rigidbodyComponent.position)
  rigidbodyComponent.body.setNextKinematicRotation(rigidbodyComponent.rotation)
}

const allRigidBodyQuery = defineQuery([RigidBodyComponent, Not(RigidBodyFixedTagComponent)])
const collisionQuery = defineQuery([CollisionComponent])

const kinematicPositionBodyQuery = defineQuery([
  RigidBodyComponent,
  RigidBodyKinematicPositionBasedTagComponent,
  TransformComponent
])
const kinematicVelocityBodyQuery = defineQuery([
  RigidBodyComponent,
  RigidBodyKinematicVelocityBasedTagComponent,
  TransformComponent
])

let drainCollisions: ReturnType<typeof Physics.drainCollisionEventQueue>
let drainContacts: ReturnType<typeof Physics.drainContactEventQueue>

const execute = () => {
  const { physicsWorld, physicsCollisionEventQueue } = getMutableState(PhysicsState)
  if (!physicsWorld.get(NO_PROXY_STEALTH)) return

  const allRigidBodies = allRigidBodyQuery()

  for (const entity of allRigidBodies) {
    const rigidBody = getComponent(entity, RigidBodyComponent)
    const body = rigidBody.body
    if (!body) continue
    const translation = body.translation() as Vector3
    const rotation = body.rotation() as Quaternion
    RigidBodyComponent.previousPosition.x[entity] = translation.x
    RigidBodyComponent.previousPosition.y[entity] = translation.y
    RigidBodyComponent.previousPosition.z[entity] = translation.z
    RigidBodyComponent.previousRotation.x[entity] = rotation.x
    RigidBodyComponent.previousRotation.y[entity] = rotation.y
    RigidBodyComponent.previousRotation.z[entity] = rotation.z
    RigidBodyComponent.previousRotation.w[entity] = rotation.w
  }

  const existingColliderHits = [] as Array<{ entity: Entity; collisionEntity: Entity; hit: ColliderHitEvent }>

  for (const collisionEntity of collisionQuery()) {
    const collisionComponent = getComponent(collisionEntity, CollisionComponent)
    for (const [entity, hit] of collisionComponent) {
      if (hit.type !== CollisionEvents.COLLISION_PERSIST && hit.type !== CollisionEvents.TRIGGER_PERSIST) {
        existingColliderHits.push({ entity, collisionEntity, hit })
      }
    }
  }

  const { physicsSubsteps } = getState(PhysicsState)
  const { simulationTimestep } = getState(ECSState)

  // step physics world
  const timestep = simulationTimestep / 1000 / physicsSubsteps
  physicsWorld.timestep.set(timestep)
  // const smoothnessMultiplier = 50
  // const smoothAlpha = smoothnessMultiplier * timestep
  const kinematicPositionEntities = kinematicPositionBodyQuery()
  const kinematicVelocityEntities = kinematicVelocityBodyQuery()
  for (let i = 0; i < physicsSubsteps; i++) {
    // smooth kinematic pose changes
    const substep = (i + 1) / physicsSubsteps
    for (const entity of kinematicPositionEntities) smoothPositionBasedKinematicBody(entity, timestep, substep)
    for (const entity of kinematicVelocityEntities) smoothVelocityBasedKinematicBody(entity, timestep, substep)
    physicsWorld.get(NO_PROXY_STEALTH).step(physicsCollisionEventQueue.get(NO_PROXY_STEALTH))
    physicsCollisionEventQueue.get(NO_PROXY_STEALTH).drainCollisionEvents(drainCollisions)
    physicsCollisionEventQueue.get(NO_PROXY_STEALTH).drainContactForceEvents(drainContacts)
  }

  /** process collisions */
  for (const { entity, collisionEntity, hit } of existingColliderHits) {
    const collisionComponent = getComponent(collisionEntity, CollisionComponent)
    if (!collisionComponent) continue
    const newHit = collisionComponent.get(entity)!
    if (!newHit) continue
    if (hit.type === CollisionEvents.COLLISION_START && newHit.type === CollisionEvents.COLLISION_START) {
      newHit.type = CollisionEvents.COLLISION_PERSIST
    }
    if (hit.type === CollisionEvents.TRIGGER_START && newHit.type === CollisionEvents.TRIGGER_START) {
      newHit.type = CollisionEvents.TRIGGER_PERSIST
    }
    if (hit.type === CollisionEvents.COLLISION_END && newHit.type === CollisionEvents.COLLISION_END) {
      collisionComponent.delete(entity)
    }
    if (hit.type === CollisionEvents.TRIGGER_END && newHit.type === CollisionEvents.TRIGGER_END) {
      collisionComponent.delete(entity)
    }
  }

  for (const entity of allRigidBodies) {
    const rigidBody = getComponent(entity, RigidBodyComponent)
    const body = rigidBody.body
    if (!body) continue
    const translation = body.translation() as Vector3
    const rotation = body.rotation() as Quaternion
    const linvel = body.linvel() as Vector3
    const angvel = body.angvel() as Vector3
    RigidBodyComponent.position.x[entity] = translation.x
    RigidBodyComponent.position.y[entity] = translation.y
    RigidBodyComponent.position.z[entity] = translation.z
    RigidBodyComponent.rotation.x[entity] = rotation.x
    RigidBodyComponent.rotation.y[entity] = rotation.y
    RigidBodyComponent.rotation.z[entity] = rotation.z
    RigidBodyComponent.rotation.w[entity] = rotation.w
    RigidBodyComponent.linearVelocity.x[entity] = linvel.x
    RigidBodyComponent.linearVelocity.y[entity] = linvel.y
    RigidBodyComponent.linearVelocity.z[entity] = linvel.z
    RigidBodyComponent.angularVelocity.x[entity] = angvel.x
    RigidBodyComponent.angularVelocity.y[entity] = angvel.y
    RigidBodyComponent.angularVelocity.z[entity] = angvel.z
  }

  for (const collisionEntity of collisionQuery()) {
    const collisionComponent = getComponent(collisionEntity, CollisionComponent)
    if (!collisionComponent.size) {
      removeComponent(collisionEntity, CollisionComponent)
    }
  }
}

const reactor = () => {
  useEffect(() => {
    const networkState = getMutableState(NetworkState)
    const physicsState = getMutableState(PhysicsState)

    networkState.networkSchema[PhysicsSerialization.ID].set({
      read: PhysicsSerialization.readRigidBody,
      write: PhysicsSerialization.writeRigidBody
    })

    Physics.load().then(() => {
      const physicsWorld = Physics.createWorld()
      physicsState.physicsWorld.set(physicsWorld)
      physicsState.physicsCollisionEventQueue.set(Physics.createCollisionEventQueue())
      drainCollisions = Physics.drainCollisionEventQueue(physicsWorld)
      drainContacts = Physics.drainContactEventQueue(physicsWorld)
    })

    return () => {
      const physicsWorld = getMutableState(PhysicsState).physicsWorld
      physicsWorld.value?.free()
      physicsWorld.set(null!)
      drainCollisions = null!
      drainContacts = null!

      networkState.networkSchema[PhysicsSerialization.ID].set(none)
    }
  }, [])
  return null
}

export const PhysicsSystem = defineSystem({
  uuid: 'ee.engine.PhysicsSystem',
  insert: { with: SimulationSystemGroup },
  execute,
  reactor
})
