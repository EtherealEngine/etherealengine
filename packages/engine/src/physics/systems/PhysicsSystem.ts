import { Quaternion, Vector3 } from 'three'

import { createActionQueue, getState } from '@xrengine/hyperflux'

import { Engine } from '../../ecs/classes/Engine'
import { EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import { World } from '../../ecs/classes/World'
import { defineQuery, getComponent, removeComponent } from '../../ecs/functions/ComponentFunctions'
import { NetworkObjectComponent } from '../../networking/components/NetworkObjectComponent'
import { NetworkObjectDirtyTag } from '../../networking/components/NetworkObjectDirtyTag'
import { WorldNetworkAction } from '../../networking/functions/WorldNetworkAction'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { Physics } from '../classes/Physics'
import { CollisionComponent } from '../components/CollisionComponent'
import { RaycastComponent } from '../components/RaycastComponent'
import { RigidBodyComponent } from '../components/RigidBodyComponent'
import { RigidBodyDynamicTagComponent } from '../components/RigidBodyDynamicTagComponent'
import { VelocityComponent } from '../components/VelocityComponent'
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
}

const processRaycasts = (world: World, entity: Entity) => {
  Physics.castRay(world.physicsWorld, getComponent(entity, RaycastComponent))
}

// Set network state to physics body pose for objects not owned by this user.
const updateDirtyDynamicBodiesFromNetwork = (world: World, entity: Entity) => {
  const network = getComponent(entity, NetworkObjectComponent)

  // Ignore if we own this object or no new network state has been received for this object
  // (i.e. packet loss and/or state not sent out from server because no change in state since last frame)
  if (network.ownerId === Engine.instance.userId) {
    // console.log('ignoring state for:', nameComponent)
    return
  }

  const { body } = getComponent(entity, RigidBodyComponent)
  const { position, rotation } = getComponent(entity, TransformComponent)
  const { linear, angular } = getComponent(entity, VelocityComponent)

  body.setTranslation(position, true)
  body.setRotation(rotation, true)
  body.setLinvel(linear, true)
  body.setAngvel(angular, true)

  removeComponent(entity, NetworkObjectDirtyTag)
}

const processCollisions = (world: World, drainCollisions, collisionEntities: Entity[]) => {
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

export default async function PhysicsSystem(world: World) {
  const raycastQuery = defineQuery([RaycastComponent])

  const dirtyNetworkedDynamicRigidBodyQuery = defineQuery([
    NetworkObjectComponent,
    RigidBodyComponent,
    NetworkObjectDirtyTag,
    RigidBodyDynamicTagComponent
  ])

  const rigidBodyQuery = defineQuery([RigidBodyComponent])

  const teleportObjectQueue = createActionQueue(WorldNetworkAction.teleportObject.matches)

  await Physics.load()
  world.physicsWorld = Physics.createWorld()
  world.physicsCollisionEventQueue = Physics.createCollisionEventQueue()
  const drainCollisions = Physics.drainCollisionEventQueue(world.physicsWorld)

  const collisionQuery = defineQuery([CollisionComponent])

  return () => {
    for (const action of teleportObjectQueue()) teleportObjectReceptor(action)

    for (const entity of rigidBodyQuery.exit()) {
      Physics.removeRigidBody(entity, world.physicsWorld, true)
    }

    for (const entity of dirtyNetworkedDynamicRigidBodyQuery()) updateDirtyDynamicBodiesFromNetwork(world, entity)

    if (!Engine.instance.isEditor) {
      for (const entity of rigidBodyQuery()) {
        const rigidBody = getComponent(entity, RigidBodyComponent)
        rigidBody.previousPosition.copy(rigidBody.body.translation() as Vector3)
        rigidBody.previousRotation.copy(rigidBody.body.rotation() as Quaternion)
        rigidBody.previousLinearVelocity.copy(rigidBody.body.linvel() as Vector3)
        rigidBody.previousAngularVelocity.copy(rigidBody.body.linvel() as Vector3)
      }

      // step physics world
      world.physicsWorld.timestep = getState(EngineState).fixedDeltaSeconds.value
      world.physicsWorld.step(world.physicsCollisionEventQueue)

      const collisionEntities = collisionQuery()

      processCollisions(world, drainCollisions, collisionEntities)

      for (const entity of raycastQuery()) processRaycasts(world, entity)
    }
  }
}
