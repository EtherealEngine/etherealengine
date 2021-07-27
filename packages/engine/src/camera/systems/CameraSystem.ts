import { Matrix4, Vector3 } from 'three'
import { addObject3DComponent } from '../../scene/behaviors/addObject3DComponent'
import { CameraTagComponent } from '../../scene/components/Object3DTagComponents'
import { isMobile } from '../../common/functions/isMobile'
import { NumericalType, Vector2Type } from '../../common/types/NumericalTypes'
import { Engine } from '../../ecs/classes/Engine'
import { System, SystemAttributes } from '../../ecs/classes/System'
import {
  addComponent,
  createEntity,
  getComponent,
  getMutableComponent,
  hasComponent,
  removeComponent
} from '../../ecs/functions/EntityFunctions'
import { CharacterComponent } from '../../character/components/CharacterComponent'
import { DesiredTransformComponent } from '../../transform/components/DesiredTransformComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { CameraComponent } from '../components/CameraComponent'
import { FollowCameraComponent } from '../components/FollowCameraComponent'
import { CameraModes } from '../types/CameraModes'
import { Entity } from '../../ecs/classes/Entity'
import { PhysicsSystem } from '../../physics/systems/PhysicsSystem'
import { RaycastQuery, SceneQueryType } from 'three-physx'
import { Not } from '../../ecs/functions/ComponentFunctions'
import { Input } from '../../input/components/Input'
import { BaseInput } from '../../input/enums/BaseInput'
import { PersistTagComponent } from '../../scene/components/PersistTagComponent'
import { SystemUpdateType } from '../../ecs/functions/SystemUpdateType'
import { EngineEvents } from '../../ecs/classes/EngineEvents'

const direction = new Vector3()
const upVector = new Vector3(0, 1, 0)
const empty = new Vector3()
const PI_2Deg = Math.PI / 180
const mx = new Matrix4()
const vec3 = new Vector3()

/**
 * Calculates and returns view vector for give angle. View vector will be at the given angle after the calculation
 * @param viewVector Current view vector
 * @param angle angle to which view vector will be rotated
 * @param isDegree Whether the angle is in degree or radian
 * @returns View vector having given angle in the world space
 */
export const getViewVectorFromAngle = (viewVector: Vector3, angle: number, isDegree?: boolean): Vector3 => {
  if (isDegree) {
    angle = (angle * Math.PI) / 180 // Convert to Radian
  }

  const oldAngle = Math.atan2(viewVector.x, viewVector.z)

  // theta - newTheta ==> To rotate Left on mouse drage Right -> Left
  // newTheta - theta ==> To rotate Right on mouse drage Right -> Left
  const dif = oldAngle - angle

  if (Math.abs(dif) % Math.PI < 0.001) return viewVector

  return new Vector3(Math.sin(oldAngle - dif), 0, Math.cos(oldAngle - dif))
}

const followCameraBehavior = (entity: Entity, portCamera?: boolean) => {
  if (!entity) return

  const cameraDesiredTransform = getMutableComponent(CameraSystem.instance.activeCamera, DesiredTransformComponent) // Camera

  if (!cameraDesiredTransform && !portCamera) return

  const actor = getMutableComponent(entity, CharacterComponent)
  const actorTransform = getMutableComponent(entity, TransformComponent)

  const followCamera = getMutableComponent(entity, FollowCameraComponent)

  const inputComponent = getComponent(entity, Input)

  // this is for future integration of MMO style pointer lock controls
  // const inputAxes = followCamera.mode === CameraModes.FirstPerson ? BaseInput.MOUSE_MOVEMENT : BaseInput.LOOKTURN_PLAYERONE
  const inputAxes = BaseInput.LOOKTURN_PLAYERONE

  const inputValue = inputComponent.data.get(inputAxes)?.value ?? ([0, 0] as Vector2Type)

  const theta = Math.atan2(actor.viewVector.x, actor.viewVector.z)

  if (followCamera.locked) {
    followCamera.theta = (theta * 180) / Math.PI + 180
  }

  followCamera.theta -= inputValue[0] * (isMobile ? 60 : 100)
  followCamera.theta %= 360

  followCamera.phi -= inputValue[1] * (isMobile ? 60 : 100)
  followCamera.phi = Math.min(85, Math.max(-70, followCamera.phi))

  let camDist = followCamera.distance
  if (followCamera.mode === CameraModes.FirstPerson) camDist = 0.01
  else if (followCamera.mode === CameraModes.ShoulderCam) camDist = followCamera.minDistance
  else if (followCamera.mode === CameraModes.TopDown) camDist = followCamera.maxDistance

  const phi = followCamera.mode === CameraModes.TopDown ? 85 : followCamera.phi

  vec3.set(followCamera.shoulderSide ? -0.2 : 0.2, actor.actorHeight + 0.25, 0)
  vec3.applyQuaternion(actorTransform.rotation)
  vec3.add(actorTransform.position)

  // Raycast for camera
  const cameraTransform = getMutableComponent(CameraSystem.instance.activeCamera, TransformComponent)
  const raycastDirection = new Vector3().subVectors(cameraTransform.position, vec3).normalize()
  followCamera.raycastQuery.origin.copy(vec3)
  followCamera.raycastQuery.direction.copy(raycastDirection)

  const closestHit = followCamera.raycastQuery.hits[0]
  followCamera.rayHasHit = typeof closestHit !== 'undefined'

  if (followCamera.mode !== CameraModes.FirstPerson && followCamera.rayHasHit && closestHit.distance < camDist) {
    if (closestHit.distance < 0.5) {
      camDist = closestHit.distance
    } else {
      camDist = closestHit.distance - 0.5
    }
  }

  cameraDesiredTransform.position.set(
    vec3.x + camDist * Math.sin(followCamera.theta * PI_2Deg) * Math.cos(phi * PI_2Deg),
    vec3.y + camDist * Math.sin(phi * PI_2Deg),
    vec3.z + camDist * Math.cos(followCamera.theta * PI_2Deg) * Math.cos(phi * PI_2Deg)
  )

  direction.copy(cameraDesiredTransform.position).sub(vec3).normalize()

  mx.lookAt(direction, empty, upVector)
  cameraDesiredTransform.rotation.setFromRotationMatrix(mx)

  if (followCamera.mode === CameraModes.FirstPerson || portCamera) {
    cameraTransform.position.copy(cameraDesiredTransform.position)
    cameraTransform.rotation.copy(cameraDesiredTransform.rotation)
  }

  if (followCamera.locked || followCamera.mode === CameraModes.FirstPerson) {
    const newTheta = ((followCamera.theta - 180) * Math.PI) / 180

    // Rotate actor
    actorTransform.rotation.setFromAxisAngle(upVector, newTheta)

    // Update the view vector
    const newViewVector = getViewVectorFromAngle(actor.viewVector, newTheta)
    if (actor.viewVector !== newViewVector) {
      actor.viewVector.copy(newViewVector)
    }
  }
}

export const resetFollowCamera = () => {
  const transform = getComponent(CameraSystem.instance.activeCamera, TransformComponent)
  const desiredTransform = getComponent(CameraSystem.instance.activeCamera, DesiredTransformComponent)
  if (transform && desiredTransform) {
    followCameraBehavior(getMutableComponent(CameraSystem.instance.activeCamera, CameraComponent).followTarget)
    transform.position.copy(desiredTransform.position)
    transform.rotation.copy(desiredTransform.rotation)
  }
}

/** System class which provides methods for Camera system. */
export class CameraSystem extends System {
  static instance: CameraSystem

  updateType = SystemUpdateType.Free

  activeCamera: Entity
  prevState = [0, 0] as NumericalType

  portCamera: boolean = false

  /** Constructs camera system. */
  constructor(attributes: SystemAttributes = {}) {
    super(attributes)
    CameraSystem.instance = this

    const cameraEntity = createEntity()
    addComponent(cameraEntity, CameraComponent)
    addComponent(cameraEntity, CameraTagComponent)
    addObject3DComponent(cameraEntity, { obj3d: Engine.camera })
    addComponent(cameraEntity, TransformComponent)
    addComponent(cameraEntity, PersistTagComponent)
    CameraSystem.instance.activeCamera = cameraEntity

    // If we lose focus on the window, and regain it, copy our desired transform to avoid strange transform behavior and clipping
    EngineEvents.instance.addEventListener(EngineEvents.EVENTS.WINDOW_FOCUS, ({ focused }) => {
      if (focused) {
        resetFollowCamera()
      }
    })
  }

  /**
   * Execute the camera system for different events of queries.\
   * Called each frame by default.
   *
   * @param delta time since last frame.
   */
  execute(delta: number): void {
    this.queryResults.followCameraComponent.added?.forEach((entity) => {
      const cameraFollow = getMutableComponent(entity, FollowCameraComponent)
      cameraFollow.raycastQuery = PhysicsSystem.instance.addRaycastQuery(
        new RaycastQuery({
          type: SceneQueryType.Closest,
          origin: new Vector3(),
          direction: new Vector3(0, -1, 0),
          maxDistance: 10,
          collisionMask: cameraFollow.collisionMask
        })
      )
      const activeCameraComponent = getMutableComponent(CameraSystem.instance.activeCamera, CameraComponent)
      activeCameraComponent.followTarget = entity
      if (hasComponent(CameraSystem.instance.activeCamera, DesiredTransformComponent)) {
        removeComponent(CameraSystem.instance.activeCamera, DesiredTransformComponent)
      }
      addComponent(CameraSystem.instance.activeCamera, DesiredTransformComponent, {
        lockRotationAxis: [false, true, false],
        rotationRate: isMobile ? 5 : 3.5,
        positionRate: isMobile ? 3.5 : 2
      })
      resetFollowCamera()
    })

    this.queryResults.followCameraComponent.removed?.forEach((entity) => {
      const cameraFollow = getComponent(entity, FollowCameraComponent, true)
      if (cameraFollow) PhysicsSystem.instance.removeRaycastQuery(cameraFollow.raycastQuery)
      const activeCameraComponent = getMutableComponent(CameraSystem.instance.activeCamera, CameraComponent)
      if (activeCameraComponent) {
        activeCameraComponent.followTarget = null
        removeComponent(CameraSystem.instance.activeCamera, DesiredTransformComponent) as DesiredTransformComponent
      }
    })

    // follow camera component should only ever be on the character
    this.queryResults.followCameraComponent.all?.forEach((entity) => {
      followCameraBehavior(entity, this.portCamera)
    })
  }
}

/**
 * Queries must have components attribute which defines the list of components
 */
CameraSystem.queries = {
  cameraComponent: {
    components: [Not(FollowCameraComponent), CameraComponent, TransformComponent],
    listen: {
      added: true,
      changed: true
    }
  },
  followCameraComponent: {
    components: [FollowCameraComponent, TransformComponent, CharacterComponent],
    listen: {
      added: true,
      changed: true,
      removed: true
    }
  }
}
