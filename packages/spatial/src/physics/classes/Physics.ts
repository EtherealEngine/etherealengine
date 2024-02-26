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

import {
  ActiveCollisionTypes,
  ActiveEvents,
  Collider,
  ColliderDesc,
  EventQueue,
  InteractionGroups,
  QueryFilterFlags,
  Ray,
  RigidBody,
  RigidBodyDesc,
  RigidBodyType,
  ShapeType,
  TempContactForceEvent,
  World
} from '@dimforge/rapier3d-compat'
import {
  BufferAttribute,
  Matrix4,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Vector2,
  Vector3
} from 'three'

import { Immutable } from '@etherealengine/common/src/Immutability'
import {
  getComponent,
  getMutableComponent,
  getOptionalComponent,
  hasComponent,
  removeComponent,
  setComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Entity, UndefinedEntity } from '@etherealengine/ecs/src/Entity'
import { V_000 } from '../../common/constants/MathConstants'
import { MeshComponent } from '../../renderer/components/MeshComponent'
import { iterateEntityNode } from '../../transform/components/EntityTree'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { CollisionComponent } from '../components/CollisionComponent'
import {
  RigidBodyComponent,
  RigidBodyKinematicPositionBasedTagComponent,
  RigidBodyKinematicVelocityBasedTagComponent,
  getTagComponentForRigidBody
} from '../components/RigidBodyComponent'
import { TriggerComponent } from '../components/TriggerComponent'
import { CollisionGroups, DefaultCollisionMask } from '../enums/CollisionGroups'
import { getInteractionGroups } from '../functions/getInteractionGroups'
import {
  ColliderDescOptions,
  ColliderOptions,
  CollisionEvents,
  OldShapeTypes,
  RaycastHit,
  SceneQueryType
} from '../types/PhysicsTypes'

export type PhysicsWorld = World

async function load() {
  const RAPIER = await import('@dimforge/rapier3d-compat')
  return RAPIER.init()
}

function createWorld(gravity = { x: 0.0, y: -9.81, z: 0.0 }) {
  return new World(gravity)
}

function createCollisionEventQueue() {
  const collisionEventQueue = new EventQueue(true)
  return collisionEventQueue
}

const position = new Vector3()
const rotation = new Quaternion()
const scale = new Vector3()

function createRigidBody(
  entity: Entity,
  world: World,
  rigidBodyDesc: RigidBodyDesc,
  colliderDesc: ColliderDesc[] = []
) {
  const transform = getComponent(entity, TransformComponent)
  transform.matrixWorld.decompose(position, rotation, scale)

  TransformComponent.dirtyTransforms[entity] = false

  rigidBodyDesc.translation = position
  rigidBodyDesc.rotation = rotation

  const body = world.createRigidBody(rigidBodyDesc)
  colliderDesc.forEach((desc) => world.createCollider(desc, body))

  setComponent(entity, RigidBodyComponent)
  getMutableComponent(entity, RigidBodyComponent).body.set(body)
  const rigidBody = getComponent(entity, RigidBodyComponent)
  const RigidBodyTypeTagComponent = getTagComponentForRigidBody(body.bodyType())
  setComponent(entity, RigidBodyTypeTagComponent, true)

  body.setTranslation(position, false)
  body.setRotation(rotation, false)
  body.setLinvel(V_000, false)
  body.setAngvel(V_000, false)

  rigidBody.previousPosition.copy(position)
  rigidBody.previousRotation.copy(rotation)
  if (
    RigidBodyTypeTagComponent === RigidBodyKinematicPositionBasedTagComponent ||
    RigidBodyTypeTagComponent === RigidBodyKinematicVelocityBasedTagComponent
  ) {
    rigidBody.targetKinematicPosition.copy(position)
    rigidBody.targetKinematicRotation.copy(rotation)
  }
  rigidBody.position.copy(position)
  rigidBody.rotation.copy(rotation)
  rigidBody.linearVelocity.copy(V_000)
  rigidBody.angularVelocity.copy(V_000)

  // set entity in userdata for fast look up when required.
  const rigidBodyUserdata = { entity: entity }
  body.userData = rigidBodyUserdata

  return body
}

function applyDescToCollider(
  colliderDesc: ColliderDesc,
  shapeOptions: ColliderDescOptions,
  position?: Vector3,
  quaternion?: Quaternion
) {
  if (typeof shapeOptions.friction !== 'undefined') colliderDesc.setFriction(shapeOptions.friction)
  if (typeof shapeOptions.restitution !== 'undefined') colliderDesc.setRestitution(shapeOptions.restitution)

  const collisionLayer =
    typeof shapeOptions.collisionLayer !== 'undefined' ? Number(shapeOptions.collisionLayer) : CollisionGroups.Default
  const collisionMask =
    typeof shapeOptions.collisionMask !== 'undefined' ? Number(shapeOptions.collisionMask) : DefaultCollisionMask
  colliderDesc.setCollisionGroups(getInteractionGroups(collisionLayer, collisionMask))

  if (position) colliderDesc.setTranslation(position.x, position.y, position.z)
  if (quaternion) colliderDesc.setRotation(quaternion)

  if (typeof shapeOptions.isTrigger !== 'undefined') colliderDesc.setSensor(shapeOptions.isTrigger)

  shapeOptions.activeCollisionTypes
    ? colliderDesc.setActiveCollisionTypes(shapeOptions.activeCollisionTypes)
    : colliderDesc.setActiveCollisionTypes(ActiveCollisionTypes.ALL)
  colliderDesc.setActiveEvents(ActiveEvents.COLLISION_EVENTS)

  return colliderDesc
}

function createColliderDesc(entity: Entity, rootEntity: Entity, colliderDescOptions: ColliderOptions) {
  const mesh = getOptionalComponent(entity, MeshComponent)

  let shape =
    typeof colliderDescOptions.shape === 'string' ? ShapeType[colliderDescOptions.shape] : colliderDescOptions.shape

  //check for old collider types to allow backwards compatibility
  if (typeof shape === 'undefined') {
    switch (colliderDescOptions.shape) {
      case 'sphere':
        shape = ShapeType.Ball
        break
      case 'box':
      case 'plane':
        shape = ShapeType.Cuboid
        break
      case 'mesh':
        shape = ShapeType.TriMesh
        break
      case 'capsule':
        shape = ShapeType.Capsule
        break
      case 'cylinder':
        shape = ShapeType.Cylinder
        break
      default:
        console.error('unrecognized collider shape type: ' + colliderDescOptions.shape)
    }
  }

  const scale = TransformComponent.getWorldScale(entity, new Vector3())

  if (mesh?.geometry?.type === 'BoxGeometry') {
    scale.multiplyScalar(0.5)
  }

  let colliderDesc: ColliderDesc

  switch (shape as ShapeType) {
    case ShapeType.Cuboid:
      if (colliderDescOptions.shape === 'plane') colliderDesc = ColliderDesc.cuboid(10000, 0.001, 10000)
      else colliderDesc = ColliderDesc.cuboid(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z))
      break

    case ShapeType.Ball:
      colliderDesc = ColliderDesc.ball(Math.abs(scale.x))
      break

    case ShapeType.Capsule:
      colliderDesc = ColliderDesc.capsule(Math.abs(scale.y), Math.abs(scale.x))
      break

    case ShapeType.Cylinder:
      colliderDesc = ColliderDesc.cylinder(Math.abs(scale.y), Math.abs(scale.x))
      break

    case ShapeType.ConvexPolyhedron: {
      if (!mesh?.geometry)
        return console.warn('[Physics]: Tried to load convex mesh but did not find a geometry', mesh) as any
      try {
        const _buff = mesh.geometry.clone().scale(scale.x, scale.y, scale.z)
        const vertices = new Float32Array((_buff.attributes.position as BufferAttribute).array)
        const indices = new Uint32Array(_buff.index!.array)
        colliderDesc = ColliderDesc.convexMesh(vertices, indices) as ColliderDesc
      } catch (e) {
        console.log('Failed to construct collider from trimesh geometry', mesh.geometry, e)
        return
      }
      break
    }

    case ShapeType.TriMesh: {
      if (!mesh?.geometry)
        return console.warn('[Physics]: Tried to load tri mesh but did not find a geometry', mesh) as any
      try {
        const _buff = mesh.geometry.clone().scale(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z))
        const vertices = new Float32Array((_buff.attributes.position as BufferAttribute).array)
        const indices = new Uint32Array(_buff.index!.array)
        colliderDesc = ColliderDesc.trimesh(vertices, indices)
      } catch (e) {
        console.log('Failed to construct collider from trimesh geometry', mesh.geometry, e)
        return
      }
      break
    }

    default:
      console.error('unknown shape', colliderDescOptions)
      return
  }

  const positionRelativeToRoot = new Vector3()
  const quaternionRelativeToRoot = new Quaternion()

  const transform = getComponent(entity, TransformComponent)
  const rootTransform = getComponent(rootEntity, TransformComponent)

  // get matrix relative to root
  if (rootEntity !== entity) {
    const matrixRelativeToRoot = new Matrix4()
    matrixRelativeToRoot.copy(rootTransform.matrixWorld).invert().multiply(transform.matrixWorld)
    matrixRelativeToRoot.decompose(positionRelativeToRoot, quaternionRelativeToRoot, new Vector3())
  }

  const worldScale = TransformComponent.getWorldScale(rootEntity, new Vector3())

  Physics.applyDescToCollider(
    colliderDesc,
    {
      ...colliderDescOptions,
      isTrigger: hasComponent(entity, TriggerComponent)
    },
    positionRelativeToRoot.multiply(worldScale),
    quaternionRelativeToRoot
  )

  return colliderDesc
}

/** @deprecated */
function createRigidBodyForGroup(entity: Entity, world: World, colliderDescOptions: ColliderDescOptions) {
  const colliderDescs = [] as ColliderDesc[]
  const meshesToRemove = [] as Mesh[]

  iterateEntityNode(entity, (child) => {
    const mesh = getOptionalComponent(child, MeshComponent)
    if (!mesh) return // || ((mesh?.geometry.attributes['position'] as BufferAttribute).array.length ?? 0 === 0)) return
    if (mesh.userData.type && mesh.userData.type !== ('glb' as any)) mesh.userData.shapeType = mesh.userData.type

    const args = { ...colliderDescOptions, ...mesh.userData } as ColliderOptions & ColliderDescOptions
    if (args.shapeType) args.shape = OldShapeTypes[args.shapeType]
    if (args.isTrigger) setComponent(child, TriggerComponent)
    const colliderDesc = createColliderDesc(child, entity, args)

    if (colliderDesc) {
      meshesToRemove.push(mesh)
      colliderDescs.push(colliderDesc)
    }
  })

  const rigidBodyType =
    typeof colliderDescOptions.bodyType === 'string'
      ? RigidBodyType[colliderDescOptions.bodyType]
      : colliderDescOptions.bodyType

  let rigidBodyDesc: RigidBodyDesc = undefined!
  switch (rigidBodyType) {
    case RigidBodyType.Dynamic:
    default:
      rigidBodyDesc = RigidBodyDesc.dynamic()
      break

    case RigidBodyType.Fixed:
      rigidBodyDesc = RigidBodyDesc.fixed()
      break

    case RigidBodyType.KinematicPositionBased:
      rigidBodyDesc = RigidBodyDesc.kinematicPositionBased()
      break

    case RigidBodyType.KinematicVelocityBased:
      rigidBodyDesc = RigidBodyDesc.kinematicVelocityBased()
      break
  }

  Physics.createRigidBody(entity, world, rigidBodyDesc, colliderDescs)

  return meshesToRemove
}

function createColliderAndAttachToRigidBody(world: World, colliderDesc: ColliderDesc, rigidBody: RigidBody): Collider {
  return world.createCollider(colliderDesc, rigidBody)
}

function createCharacterController(
  world: World,
  {
    offset = 0.01,
    maxSlopeClimbAngle = (60 * Math.PI) / 180,
    minSlopeSlideAngle = (30 * Math.PI) / 180,
    autoStep = { maxHeight: 0.5, minWidth: 0.01, stepOverDynamic: true },
    enableSnapToGround = 0.1 as number | false
  }
) {
  const characterController = world.createCharacterController(offset)
  characterController.setMaxSlopeClimbAngle(maxSlopeClimbAngle)
  characterController.setMinSlopeSlideAngle(minSlopeSlideAngle)
  if (autoStep) characterController.enableAutostep(autoStep.maxHeight, autoStep.minWidth, autoStep.stepOverDynamic)
  if (enableSnapToGround) characterController.enableSnapToGround(enableSnapToGround)
  else characterController.disableSnapToGround()
  return characterController
}

function removeCollidersFromRigidBody(entity: Entity, world: World) {
  const rigidBody = getComponent(entity, RigidBodyComponent).body
  const numColliders = rigidBody.numColliders()
  for (let index = 0; index < numColliders; index++) {
    const collider = rigidBody.collider(0)
    world.removeCollider(collider, true)
  }
}

function removeRigidBody(entity: Entity, world: World) {
  removeComponent(entity, RigidBodyComponent)
}

function changeRigidbodyType(entity: Entity, newType: RigidBodyType) {
  const rigidBody = getComponent(entity, RigidBodyComponent).body
  if (newType === rigidBody.bodyType()) return
  const currentRigidBodyTypeTagComponent = getTagComponentForRigidBody(rigidBody.bodyType())

  removeComponent(entity, currentRigidBodyTypeTagComponent)

  rigidBody.setBodyType(newType, false)

  const newRigidBodyComponent = getTagComponentForRigidBody(rigidBody.bodyType())
  setComponent(entity, newRigidBodyComponent, true)
}

export type RaycastArgs = {
  type: SceneQueryType
  origin: Vector3
  direction: Vector3
  maxDistance: number
  groups: InteractionGroups
  flags?: QueryFilterFlags
  excludeCollider?: Collider
  excludeRigidBody?: RigidBody
}

function castRay(
  world: Immutable<World>,
  raycastQuery: RaycastArgs,
  filterPredicate?: (collider: Collider) => boolean
) {
  const ray = new Ray(raycastQuery.origin, raycastQuery.direction)
  const maxToi = raycastQuery.maxDistance
  const solid = true // TODO: Add option for this in args
  const groups = raycastQuery.groups
  const flags = raycastQuery.flags

  const hits = [] as RaycastHit[]
  const hitWithNormal = world.castRayAndGetNormal(
    ray,
    maxToi,
    solid,
    flags,
    groups,
    raycastQuery.excludeCollider,
    raycastQuery.excludeRigidBody,
    filterPredicate
  )
  if (hitWithNormal?.collider) {
    const body = hitWithNormal.collider.parent() as RigidBody
    hits.push({
      collider: hitWithNormal.collider,
      distance: hitWithNormal.toi,
      position: ray.pointAt(hitWithNormal.toi),
      normal: hitWithNormal.normal,
      body,
      entity: (body.userData as any)['entity']
    })
  }

  return hits
}

function castRayFromCamera(
  camera: PerspectiveCamera | OrthographicCamera,
  coords: Vector2,
  world: Immutable<World>,
  raycastQuery: RaycastArgs,
  filterPredicate?: (collider: Collider) => boolean
) {
  if ((camera as PerspectiveCamera).isPerspectiveCamera) {
    raycastQuery.origin.setFromMatrixPosition(camera.matrixWorld)
    raycastQuery.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(raycastQuery.origin).normalize()
  } else if ((camera as OrthographicCamera).isOrthographicCamera) {
    raycastQuery.origin
      .set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far))
      .unproject(camera)
    raycastQuery.direction.set(0, 0, -1).transformDirection(camera.matrixWorld)
  }
  return Physics.castRay(world, raycastQuery, filterPredicate)
}

export type ShapecastArgs = {
  type: SceneQueryType
  hits: RaycastHit[]
  collider: Collider
  direction: Vector3
  maxDistance: number
  collisionGroups: InteractionGroups
}

function castShape(world: World, shapecastQuery: ShapecastArgs) {
  const maxToi = shapecastQuery.maxDistance
  const groups = shapecastQuery.collisionGroups
  const collider = shapecastQuery.collider

  shapecastQuery.hits = []
  const hitWithNormal = world.castShape(
    collider.translation(),
    collider.rotation(),
    shapecastQuery.direction,
    collider.shape,
    maxToi,
    true,
    groups
  )
  if (hitWithNormal != null) {
    shapecastQuery.hits.push({
      distance: hitWithNormal.toi,
      position: hitWithNormal.witness1,
      normal: hitWithNormal.normal1,
      collider: hitWithNormal.collider,
      body: hitWithNormal.collider.parent() as RigidBody,
      entity: (hitWithNormal.collider.parent()?.userData as any)['entity'] ?? UndefinedEntity
    })
  }
}

const drainCollisionEventQueue = (physicsWorld: World) => (handle1: number, handle2: number, started: boolean) => {
  const collider1 = physicsWorld.getCollider(handle1)
  const collider2 = physicsWorld.getCollider(handle2)
  if (!collider1 || !collider2) return

  const isTriggerEvent = collider1.isSensor() || collider2.isSensor()
  const rigidBody1 = collider1.parent()
  const rigidBody2 = collider2.parent()
  const entity1 = (rigidBody1?.userData as any)['entity']
  const entity2 = (rigidBody2?.userData as any)['entity']

  setComponent(entity1, CollisionComponent)
  setComponent(entity2, CollisionComponent)

  const collisionComponent1 = getComponent(entity1, CollisionComponent)
  const collisionComponent2 = getComponent(entity2, CollisionComponent)

  if (started) {
    const type = isTriggerEvent ? CollisionEvents.TRIGGER_START : CollisionEvents.COLLISION_START
    collisionComponent1?.set(entity2, {
      type,
      bodySelf: rigidBody1 as RigidBody,
      bodyOther: rigidBody2 as RigidBody,
      shapeSelf: collider1 as Collider,
      shapeOther: collider2 as Collider,
      maxForceDirection: null,
      totalForce: null
    })
    collisionComponent2?.set(entity1, {
      type,
      bodySelf: rigidBody2 as RigidBody,
      bodyOther: rigidBody1 as RigidBody,
      shapeSelf: collider2 as Collider,
      shapeOther: collider1 as Collider,
      maxForceDirection: null,
      totalForce: null
    })
  } else {
    const type = isTriggerEvent ? CollisionEvents.TRIGGER_END : CollisionEvents.COLLISION_END
    if (collisionComponent1?.has(entity2)) collisionComponent1.get(entity2)!.type = type
    if (collisionComponent2?.has(entity1)) collisionComponent2.get(entity1)!.type = type
  }
}

const drainContactEventQueue = (physicsWorld: World) => (event: TempContactForceEvent) => {
  const collider1 = physicsWorld.getCollider(event.collider1())
  const collider2 = physicsWorld.getCollider(event.collider2())

  const rigidBody1 = collider1.parent()
  const rigidBody2 = collider2.parent()
  const entity1 = (rigidBody1?.userData as any)['entity']
  const entity2 = (rigidBody2?.userData as any)['entity']

  const collisionComponent1 = getOptionalComponent(entity1, CollisionComponent)
  const collisionComponent2 = getOptionalComponent(entity2, CollisionComponent)

  const collision1 = collisionComponent1?.get(entity2)
  const collision2 = collisionComponent2?.get(entity1)

  const maxForceDirection = event.maxForceDirection()
  const totalForce = event.totalForce()

  if (collision1) {
    collision1.maxForceDirection = maxForceDirection
    collision1.totalForce = totalForce
  }

  if (collision2) {
    collision2.maxForceDirection = maxForceDirection
    collision2.totalForce = totalForce
  }
}

export const Physics = {
  load,
  createWorld,
  createRigidBody,
  createColliderDesc,
  applyDescToCollider,
  createRigidBodyForGroup,
  createCharacterController,
  createColliderAndAttachToRigidBody,
  removeCollidersFromRigidBody,
  removeRigidBody,
  changeRigidbodyType,
  castRay,
  castRayFromCamera,
  castShape,
  createCollisionEventQueue,
  drainCollisionEventQueue,
  drainContactEventQueue
}
