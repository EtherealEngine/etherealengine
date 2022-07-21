import { pipe } from 'bitecs'
import { Box3, Mesh, Quaternion, Vector3 } from 'three'

import { createActionQueue } from '@xrengine/hyperflux'

import { AvatarComponent } from '../../avatar/components/AvatarComponent'
import { AvatarControllerComponent } from '../../avatar/components/AvatarControllerComponent'
import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import { World } from '../../ecs/classes/World'
import { defineQuery, getComponent, hasComponent, removeComponent } from '../../ecs/functions/ComponentFunctions'
import { BoundingBoxComponent } from '../../interaction/components/BoundingBoxComponent'
import { NetworkObjectComponent } from '../../networking/components/NetworkObjectComponent'
import { NetworkObjectDirtyTag } from '../../networking/components/NetworkObjectDirtyTag'
import { WorldNetworkAction } from '../../networking/functions/WorldNetworkAction'
import { Object3DComponent } from '../../scene/components/Object3DComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { Physics } from '../classes/PhysicsRapier'
import { RaycastComponent } from '../components/RaycastComponent'
import { RigidBodyComponent } from '../components/RigidBodyComponent'
import { VelocityComponent } from '../components/VelocityComponent'
import { isDynamicBody, isStaticBody } from '../functions/helpers'
import { teleportRigidbody } from '../functions/helpers'

// Receptor
export function teleportObjectReceptor(
  action: ReturnType<typeof WorldNetworkAction.teleportObject>,
  world = Engine.instance.currentWorld
) {
  const [x, y, z] = action.pose
  const entity = world.getNetworkObject(action.object.ownerId, action.object.networkId)!
  const controllerComponent = getComponent(entity, AvatarControllerComponent)
  if (controllerComponent) {
    const velocity = getComponent(entity, VelocityComponent)
    const avatar = getComponent(entity, AvatarComponent)
    controllerComponent.controller.setTranslation({ x, y: y + avatar.avatarHalfHeight, z }, true)
    velocity.linear.setScalar(0)
    velocity.angular.setScalar(0)
  }
}

// Queries
const boxQuery = defineQuery([BoundingBoxComponent, Object3DComponent])
const networkRigidBodyQuery = defineQuery([NetworkObjectComponent, RigidBodyComponent, NetworkObjectDirtyTag])
const raycastQuery = defineQuery([RaycastComponent])
const rigidBodyQuery = defineQuery([RigidBodyComponent])

// Simulation Handlers

/**
 * @author HydraFire <github.com/HydraFire>
 * @author Josh Field <github.com/HexaField>
 */
const scratchBox = new Box3()
const processBoundingBox = (entity: Entity, force = false) => {
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

const processRaycasts = (world: World) => {
  for (const entity of raycastQuery()) {
    Physics.castRay(world.physicsWorld, getComponent(entity, RaycastComponent))
  }
  return world
}

const processNetworkBodies = (world: World) => {
  // Set network state to physics body pose for objects not owned by this user.
  for (const entity of networkRigidBodyQuery()) {
    const network = getComponent(entity, NetworkObjectComponent)

    // const nameComponent = getComponent(entity, NameComponent)

    // Ignore if we own this object or no new network state has been received for this object
    // (i.e. packet loss and/or state not sent out from server because no change in state since last frame)
    if (network.ownerId === Engine.instance.userId) {
      // console.log('ignoring state for:', nameComponent)
      continue
    }

    const body = getComponent(entity, RigidBodyComponent)
    const transform = getComponent(entity, TransformComponent)
    if (!isDynamicBody(body)) continue

    teleportRigidbody(body, transform.position, transform.rotation)

    const linearVelocity = getComponent(entity, VelocityComponent).linear
    const angularVelocity = getComponent(entity, VelocityComponent).angular
    body.setLinvel(linearVelocity, true)
    body.setAngvel(angularVelocity, true)

    removeComponent(entity, NetworkObjectDirtyTag)

    // console.log(
    //   'physics velocity of network object:',
    //   nameComponent.name,
    //   world.fixedTick,
    //   angularVelocity.x,
    //   angularVelocity.y,
    //   angularVelocity.z
    // )
  }
  return world
}

const processBodies = (world: World) => {
  for (const entity of rigidBodyQuery()) {
    const velocity = getComponent(entity, VelocityComponent)
    const body = getComponent(entity, RigidBodyComponent)
    const transform = getComponent(entity, TransformComponent)

    if (hasComponent(entity, AvatarComponent)) continue

    if (Engine.instance.isEditor || isStaticBody(body)) {
      if (velocity) {
        velocity.linear.subVectors(body.translation() as Vector3, transform.position)
        velocity.angular.setScalar(0) // TODO: Assuming zero velocity for static objects for now.
      } else {
        // console.warn("Physics entity found with no velocity component!")
      }

      teleportRigidbody(body, transform.position, transform.rotation)
    } else if (isDynamicBody(body)) {
      const linearVelocity = body.linvel()
      const angularVelocity = body.angvel()
      if (velocity) {
        velocity.linear.copy(linearVelocity as Vector3)
        velocity.angular.copy(angularVelocity as Vector3)

        // const nameComponent = getComponent(entity, NameComponent)
        // console.log("setting velocity component:", nameComponent.name, angularVelocity.x, angularVelocity.y, angularVelocity.z)
      } else {
        // console.warn("Physics entity found with no velocity component!")
      }
      transform.position.copy(body.translation() as Vector3)
      transform.rotation.copy(body.rotation() as Quaternion)
    }
  }
  return world
}

const processCollisions = (world: World) => {
  Physics.drainCollisionEventQueue(world.physicsWorld, world.physicsCollisionEventQueue)
  return world
}

const simulationPipeline = pipe(processRaycasts, processNetworkBodies, processBodies, processCollisions)

export default async function RapierPhysicsSystem(world: World) {
  const teleportObjectQueue = createActionQueue(WorldNetworkAction.teleportObject.matches)

  await Physics.load()
  world.physicsWorld = Physics.createWorld()
  world.physicsCollisionEventQueue = Physics.createCollisionEventQueue()

  return () => {
    for (const action of teleportObjectQueue()) teleportObjectReceptor(action)

    for (const entity of boxQuery.enter()) {
      processBoundingBox(entity, true)
    }

    for (const entity of rigidBodyQuery.exit()) {
      Physics.removeRigidBody(entity, world.physicsWorld)
    }

    simulationPipeline(world)

    // step physics world
    world.physicsWorld.step(world.physicsCollisionEventQueue)
  }
}
