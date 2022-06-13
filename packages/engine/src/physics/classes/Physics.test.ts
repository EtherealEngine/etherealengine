import { ColliderDesc, RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d-compat'
import assert from 'assert'
import { Vector3 } from 'three'

import { Direction } from '../../common/constants/Axis3D'
import { Engine } from '../../ecs/classes/Engine'
import { getComponent, hasComponent } from '../../ecs/functions/ComponentFunctions'
import { createEntity } from '../../ecs/functions/EntityFunctions'
import { createEngine } from '../../initializeEngine'
import { RigidBodyComponent } from '../components/RigidBodyComponent'
import { RigidBodyDynamicTagComponent } from '../components/RigidBodyDynamicTagComponent'
import { RigidBodyFixedTagComponent } from '../components/RigidBodyFixedTagComponent'
import { CollisionGroups, DefaultCollisionMask } from '../enums/CollisionGroups'
import { getInteractionGroups } from '../functions/getInteractionGroups'
import { getTagComponentForRigidBody } from '../functions/getTagComponentForRigidBody'
import { RaycastHit, SceneQueryType } from '../types/PhysicsTypes'
import { Physics } from './PhysicsRapier'

describe('Physics', () => {
  before(async () => {
    createEngine()
    await Physics.load()
  })

  it('should create rapier world', async () => {
    const world = Physics.createWorld()
    assert(world)
  })

  it('should create & remove rigidBody', async () => {
    const world = Engine.instance.currentWorld
    const entity = createEntity(world)

    const physicsWorld = Physics.createWorld()

    const rigidBodyDesc = RigidBodyDesc.dynamic()
    const colliderDesc = ColliderDesc.ball(1)

    const rigidBody = Physics.createRigidBody(entity, physicsWorld, rigidBodyDesc, [colliderDesc])

    assert.deepEqual(physicsWorld.bodies.len(), 1)
    assert.deepEqual(physicsWorld.colliders.len(), 1)
    assert.deepEqual(hasComponent(entity, RigidBodyComponent), true)
    assert.deepEqual(getComponent(entity, RigidBodyComponent), rigidBody)
    assert.deepEqual(hasComponent(entity, RigidBodyDynamicTagComponent), true)

    Physics.removeRigidBody(entity, physicsWorld)
    assert.deepEqual(physicsWorld.bodies.len(), 0)
    assert.deepEqual(hasComponent(entity, RigidBodyComponent), false)
    assert.deepEqual(hasComponent(entity, RigidBodyDynamicTagComponent), false)
  })

  it('component type should match rigid body type', async () => {
    const world = Engine.instance.currentWorld
    const entity = createEntity(world)

    const physicsWorld = Physics.createWorld()

    const rigidBodyDesc = RigidBodyDesc.fixed()
    const colliderDesc = ColliderDesc.ball(1)

    const rigidBody = Physics.createRigidBody(entity, physicsWorld, rigidBodyDesc, [colliderDesc])
    const rigidBodyComponent = getTagComponentForRigidBody(rigidBody)

    assert.deepEqual(rigidBodyComponent, RigidBodyFixedTagComponent)
  })

  it('should change rigidBody type', async () => {
    const world = Engine.instance.currentWorld
    const entity = createEntity(world)

    const physicsWorld = Physics.createWorld()

    const rigidBodyDesc = RigidBodyDesc.dynamic()
    const colliderDesc = ColliderDesc.ball(1)

    const rigidBody = Physics.createRigidBody(entity, physicsWorld, rigidBodyDesc, [colliderDesc])

    assert.deepEqual(physicsWorld.bodies.len(), 1)
    assert.deepEqual(rigidBody.bodyType(), RigidBodyType.Dynamic)
    assert.deepEqual(hasComponent(entity, RigidBodyDynamicTagComponent), true)

    Physics.changeRigidbodyType(entity, RigidBodyType.Fixed)
    assert.deepEqual(rigidBody.bodyType(), RigidBodyType.Fixed)
    assert.deepEqual(hasComponent(entity, RigidBodyDynamicTagComponent), false)
    assert.deepEqual(hasComponent(entity, RigidBodyFixedTagComponent), true)
  })

  it('should create accurate InteractionGroups', async () => {
    const collisionGroup = 0x0001
    const collisionMask = 0x0003
    const interactionGroups = getInteractionGroups(collisionGroup, collisionMask)

    assert.deepEqual(interactionGroups, 65539)
  })

  it('should cast ray and hit rigidbody', async () => {
    const world = Engine.instance.currentWorld
    const entity = createEntity(world)

    const physicsWorld = Physics.createWorld()

    const rigidBodyDesc = RigidBodyDesc.dynamic().setTranslation(10, 0, 0)
    const colliderDesc = ColliderDesc.cylinder(5, 5).setCollisionGroups(
      getInteractionGroups(CollisionGroups.Default, DefaultCollisionMask)
    )

    const rigidBody = Physics.createRigidBody(entity, physicsWorld, rigidBodyDesc, [colliderDesc])

    physicsWorld.step()

    const raycastComponentData = {
      filterData: null, // TODO
      type: SceneQueryType.Closest,
      hits: [] as RaycastHit[],
      origin: new Vector3().set(0, 1, 0),
      direction: Direction.Right,
      maxDistance: 20,
      flags: getInteractionGroups(CollisionGroups.Default, DefaultCollisionMask)
    }
    Physics.castRay(physicsWorld, raycastComponentData)

    assert.deepEqual(raycastComponentData.hits.length, 1)
    assert.deepEqual(raycastComponentData.hits[0].normal.x, -1)
    assert.deepEqual(raycastComponentData.hits[0].distance, 5)
    assert.deepEqual(raycastComponentData.hits[0].body, rigidBody)
  })
})
