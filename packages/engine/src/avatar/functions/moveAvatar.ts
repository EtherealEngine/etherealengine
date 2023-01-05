import { Collider, QueryFilterFlags } from '@dimforge/rapier3d-compat'
import { Matrix4, Quaternion, Vector2, Vector3 } from 'three'

import { getState } from '@xrengine/hyperflux'

import { ObjectDirection } from '../../common/constants/Axis3D'
import { V_00, V_000, V_010 } from '../../common/constants/MathConstants'
import checkPositionIsValid from '../../common/functions/checkPositionIsValid'
import { Engine } from '../../ecs/classes/Engine'
import { EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import { World } from '../../ecs/classes/World'
import {
  ComponentType,
  getComponent,
  hasComponent,
  removeComponent,
  setComponent
} from '../../ecs/functions/ComponentFunctions'
import { NetworkObjectAuthorityTag } from '../../networking/components/NetworkObjectComponent'
import { Physics } from '../../physics/classes/Physics'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { CollisionGroups } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { teleportObject } from '../../physics/systems/PhysicsSystem'
import { SceneQueryType } from '../../physics/types/PhysicsTypes'
import { LocalTransformComponent, TransformComponent } from '../../transform/components/TransformComponent'
import { getControlMode, XRState } from '../../xr/XRState'
import { AvatarSettings } from '../AvatarControllerSystem'
import { AvatarComponent } from '../components/AvatarComponent'
import { AvatarControllerComponent } from '../components/AvatarControllerComponent'
import { AvatarHeadDecapComponent } from '../components/AvatarIKComponents'
import { AvatarTeleportComponent } from '../components/AvatarTeleportComponent'
import { AvatarInputSettingsState } from '../state/AvatarInputSettingsState'
import { avatarRadius } from './spawnAvatarReceptor'

const _vec = new Vector3()
const _quat = new Quaternion()
const _quat2 = new Quaternion()

export const avatarCameraOffset = new Vector3(0, 0.14, 0.1)

/**
 * raycast internals
 */
const avatarGroundRaycast = {
  type: SceneQueryType.Closest,
  origin: new Vector3(),
  direction: ObjectDirection.Down,
  maxDistance: 1.1,
  groups: 0
}

//   const avatarInputState = getState(AvatarInputSettingsState)
//   /** teleport controls handled in AvatarInputSchema */
//   if (getControlMode() === 'attached' && avatarInputState.controlScheme.value === AvatarMovementScheme.Teleport) return

//   moveAvatar(entity)
// }

const cameraDirection = new Vector3()
const forwardOrientation = new Quaternion()
const targetWorldMovement = new Vector3()
const desiredMovement = new Vector3()

/**
 * Avatar movement via gamepad
 */
export const applyGamepadInput = (entity: Entity) => {
  if (!entity) return

  const world = Engine.instance.currentWorld
  const camera = world.camera
  const fixedDeltaSeconds = world.fixedDeltaSeconds
  const controller = getComponent(entity, AvatarControllerComponent)
  const rigidbody = getComponent(entity, RigidBodyComponent)

  const lerpAlpha = 6 * fixedDeltaSeconds
  const legSpeed = controller.isWalking ? AvatarSettings.instance.walkSpeed : AvatarSettings.instance.runSpeed
  camera.getWorldDirection(cameraDirection).setY(0).normalize()
  forwardOrientation.setFromUnitVectors(ObjectDirection.Forward, cameraDirection)

  targetWorldMovement
    .copy(controller.gamepadLocalInput)
    .multiplyScalar(legSpeed * fixedDeltaSeconds)
    .applyQuaternion(forwardOrientation)

  /** compute smoothed movement in the world XZ plane */
  controller.gamepadWorldMovement.lerp(targetWorldMovement, lerpAlpha)

  // set vertical velocity on ground
  if (!controller.isInAir) {
    controller.verticalVelocity = 0
    if (controller.gamepadJumpActive) {
      if (!controller.isJumping) {
        // Formula: takeoffVelocity = sqrt(2 * jumpHeight * gravity)
        controller.verticalVelocity = Math.sqrt(2 * AvatarSettings.instance.jumpHeight * 9.81)
        controller.isJumping = true
      }
    } else if (controller.isJumping) {
      controller.isJumping = false
    }
  } else {
    controller.isJumping = false
  }

  // apply gravity
  controller.verticalVelocity -= 9.81 * fixedDeltaSeconds

  const verticalMovement = controller.verticalVelocity * fixedDeltaSeconds

  desiredMovement.copy(controller.viewerMovement)

  // viewer pose handles avatar movement in attached mode
  desiredMovement.x += controller.gamepadWorldMovement.x
  desiredMovement.z += controller.gamepadWorldMovement.z
  desiredMovement.y += verticalMovement

  const avatarCollisionGroups = controller.bodyCollider.collisionGroups() & ~CollisionGroups.Trigger

  controller.controller.computeColliderMovement(
    controller.bodyCollider,
    desiredMovement,
    QueryFilterFlags.EXCLUDE_SENSORS,
    avatarCollisionGroups
  )

  const computedMovement = controller.controller.computedMovement() as Vector3

  rigidbody.targetKinematicPosition.add(computedMovement)

  /** rapier's computed movement is a bit bugged, so do a small raycast at the avatar's feet to snap it to the ground if it's close enough */
  avatarGroundRaycast.origin.copy(rigidbody.targetKinematicPosition)
  avatarGroundRaycast.groups = avatarCollisionGroups
  avatarGroundRaycast.origin.y += 1
  const groundHits = Physics.castRay(world.physicsWorld, avatarGroundRaycast)
  // controller.isInAir = !controller.controller.computedGrounded()
  controller.isInAir = true
  if (groundHits.length) {
    const hit = groundHits[0]
    const controllerOffset = controller.controller.offset()
    rigidbody.targetKinematicPosition.y = hit.position.y + controllerOffset
    // hack for atached
    computedMovement.y -= hit.position.y + controllerOffset
    controller.isInAir = hit.distance > 1 + controllerOffset * 1.5
  }

  const attached = getControlMode() === 'attached'
  if (attached) {
    const originTransform = getComponent(world.originEntity, TransformComponent)
    originTransform.position.x += computedMovement.x - controller.viewerMovement.x
    originTransform.position.y += computedMovement.y - controller.viewerMovement.y
    originTransform.position.z += computedMovement.z - controller.viewerMovement.z
  }

  if (!controller.isInAir) controller.verticalVelocity = 0

  // apply rotation
  _avatarApplyRotation(entity)

  // reset desired movement
  controller.viewerMovement.copy(V_000)
}

const _mat4 = new Matrix4()

/**
 * Rotates a matrix around a point
 * @param matrix
 * @param point
 * @param rotation
 */
export const rotateMatrixAboutPoint = (matrix: Matrix4, point: Vector3, rotation: Quaternion) => {
  matrix.multiply(_mat4.makeTranslation(-point.x, -point.y, -point.z))
  matrix.multiply(_mat4.makeRotationFromQuaternion(rotation))
  matrix.multiply(_mat4.makeTranslation(point.x, point.y, point.z))
}

const vec3 = new Vector3()

/**
 * Rotates the avatar's rigidbody around the Y axis by a given angle
 * @param entity
 * @param angle
 */
export const rotateAvatar = (entity: Entity, angle: number) => {
  _quat.setFromAxisAngle(V_010, angle)
  const rigidBody = getComponent(entity, RigidBodyComponent)
  rigidBody.targetKinematicRotation.multiply(_quat)

  if (getControlMode() === 'attached') {
    const world = Engine.instance.currentWorld
    const worldOriginTransform = getComponent(world.originEntity, TransformComponent)
    rotateMatrixAboutPoint(
      worldOriginTransform.matrix,
      vec3.copy(rigidBody.targetKinematicPosition).applyMatrix4(worldOriginTransform.matrixInverse),
      _quat
    )
    worldOriginTransform.matrix.decompose(
      worldOriginTransform.position,
      worldOriginTransform.rotation,
      worldOriginTransform.scale
    )
  }
}

/**
 * Teleports the avatar to new position
 * @param entity
 * @param newPosition
 */
export const teleportAvatar = (entity: Entity, targetPosition: Vector3): void => {
  if (!hasComponent(entity, AvatarComponent)) {
    console.warn('Teleport avatar called on non-avatar entity')
    return
  }

  const raycastOrigin = targetPosition.clone()
  raycastOrigin.y += 0.1
  const { raycastHit } = checkPositionIsValid(raycastOrigin, false)

  if (raycastHit) {
    const pos = new Vector3().copy(raycastHit.position as Vector3)
    const transform = getComponent(entity, TransformComponent)
    teleportObject(entity, pos, transform.rotation)
  } else {
    console.log('invalid position', targetPosition, raycastHit)
  }
}

/**
 * Rotates the avatar
 * - if we are in attached mode, we dont need to do any extra rotation
 *     as this is done via the webxr camera automatically
 */
const _avatarApplyRotation = (entity: Entity) => {
  const isInVR = getControlMode() === 'attached'
  if (!isInVR) {
    if (hasComponent(entity, AvatarHeadDecapComponent)) {
      _rotateBodyTowardsCameraDirection(entity)
    } else {
      _rotateBodyTowardsVector(entity, getComponent(entity, RigidBodyComponent).linearVelocity)
    }
  }
}

const _cameraDirection = new Vector3()
const _mat = new Matrix4()

const rotMatrix = new Matrix4()
const targetOrientation = new Quaternion()

const _rotateBodyTowardsCameraDirection = (entity: Entity) => {
  const fixedDeltaSeconds = getState(EngineState).fixedDeltaSeconds.value
  const rigidbody = getComponent(entity, RigidBodyComponent)
  if (!rigidbody) return

  const cameraRotation = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent).rotation
  const direction = _cameraDirection.set(0, 0, 1).applyQuaternion(cameraRotation).setComponent(1, 0)
  targetOrientation.setFromRotationMatrix(_mat.lookAt(V_000, direction, V_010))
  rigidbody.targetKinematicRotation.slerp(targetOrientation, 3 * fixedDeltaSeconds)
}

const _velXZ = new Vector3()
const prevVectors = new Map<Entity, Vector3>()
const _rotateBodyTowardsVector = (entity: Entity, vector: Vector3) => {
  const rigidbody = getComponent(entity, RigidBodyComponent)
  if (!rigidbody) return

  let prevVector = prevVectors.get(entity)!
  if (!prevVector) {
    prevVector = new Vector3(0, 0, 1)
    prevVectors.set(entity, prevVector)
  }

  _velXZ.set(vector.x, 0, vector.z)
  const isZero = _velXZ.distanceTo(V_000) < 0.1
  if (isZero) _velXZ.copy(prevVector)
  if (!isZero) prevVector.copy(_velXZ)

  const fixedDeltaSeconds = getState(EngineState).fixedDeltaSeconds.value

  rotMatrix.lookAt(_velXZ, V_000, V_010)
  targetOrientation.setFromRotationMatrix(rotMatrix)

  rigidbody.targetKinematicRotation.slerp(targetOrientation, 3 * fixedDeltaSeconds)
}
