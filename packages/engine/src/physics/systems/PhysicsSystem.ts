import { Box3, Mesh, Quaternion, Vector3 } from 'three'
import matches from 'ts-matches'

import { AvatarComponent } from '../../avatar/components/AvatarComponent'
import { Engine } from '../../ecs/classes/Engine'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { EngineActionType } from '../../ecs/classes/EngineService'
import { Entity } from '../../ecs/classes/Entity'
import { World } from '../../ecs/classes/World'
import { defineQuery, getComponent, hasComponent } from '../../ecs/functions/ComponentFunctions'
import { useWorld } from '../../ecs/functions/SystemHooks'
import { BoundingBoxComponent } from '../../interaction/components/BoundingBoxComponent'
import { NetworkObjectComponent } from '../../networking/components/NetworkObjectComponent'
import { NetworkWorldAction } from '../../networking/functions/NetworkWorldAction'
import { Object3DComponent } from '../../scene/components/Object3DComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { isDynamicBody, isKinematicBody, isStaticBody } from '../classes/Physics'
import { ColliderComponent } from '../components/ColliderComponent'
import { CollisionComponent } from '../components/CollisionComponent'
import { RaycastComponent } from '../components/RaycastComponent'
import { VelocityComponent } from '../components/VelocityComponent'
import { teleportRigidbody } from '../functions/teleportRigidbody'

function physicsActionReceptor(action: unknown) {
  const world = useWorld()
  matches(action).when(NetworkWorldAction.teleportObject.matches, (a) => {
    const [x, y, z, qX, qY, qZ, qW] = a.pose
    const entity = world.getNetworkObject(a.object.ownerId, a.object.networkId)
    const colliderComponent = getComponent(entity, ColliderComponent)
    if (colliderComponent) {
      teleportRigidbody(colliderComponent.body, new Vector3(x, y, z), new Quaternion(qX, qY, qZ, qW))
    }
  })
}
/**
 * @author HydraFire <github.com/HydraFire>
 * @author Josh Field <github.com/HexaField>
 */

const scratchBox = new Box3()

function updateBoundingBox(entity: Entity, force = false) {
  const boundingBox = getComponent(entity, BoundingBoxComponent)
  if (boundingBox.dynamic || force) {
    const object3D = getComponent(entity, Object3DComponent)
    let object3DAABB = boundingBox.box.makeEmpty()
    object3D.value.traverse((mesh: Mesh) => {
      if (mesh instanceof Mesh) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox() // only here for edge cases, this would already be calculated
        const meshAABB = scratchBox.copy(mesh.geometry.boundingBox!)
        meshAABB.applyMatrix4(mesh.matrixWorld)
        object3DAABB.union(meshAABB)
      }
    })
  }
}

export default async function PhysicsSystem(world: World) {
  const boxQuery = defineQuery([BoundingBoxComponent, Object3DComponent])
  const colliderQuery = defineQuery([ColliderComponent])
  const raycastQuery = defineQuery([RaycastComponent])
  const collisionComponent = defineQuery([CollisionComponent])
  const networkColliderQuery = defineQuery([NetworkObjectComponent, ColliderComponent])

  let simulationEnabled = true

  Engine.currentWorld.receptors.push((action: EngineActionType) => {
    switch (action.type) {
      case EngineEvents.EVENTS.ENABLE_SCENE:
        if (typeof action.env.physics !== 'undefined') {
          simulationEnabled = action.env.physics
        }
        break
    }
  })
  world.receptors.push(physicsActionReceptor)

  await world.physics.createScene()

  return () => {
    for (const entity of boxQuery.enter()) {
      updateBoundingBox(entity, true)
    }

    for (const entity of boxQuery()) {
      updateBoundingBox(entity)
    }

    for (const entity of colliderQuery.exit()) {
      const colliderComponent = getComponent(entity, ColliderComponent, true)
      if (colliderComponent?.body) {
        world.physics.removeBody(colliderComponent.body)
      }
    }

    for (const entity of raycastQuery()) {
      world.physics.doRaycast(getComponent(entity, RaycastComponent))
    }

    for (const entity of networkColliderQuery()) {
      const network = getComponent(entity, NetworkObjectComponent)

      // Set network state to physics body pose for objects not owned by this user.
      if (network.ownerId === Engine.userId) continue

      const collider = getComponent(entity, ColliderComponent)
      const transform = getComponent(entity, TransformComponent)
      const body = collider.body as PhysX.PxRigidDynamic

      teleportRigidbody(body, transform.position, transform.rotation)
    }

    for (const entity of colliderQuery()) {
      // Hackish fix for now to disable some physics effects in editor
      // We should prolly not register the physics system when loading editor
      if (Engine.isEditor) return

      const velocity = getComponent(entity, VelocityComponent)
      const collider = getComponent(entity, ColliderComponent)
      const transform = getComponent(entity, TransformComponent)

      if (hasComponent(entity, AvatarComponent)) continue

      if (isStaticBody(collider.body)) {
        const body = collider.body as PhysX.PxRigidDynamic
        const currentPose = body.getGlobalPose()

        if (velocity) velocity.velocity.subVectors(currentPose.translation as Vector3, transform.position)

        currentPose.translation.x = transform.position.x
        currentPose.translation.y = transform.position.y
        currentPose.translation.z = transform.position.z
        currentPose.rotation.x = transform.rotation.x
        currentPose.rotation.y = transform.rotation.y
        currentPose.rotation.z = transform.rotation.z
        currentPose.rotation.w = transform.rotation.w

        if (isKinematicBody(collider.body)) {
          body.setKinematicTarget(currentPose)
        }
        body.setGlobalPose(currentPose, true)
      } else if (isDynamicBody(collider.body)) {
        const body = collider.body as PhysX.PxRigidDynamic

        const linearVelocity = body.getLinearVelocity()
        if (velocity) velocity.velocity.copy(linearVelocity as Vector3)

        const currentPose = body.getGlobalPose()

        transform.position.copy(currentPose.translation as Vector3)
        transform.rotation.copy(currentPose.rotation as Quaternion)
      }
    }

    // clear collision components
    for (const entity of collisionComponent()) {
      getComponent(entity, CollisionComponent).collisions = []
    }

    // populate collision components with events over last simulation
    for (const collisionEvent of world.physics.collisionEventQueue) {
      if (collisionEvent.controllerID) {
        const controller = world.physics.controllers.get(collisionEvent.controllerID)
        const entity = (controller as any).userData
        getComponent(entity, CollisionComponent).collisions.push(collisionEvent)
      }
      if (collisionEvent.shapeA) {
        const bodyAID = world.physics.bodyIDByShapeID.get((collisionEvent.shapeA as any)._id)!
        const bodyA = world.physics.bodies.get(bodyAID)
        const bodyBID = world.physics.bodyIDByShapeID.get((collisionEvent.shapeB as any)._id)!
        const bodyB = world.physics.bodies.get(bodyBID)
        if (!bodyA || !bodyB) continue
        const entityA = (bodyA as any).userData?.entity
        const entityB = (bodyB as any).userData?.entity
        getComponent(entityA, CollisionComponent).collisions.push({
          type: collisionEvent.type,
          bodySelf: bodyA,
          bodyOther: bodyB,
          shapeSelf: collisionEvent.shapeA,
          shapeOther: collisionEvent.shapeB,
          contacts: collisionEvent.contacts
        })
        getComponent(entityB, CollisionComponent).collisions.push({
          type: collisionEvent.type,
          bodySelf: bodyB,
          bodyOther: bodyA,
          shapeSelf: collisionEvent.shapeB,
          shapeOther: collisionEvent.shapeA,
          contacts: collisionEvent.contacts
        })
      }
    }

    // clear collision queue
    world.physics.collisionEventQueue = []

    // step physics world
    for (let i = 0; i < world.physics.substeps; i++) {
      world.physics.scene.simulate((world.physics.timeScale * world.fixedDelta) / world.physics.substeps, true)
      world.physics.scene.fetchResults(true)
    }
  }
}
