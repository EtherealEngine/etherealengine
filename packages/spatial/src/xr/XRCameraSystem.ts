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

import { ArrayCamera, PerspectiveCamera, Vector2, Vector3, Vector4 } from 'three'

import { defineActionQueue, getMutableState, getState, getStateUnsafe } from '@etherealengine/hyperflux'

import { AnimationSystemGroup } from '@etherealengine/ecs'
import { getComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { defineSystem } from '@etherealengine/ecs/src/SystemFunctions'
import { CameraComponent } from '../camera/components/CameraComponent'
import { V_111 } from '../common/constants/MathConstants'
import { EngineRenderer } from '../renderer/WebGLRendererSystem'
import { TransformComponent } from '../transform/components/TransformComponent'
import { XRRendererState } from './WebXRManager'
import { ReferenceSpace, XRAction, XRState } from './XRState'
import { XRSystem } from './XRSystem'

const cameraLPos = new Vector3()
const cameraRPos = new Vector3()

const cameraL = new PerspectiveCamera()
cameraL.layers.enable(1)
cameraL.viewport = new Vector4()
cameraL.matrixAutoUpdate = false
cameraL.matrixWorldAutoUpdate = false

const cameraR = new PerspectiveCamera()
cameraR.layers.enable(2)
cameraR.viewport = new Vector4()
cameraR.matrixAutoUpdate = false
cameraR.matrixWorldAutoUpdate = false

const cameraPool = [cameraL, cameraR]

const sessionChangedQueue = defineActionQueue(XRAction.sessionChanged.matches)

/**
 * Assumes 2 cameras that are parallel and share an X-axis, and that
 * the cameras' projection and world matrices have already been set.
 * And that near and far planes are identical for both cameras.
 * Visualization of scope technique: https://computergraphics.stackexchange.com/a/4765
 */
function updateProjectionFromCameraArrayUnion(camera: ArrayCamera) {
  if (camera.cameras.length !== 2) {
    // assume single camera setup
    camera.projectionMatrix.copy(cameraL.projectionMatrix)
    return
  }

  // TODO: verify this is actually an HMD setup, not projection mapping or something
  // update projection matrix for proper view frustum culling

  cameraLPos.setFromMatrixPosition(cameraL.matrixWorld)
  cameraRPos.setFromMatrixPosition(cameraR.matrixWorld)

  const ipd = cameraLPos.distanceTo(cameraRPos)

  const projL = cameraL.projectionMatrix.elements
  const projR = cameraR.projectionMatrix.elements

  // VR systems will have identical far and near planes, and
  // most likely identical top and bottom frustum extents.
  // Use the left camera for these values.
  const near = projL[14] / (projL[10] - 1)
  const far = projL[14] / (projL[10] + 1)
  const topFov = (projL[9] + 1) / projL[5]
  const bottomFov = (projL[9] - 1) / projL[5]

  const leftFov = (projL[8] - 1) / projL[0]
  const rightFov = (projR[8] + 1) / projR[0]
  const left = near * leftFov
  const right = near * rightFov

  // Calculate the new camera's position offset from the
  // left camera. xOffset should be roughly half `ipd`.
  const zOffset = ipd / (-leftFov + rightFov)
  const xOffset = zOffset * -leftFov

  // TODO: Better way to apply scope offset?
  // cameraL.matrixWorld.decompose(camera.position, camera.quaternion, camera.scale)
  // camera.translateX(xOffset)
  // camera.translateZ(zOffset)
  // camera.matrixWorld.compose(camera.position, camera.quaternion, camera.scale)
  // camera.matrixWorldInverse.copy(camera.matrixWorld).invert()

  // Find the union of the frustum values of the cameras and scale
  // the values so that the near plane's position does not change in world space,
  // although must now be relative to the new union camera.
  const near2 = near + zOffset
  const far2 = far + zOffset
  const left2 = left - xOffset
  const right2 = right + (ipd - xOffset)
  const top2 = ((topFov * far) / far2) * near2
  const bottom2 = ((bottomFov * far) / far2) * near2

  camera.projectionMatrix.makePerspective(left2, right2, top2, bottom2, near2, far2)
}

function updateCameraFromXRViewerPose() {
  const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
  const originTransform = getComponent(Engine.instance.originEntity, TransformComponent)
  const cameraTransform = getComponent(Engine.instance.cameraEntity, TransformComponent)
  const renderer = EngineRenderer.instance.renderer
  const xrState = getState(XRState)
  const pose = xrState.viewerPose

  if (pose) {
    const views = pose.views
    const xrRendererState = getStateUnsafe(XRRendererState)
    const glBaseLayer = xrRendererState.glBaseLayer!
    const glBinding = xrRendererState.glBinding!
    const glProjLayer = xrRendererState.glProjLayer!
    const newRenderTarget = xrRendererState.newRenderTarget!

    if (glBaseLayer !== null) {
      // @ts-ignore setRenderTargetFramebuffer is not in the type definition
      renderer.setRenderTargetFramebuffer(newRenderTarget, glBaseLayer.framebuffer)
      renderer.setRenderTarget(newRenderTarget)
    }

    cameraTransform.position.copy(pose.transform.position as any)
    cameraTransform.rotation.copy(pose.transform.orientation as any)
    cameraTransform.matrixWorld
      .compose(cameraTransform.position, cameraTransform.rotation, V_111)
      .premultiply(originTransform.matrixWorld)
      .decompose(cameraTransform.position, cameraTransform.rotation, cameraTransform.scale)
    camera.matrixWorldInverse.copy(cameraTransform.matrixWorld).invert()

    // check if it's necessary to rebuild camera list
    let cameraListNeedsUpdate = false
    if (views.length !== camera.cameras.length) {
      camera.cameras.length = 0
      cameraListNeedsUpdate = true
    }

    for (let i = 0; i < views.length; i++) {
      const view = views[i]

      let viewport: XRViewport | null = null

      if (glBaseLayer !== null) {
        viewport = glBaseLayer.getViewport(view)!
      } else if (glBinding) {
        const glSubImage = glBinding.getViewSubImage(glProjLayer!, view)
        viewport = glSubImage.viewport

        // For side-by-side projection, we only produce a single texture for both eyes.
        if (i === 0) {
          // @ts-ignore setRenderTargetTextures is not in the type definition
          renderer.setRenderTargetTextures(
            newRenderTarget,
            glSubImage.colorTexture,
            glProjLayer!.ignoreDepthValues ? undefined : glSubImage.depthStencilTexture
          )

          renderer.setRenderTarget(newRenderTarget)
        }
      }

      let viewCamera = cameraPool[i]

      if (viewCamera === undefined) {
        viewCamera = new PerspectiveCamera()
        viewCamera.layers.enable(i)
        viewCamera.viewport = new Vector4()
        cameraPool[i] = viewCamera
        viewCamera.matrixAutoUpdate = false
        viewCamera.matrixWorldAutoUpdate = false
      }

      viewCamera.position.copy(view.transform.position as any)
      viewCamera.quaternion.copy(view.transform.orientation as any)
      viewCamera.matrixWorld
        .compose(viewCamera.position, viewCamera.quaternion, V_111)
        .premultiply(originTransform.matrixWorld)
        .decompose(viewCamera.position, viewCamera.quaternion, viewCamera.scale)
      viewCamera.matrixWorldInverse.copy(viewCamera.matrixWorld).invert()
      viewCamera.projectionMatrix.fromArray(view.projectionMatrix)
      if (viewport) viewCamera.viewport.set(viewport.x, viewport.y, viewport.width, viewport.height)

      if (cameraListNeedsUpdate === true) {
        camera.cameras.push(viewCamera)
      }
    }
  }
}

let _currentDepthNear = null as number | null
let _currentDepthFar = null as number | null
const _vec = new Vector2()

export function updateXRCamera() {
  const renderer = EngineRenderer.instance?.renderer
  if (!renderer) return

  const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
  const xrState = getState(XRState)
  const session = xrState.session

  for (const action of sessionChangedQueue()) {
    if (!action.active) {
      camera.updateProjectionMatrix()
    }
  }

  if (session === null) {
    camera.cameras = [cameraL]
    cameraL.copy(camera, false)
    const size = renderer.getDrawingBufferSize(_vec)
    cameraL.viewport.x = 0
    cameraL.viewport.y = 0
    cameraL.viewport.z = size.width
    cameraL.viewport.w = size.height
    return
  }

  updateCameraFromXRViewerPose()

  cameraR.near = cameraL.near = camera.near
  cameraR.far = cameraL.far = camera.far

  if (_currentDepthNear !== camera.near || _currentDepthFar !== camera.far) {
    // Note that the new renderState won't apply until the next frame. See #18320

    session.updateRenderState({
      depthNear: camera.near,
      depthFar: camera.far
    })

    _currentDepthNear = camera.near
    _currentDepthFar = camera.far
  }

  updateProjectionFromCameraArrayUnion(camera)
}

const xrSessionChangedQueue = defineActionQueue(XRAction.sessionChanged.matches)

const execute = () => {
  for (const action of xrSessionChangedQueue()) {
    if (!action.active) {
      _currentDepthNear = null
      _currentDepthFar = null
    }
  }

  getMutableState(XRState).viewerPose.set(
    ReferenceSpace.localFloor && getState(XRState).xrFrame?.getViewerPose(ReferenceSpace.localFloor)
  )
}

export const XRCameraInputSystem = defineSystem({
  uuid: 'ee.engine.XRCameraInputSystem',
  insert: { with: XRSystem },
  execute
})

/**
 * 2 - Update XR camera positions based on world origin and viewer pose
 */
export const XRCameraUpdateSystem = defineSystem({
  uuid: 'ee.engine.XRCameraUpdateSystem',
  insert: { before: AnimationSystemGroup },
  execute: updateXRCamera
})
