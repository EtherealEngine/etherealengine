import {
  AxesHelper,
  ConeGeometry,
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  Plane,
  Quaternion,
  Ray,
  RingGeometry,
  SphereGeometry,
  Vector3
} from 'three'

import { smootheLerpAlpha } from '@xrengine/common/src/utils/smootheLerpAlpha'
import { createActionQueue, getState, removeActionQueue } from '@xrengine/hyperflux'

import { V_010 } from '../common/constants/MathConstants'
import { extractRotationAboutAxis } from '../common/functions/MathFunctions'
import { Engine } from '../ecs/classes/Engine'
import { Entity } from '../ecs/classes/Entity'
import { World } from '../ecs/classes/World'
import {
  defineQuery,
  getComponent,
  hasComponent,
  removeComponent,
  removeQuery,
  setComponent
} from '../ecs/functions/ComponentFunctions'
import { createEntity } from '../ecs/functions/EntityFunctions'
import {
  addObjectToGroup,
  GroupComponent,
  removeGroupComponent,
  removeObjectFromGroup
} from '../scene/components/GroupComponent'
import { NameComponent } from '../scene/components/NameComponent'
import { VisibleComponent } from '../scene/components/VisibleComponent'
import { ObjectLayers } from '../scene/constants/ObjectLayers'
import { setObjectLayers } from '../scene/functions/setObjectLayers'
import { setTransformComponent, TransformComponent } from '../transform/components/TransformComponent'
import { computeTransformMatrix } from '../transform/systems/TransformSystem'
import { updateWorldOriginFromViewerHit } from '../transform/updateWorldOrigin'
import { XRAnchorComponent, XRHitTestComponent } from './XRComponents'
import { ReferenceSpace, XRAction, XRReceptors, XRState } from './XRState'

const _mat4 = new Matrix4()
const emptyVec3 = new Vector3()

/**
 * Sets the origin reference space entity's transform to the results of
 * a hit test performed from the viewer's reference space.
 * @param entity
 */
export const updateHitTest = (entity: Entity, world = Engine.instance.currentWorld) => {
  const xrFrame = Engine.instance.xrFrame!

  const hitTestComponent = getComponent(entity, XRHitTestComponent)

  if (hitTestComponent.hitTestSource) {
    const transform = getComponent(entity, TransformComponent)
    const hitTestResults = xrFrame.getHitTestResults(hitTestComponent.hitTestSource!)
    if (hitTestResults.length) {
      const hit = hitTestResults[0]
      const hitPose = hit.getPose(ReferenceSpace.localFloor!)!
      const originTransform = getComponent(world.originEntity, TransformComponent)
      /** convert from local floor space to world space */
      transform.matrix.multiplyMatrices(originTransform.matrixInverse, _mat4.fromArray(hitPose.transform.matrix))
      transform.matrix.decompose(transform.position, transform.rotation, emptyVec3)
      hitTestComponent.hitTestResult = hit
      return hit
    }
  }

  hitTestComponent.hitTestResult = null
}

export const updateAnchor = (entity: Entity, world = Engine.instance.currentWorld) => {
  const anchor = getComponent(entity, XRAnchorComponent).anchor
  const xrFrame = Engine.instance.xrFrame!
  const localFloorReferenceSpace = ReferenceSpace.localFloor
  if (anchor && localFloorReferenceSpace) {
    const pose = xrFrame.getPose(anchor.anchorSpace, localFloorReferenceSpace)
    if (pose) {
      const transform = getComponent(entity, TransformComponent)
      const originTransform = getComponent(world.originEntity, TransformComponent)
      /** convert from local floor space to world space */
      transform.matrix.multiplyMatrices(originTransform.matrixInverse, _mat4.fromArray(pose.transform.matrix))
      transform.matrix.decompose(transform.position, transform.rotation, emptyVec3)
    }
  }
}

const _vecPosition = new Vector3()
const _vecScale = new Vector3()
const _quat = new Quaternion()
const _quat180 = new Quaternion().setFromAxisAngle(V_010, Math.PI)

const smoothedViewerHitResultPose = {
  position: new Vector3(),
  rotation: new Quaternion()
}
const smoothedSceneScale = new Vector3()

const _vec = new Vector3()
const _vec2 = new Vector3()
const _quat2 = new Quaternion()
const _ray = new Ray()

const pos = new Vector3()
const orient = new Quaternion()

/** AR placement for immersive session */
export const getHitTestFromController = (world = Engine.instance.currentWorld) => {
  const referenceSpace = ReferenceSpace.origin!
  const pose = Engine.instance.xrFrame!.getPose(world.inputSources[0].targetRaySpace, referenceSpace)!
  const { position, orientation } = pose.transform

  pos.copy(position as any as Vector3)
  orient.copy(orientation as any as Quaternion)

  // raycast controller to ground
  _ray.set(pos, _vec2.set(0, 0, -1).applyQuaternion(orient))
  const hit = _ray.intersectPlane(_plane.set(V_010, 0), _vec)

  if (!hit) return

  /** swing twist quaternion decomposition to get the rotation around Y axis */
  extractRotationAboutAxis(orient, V_010, _quat2)

  _quat2.multiply(_quat180)

  return {
    position: _vec,
    rotation: _quat2
  }
}

/** AR placement for non immersive / mobile session */
export const getHitTestFromViewer = (world = Engine.instance.currentWorld) => {
  const xrState = getState(XRState)

  const viewerHitTestEntity = xrState.viewerHitTestEntity.value

  computeTransformMatrix(viewerHitTestEntity)

  const hitTestComponent = getComponent(viewerHitTestEntity, XRHitTestComponent)

  /** Swipe to rotate */
  if (hitTestComponent?.hitTestResult) {
    const placementInputSource = xrState.scenePlacementMode.value!
    const swipe = placementInputSource.gamepad?.axes ?? []
    if (swipe.length) {
      const delta = swipe[0] - (lastSwipeValue ?? 0)
      if (lastSwipeValue) xrState.sceneRotationOffset.set((val) => (val += delta / (world.deltaSeconds * 20)))
      lastSwipeValue = swipe[0]
    } else {
      lastSwipeValue = null
    }
  } else {
    lastSwipeValue = null
  }

  return getComponent(viewerHitTestEntity, TransformComponent)
}

const _plane = new Plane()
let lastSwipeValue = null! as null | number
const scaledCameraPosition = new Vector3()
const scaledHitPosition = new Vector3()

/**
 * Updates the transform of the origin reference space to manipulate the
 * camera inversely to represent scaling the scene.
 * @param world
 */
export const updatePlacementMode = (world = Engine.instance.currentWorld) => {
  const xrState = getState(XRState)

  const placementInputSource = xrState.scenePlacementMode.value!

  const hitTransform =
    placementInputSource.targetRayMode === 'tracked-pointer'
      ? getHitTestFromController(world)
      : getHitTestFromViewer(world)
  if (!hitTransform) return

  const cameraTransform = getComponent(world.cameraEntity, TransformComponent)
  const sceneScale = xrState.sceneScale.value
  scaledCameraPosition.copy(cameraTransform.position).multiplyScalar(sceneScale)
  scaledHitPosition.copy(hitTransform.position).multiplyScalar(sceneScale)
  // console.log(scaledCameraPosition, scaledHitPosition)
  const upDir = _vecPosition.set(0, 1, 0).applyQuaternion(hitTransform.rotation)
  const dist = _plane.setFromNormalAndCoplanarPoint(upDir, scaledHitPosition).distanceToPoint(scaledCameraPosition)

  /**
   * Lock lifesize to 1:1, whereas dollhouse mode uses
   * the distance from the camera to the hit test plane.
   */
  const minDollhouseScale = 0.01
  const maxDollhouseScale = 0.2
  const minDollhouseDist = 0.01
  const maxDollhouseDist = 0.6
  const lifeSize = true
  // placementInputSource.targetRayMode === 'tracked-pointer' ||
  // (dist > maxDollhouseDist && upDir.angleTo(V_010) < Math.PI * 0.02)
  const targetScale = lifeSize
    ? 1
    : 1 /
      MathUtils.clamp(
        Math.pow((dist - minDollhouseDist) / maxDollhouseDist, 2) * maxDollhouseScale,
        minDollhouseScale,
        maxDollhouseScale
      )

  const targetScaleVector = _vecScale.setScalar(targetScale)
  const targetPosition = _vecPosition.copy(hitTransform.position).multiplyScalar(targetScaleVector.x)
  const targetRotation = hitTransform.rotation.multiply(
    _quat.setFromAxisAngle(V_010, xrState.sceneRotationOffset.value)
  )

  const lerpAlpha = smootheLerpAlpha(5, world.deltaSeconds)
  smoothedViewerHitResultPose.position.lerp(targetPosition, lerpAlpha)
  smoothedViewerHitResultPose.rotation.slerp(targetRotation, lerpAlpha)
  smoothedSceneScale.lerp(targetScaleVector, lerpAlpha)

  xrState.sceneScale.set(smoothedSceneScale.x)

  updateWorldOriginFromViewerHit(
    world,
    smoothedViewerHitResultPose.position,
    smoothedViewerHitResultPose.rotation,
    smoothedSceneScale
  )
}

/**
 * Updates materials with XR depth map uniforms
 * @param world
 * @returns
 */
export default async function XRAnchorSystem(world: World) {
  const xrState = getState(XRState)

  const scenePlacementEntity = createEntity()
  setComponent(scenePlacementEntity, NameComponent, 'xr-scene-placement')
  setTransformComponent(scenePlacementEntity)
  setComponent(scenePlacementEntity, VisibleComponent, true)

  const xrSessionChangedQueue = createActionQueue(XRAction.sessionChanged.matches)
  const changePlacementModeQueue = createActionQueue(XRAction.changePlacementMode.matches)

  xrState.viewerHitTestEntity.set(scenePlacementEntity)

  const originAxesHelper = new AxesHelper(10000)
  // setObjectLayers(originAxesHelper, ObjectLayers.Gizmos)
  setObjectLayers(originAxesHelper, ObjectLayers.Scene)
  addObjectToGroup(scenePlacementEntity, originAxesHelper)

  const pinSphereMesh = new Mesh(new SphereGeometry(0.025, 16, 16), new MeshBasicMaterial({ color: 'white' }))
  pinSphereMesh.position.setY(0.1125)
  const pinConeMesh = new Mesh(new ConeGeometry(0.01, 0.1, 16), new MeshBasicMaterial({ color: 'white' }))
  pinConeMesh.position.setY(0.05)
  pinConeMesh.rotateX(Math.PI)
  const worldOriginPinpointAnchor = new Group()
  worldOriginPinpointAnchor.name = 'world-origin-pinpoint-anchor'
  worldOriginPinpointAnchor.add(pinSphereMesh, pinConeMesh)

  const xrViewerHitTestMesh = new Mesh(new RingGeometry(0.08, 0.1, 16), new MeshBasicMaterial({ color: 'white' }))
  xrViewerHitTestMesh.geometry.rotateX(-Math.PI / 2)

  const xrHitTestQuery = defineQuery([XRHitTestComponent, TransformComponent])
  const xrAnchorQuery = defineQuery([XRAnchorComponent, TransformComponent])

  const execute = () => {
    for (const action of xrSessionChangedQueue()) {
      if (action.active) {
        if (xrState.sessionMode.value === 'immersive-ar') {
          const session = xrState.session.value!
          if ('requestHitTestSource' in session) {
            session.requestHitTestSource!({ space: ReferenceSpace.viewer! })?.then(xrState.viewerHitTestSource.set)
          }
        }
      } else {
        setTransformComponent(world.originEntity) // reset world origin
        xrState.scenePlacementMode.set(null)
        hasComponent(world.originEntity, XRAnchorComponent) && removeComponent(world.originEntity, XRAnchorComponent)

        for (const e of xrHitTestQuery()) removeComponent(e, XRHitTestComponent)
        for (const e of xrAnchorQuery()) removeComponent(e, XRAnchorComponent)
      }
    }

    if (!Engine.instance.xrFrame) return

    const changePlacementModeActions = changePlacementModeQueue()
    for (const action of changePlacementModeActions) {
      XRReceptors.scenePlacementMode(action)
      if (action.inputSource) {
        // adding it to the group component will render it transparent - we don't want that
        Engine.instance.currentWorld.scene.add(worldOriginPinpointAnchor)
      } else {
        worldOriginPinpointAnchor.removeFromParent()
      }
    }

    if (!!Engine.instance.xrFrame?.getHitTestResults) {
      if (xrState.viewerHitTestSource.value)
        if (changePlacementModeActions.length && changePlacementModeActions[0].inputSource) {
          setComponent(scenePlacementEntity, XRHitTestComponent, {
            hitTestSource: xrState.viewerHitTestSource.value
          })
        }
      for (const entity of xrHitTestQuery()) {
        const hit = updateHitTest(entity)
        if (entity === scenePlacementEntity && hit && changePlacementModeActions.length) {
          if (changePlacementModeActions[0].inputSource) {
            hasComponent(entity, XRAnchorComponent) && removeComponent(entity, XRAnchorComponent)
          } else {
            // detect support for anchors
            if (typeof hit.createAnchor === 'function') {
              // @ts-ignore - types are incorrect for frame.createAnchor
              hit.createAnchor().then((anchor: XRAnchor) => {
                setComponent(entity, XRAnchorComponent, { anchor })
              })
            }
            hasComponent(entity, XRHitTestComponent) && removeComponent(entity, XRHitTestComponent)
          }
        }
      }
    }

    if (xrState.scenePlacementMode.value) updatePlacementMode(world)

    // for (const entity of xrAnchorQuery()) updateAnchor(entity, world)

    /**
     * Hit Test Helper
     */
    for (const entity of xrHitTestQuery()) {
      const hasHit = getComponent(entity, XRHitTestComponent).hitTestResult
      if (hasHit && !getComponent(entity, GroupComponent)?.includes(xrViewerHitTestMesh as any)) {
        addObjectToGroup(entity, xrViewerHitTestMesh)
      }
      if (!hasHit && getComponent(entity, GroupComponent)?.includes(xrViewerHitTestMesh as any)) {
        removeObjectFromGroup(entity, xrViewerHitTestMesh)
      }
    }

    for (const entity of xrHitTestQuery.exit()) {
      if (getComponent(entity, GroupComponent)?.includes(xrViewerHitTestMesh as any))
        removeObjectFromGroup(entity, xrViewerHitTestMesh)
    }

    /** update transform from origin manually and update matrix */
    if (worldOriginPinpointAnchor.parent === Engine.instance.currentWorld.scene) {
      const origin = getComponent(world.originEntity, TransformComponent)
      worldOriginPinpointAnchor.position.copy(origin.position)
      worldOriginPinpointAnchor.quaternion.copy(origin.rotation)
      worldOriginPinpointAnchor.scale.copy(origin.scale)
      worldOriginPinpointAnchor.updateMatrixWorld(true)
    }
  }

  const cleanup = async () => {
    removeQuery(world, xrHitTestQuery)
    removeActionQueue(xrSessionChangedQueue)
  }

  return { execute, cleanup }
}
