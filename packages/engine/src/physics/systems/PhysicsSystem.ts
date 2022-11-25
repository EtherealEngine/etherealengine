import { Not } from 'bitecs'
import { Quaternion, Vector3 } from 'three'

import { createActionQueue, getState, removeActionQueue } from '@xrengine/hyperflux'

import { AvatarComponent } from '../../avatar/components/AvatarComponent'
import { Engine } from '../../ecs/classes/Engine'
import { EngineActions, EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import { World } from '../../ecs/classes/World'
import { defineQuery, getComponent, hasComponent, removeQuery } from '../../ecs/functions/ComponentFunctions'
import { NetworkObjectComponent } from '../../networking/components/NetworkObjectComponent'
import { NetworkObjectOwnedTag } from '../../networking/components/NetworkObjectComponent'
import { WorldNetworkAction } from '../../networking/functions/WorldNetworkAction'
import {
  ColliderComponent,
  SCENE_COMPONENT_COLLIDER,
  SCENE_COMPONENT_COLLIDER_DEFAULT_VALUES
} from '../../scene/components/ColliderComponent'
import { GLTFLoadedComponent } from '../../scene/components/GLTFLoadedComponent'
import { SCENE_COMPONENT_VISIBLE } from '../../scene/components/VisibleComponent'
import {
  deserializeCollider,
  serializeCollider,
  updateCollider,
  updateModelColliders
} from '../../scene/functions/loaders/ColliderFunctions'
import {
  SCENE_COMPONENT_TRANSFORM,
  SCENE_COMPONENT_TRANSFORM_DEFAULT_VALUES,
  TransformComponent
} from '../../transform/components/TransformComponent'
import { Physics } from '../classes/Physics'
import { CollisionComponent } from '../components/CollisionComponent'
import { RigidBodyComponent, RigidBodyFixedTagComponent } from '../components/RigidBodyComponent'
import { ColliderHitEvent, CollisionEvents } from '../types/PhysicsTypes'

// Receptor
export function teleportObjectReceptor(
  action: ReturnType<typeof WorldNetworkAction.teleportObject>,
  world = Engine.instance.currentWorld
) {
  const entity = world.getNetworkObject(action.object.ownerId, action.object.networkId)!
  const body = getComponent(entity, RigidBodyComponent).body
  if (body) {
    body.setTranslation(action.position, true)
    body.setRotation(action.rotation, true)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }
  const transform = getComponent(entity, TransformComponent)
  transform.position.copy(action.position)
  transform.rotation.copy(action.rotation)
}

const processCollisions = (world: World, drainCollisions, drainContacts, collisionEntities: Entity[]) => {
  const existingColliderHits = [] as Array<{ entity: Entity; collisionEntity: Entity; hit: ColliderHitEvent }>

  for (const collisionEntity of collisionEntities) {
    const collisionComponent = getComponent(collisionEntity, CollisionComponent)
    for (const [entity, hit] of collisionComponent) {
      if (hit.type !== CollisionEvents.COLLISION_PERSIST && hit.type !== CollisionEvents.TRIGGER_PERSIST) {
        existingColliderHits.push({ entity, collisionEntity, hit })
      }
    }
  }

  world.physicsCollisionEventQueue.drainCollisionEvents(drainCollisions)
  world.physicsCollisionEventQueue.drainContactForceEvents(drainContacts)

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
}

export const PhysicsPrefabs = {
  collider: 'collider' as const
}

export default async function PhysicsSystem(world: World) {
  world.sceneComponentRegistry.set(ColliderComponent.name, SCENE_COMPONENT_COLLIDER)
  world.sceneLoadingRegistry.set(SCENE_COMPONENT_COLLIDER, {
    defaultData: SCENE_COMPONENT_COLLIDER_DEFAULT_VALUES,
    deserialize: deserializeCollider,
    serialize: serializeCollider
  })

  world.scenePrefabRegistry.set(PhysicsPrefabs.collider, [
    { name: SCENE_COMPONENT_TRANSFORM, props: SCENE_COMPONENT_TRANSFORM_DEFAULT_VALUES },
    { name: SCENE_COMPONENT_VISIBLE, props: true },
    { name: SCENE_COMPONENT_COLLIDER, props: SCENE_COMPONENT_COLLIDER_DEFAULT_VALUES }
  ])

  const engineState = getState(EngineState)

  const colliderQuery = defineQuery([ColliderComponent, Not(GLTFLoadedComponent)])
  const groupColliderQuery = defineQuery([ColliderComponent, GLTFLoadedComponent])
  const allRigidBodyQuery = defineQuery([RigidBodyComponent, Not(RigidBodyFixedTagComponent)])
  const collisionQuery = defineQuery([CollisionComponent])

  const teleportObjectQueue = createActionQueue(WorldNetworkAction.teleportObject.matches)
  const modifyPropertyActionQueue = createActionQueue(EngineActions.sceneObjectUpdate.matches)

  await Physics.load()
  world.physicsWorld = Physics.createWorld()
  world.physicsCollisionEventQueue = Physics.createCollisionEventQueue()
  const drainCollisions = Physics.drainCollisionEventQueue(world.physicsWorld)
  const drainContacts = Physics.drainContactEventQueue(world.physicsWorld)

  const execute = () => {
    for (const action of modifyPropertyActionQueue()) {
      for (const entity of action.entities) {
        if (hasComponent(entity, ColliderComponent)) {
          if (hasComponent(entity, GLTFLoadedComponent)) {
            /** @todo we currently have no reason to support this, and it breaks live scene updates */
            // updateMeshCollider(entity)
          } else {
            updateCollider(entity)
          }
        }
      }
    }
    for (const action of colliderQuery.enter()) updateCollider(action)
    for (const action of groupColliderQuery.enter()) updateModelColliders(action)

    for (const action of teleportObjectQueue()) teleportObjectReceptor(action)

    const allRigidBodies = allRigidBodyQuery()

    for (const entity of allRigidBodies) {
      const rigidBody = getComponent(entity, RigidBodyComponent)
      const body = rigidBody.body
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

    // step physics world
    const substeps = engineState.physicsSubsteps.value
    world.physicsWorld.timestep = engineState.fixedDeltaSeconds.value / substeps
    for (let i = 0; i < substeps; i++) {
      world.physicsWorld.step(world.physicsCollisionEventQueue)
    }

    processCollisions(world, drainCollisions, drainContacts, collisionQuery())

    for (const entity of allRigidBodies) {
      const rigidBody = getComponent(entity, RigidBodyComponent)
      const body = rigidBody.body
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
  }

  const cleanup = async () => {
    world.sceneComponentRegistry.delete(ColliderComponent.name)
    world.sceneLoadingRegistry.delete(SCENE_COMPONENT_COLLIDER)
    world.scenePrefabRegistry.delete(PhysicsPrefabs.collider)

    removeQuery(world, colliderQuery)
    removeQuery(world, groupColliderQuery)
    removeQuery(world, allRigidBodyQuery)
    removeQuery(world, collisionQuery)

    removeActionQueue(teleportObjectQueue)
    removeActionQueue(modifyPropertyActionQueue)

    world.physicsWorld.free()
  }

  return { execute, cleanup }
}
