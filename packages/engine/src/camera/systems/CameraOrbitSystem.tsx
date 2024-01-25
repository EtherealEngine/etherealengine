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

import { getMutableState, getState } from '@etherealengine/hyperflux'
import { Box3, Matrix3, Sphere, Spherical, Vector3 } from 'three'
import { SelectionState } from '../../../../editor/src/services/SelectionServices'
import { V_010 } from '../../common/constants/MathConstants'
import { throttle } from '../../common/functions/FunctionHelpers'
import { isClient } from '../../common/functions/getEnvironment'
import { Engine } from '../../ecs/classes/Engine'
import {
  getComponent,
  getMutableComponent,
  getOptionalComponent,
  hasComponent,
  setComponent
} from '../../ecs/functions/ComponentFunctions'
import { defineQuery } from '../../ecs/functions/QueryFunctions'
import { defineSystem } from '../../ecs/functions/SystemFunctions'
import { InputSystemGroup } from '../../ecs/functions/SystemGroups'
import { InputSourceComponent } from '../../input/components/InputSourceComponent'
import { InputState } from '../../input/state/InputState'
import { GroupComponent } from '../../scene/components/GroupComponent'
import obj3dFromUuid from '../../scene/util/obj3dFromUuid'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { CameraComponent } from '../components/CameraComponent'
import { ActiveOrbitCamera, CameraOrbitComponent } from '../components/CameraOrbitComponent'

let lastZoom = 0

const ZOOM_SPEED = 0.1
const MAX_FOCUS_DISTANCE = 1000
const PAN_SPEED = 1
const ORBIT_SPEED = 5

const box = new Box3()
const delta = new Vector3()
const normalMatrix = new Matrix3()
const sphere = new Sphere()
const spherical = new Spherical()
const toOrbitCenter = new Vector3()

const doZoom = (zoom) => {
  const zoomDelta = typeof zoom === 'number' ? zoom - lastZoom : 0
  lastZoom = zoom
  getMutableComponent(getState(ActiveOrbitCamera), CameraOrbitComponent).zoomDelta.set(zoomDelta)
}

const throttleZoom = throttle(doZoom, 30, { leading: true, trailing: false })
const InputSourceQuery = defineQuery([InputSourceComponent])
const orbitCameraQuery = defineQuery([CameraOrbitComponent])
const execute = () => {
  if (!isClient) return
  /**
   * assign active orbit camera based on which input source registers input
   */
  for (const entity of orbitCameraQuery()) {
    const inputEntity = getComponent(entity, CameraOrbitComponent).inputEntity
    const buttons = getOptionalComponent(inputEntity, InputSourceComponent)?.buttons
    if (!buttons) continue
    if (Object.keys(buttons).length > 0) getMutableState(ActiveOrbitCamera).set(entity)
  }

  const entity = getState(ActiveOrbitCamera)
  if (!entity) return

  /**
   * assign input source to active orbit camera if not already assigned
   */
  const cameraOrbitComponent = getMutableComponent(entity, CameraOrbitComponent)
  if (!cameraOrbitComponent.inputEntity.value) cameraOrbitComponent.inputEntity.set(InputSourceQuery()[0])

  const pointerState = getState(InputState).pointerState
  const inputSource = getComponent(cameraOrbitComponent.inputEntity.value, InputSourceComponent)
  const buttons = inputSource.buttons

  const selecting = buttons.PrimaryClick?.pressed
  const zoom = pointerState.scroll.y
  const panning = buttons.AuxiliaryClick?.pressed

  const editorCamera = getMutableComponent(entity, CameraOrbitComponent)
  if (buttons.KeyF?.down) {
    //only use selection state if it's the main camera
    if (entity === Engine.instance.cameraEntity)
      editorCamera.focusedObjects.set(getState(SelectionState).selectedEntities)
    editorCamera.refocus.set(true)
  }
  if (selecting) {
    editorCamera.isOrbiting.set(true)
    const mouseMovement = pointerState.movement
    if (mouseMovement) {
      editorCamera.cursorDeltaX.set(mouseMovement.x)
      editorCamera.cursorDeltaY.set(mouseMovement.y)
    }
  } else if (panning) {
    editorCamera.isPanning.set(true)
    const mouseMovement = pointerState.movement
    if (mouseMovement) {
      editorCamera.cursorDeltaX.set(mouseMovement.x)
      editorCamera.cursorDeltaY.set(mouseMovement.y)
    }
  } else if (zoom) {
    throttleZoom(zoom)
  }

  const editorCameraCenter = editorCamera.cameraOrbitCenter.value
  const transform = getComponent(entity, TransformComponent)
  const camera = getComponent(entity, CameraComponent)

  if (editorCamera.zoomDelta.value) {
    const distance = transform.position.distanceTo(editorCamera.cameraOrbitCenter.value)
    delta.set(0, 0, editorCamera.zoomDelta.value * distance * ZOOM_SPEED)
    if (delta.length() < distance) {
      delta.applyMatrix3(normalMatrix.getNormalMatrix(camera.matrixWorld))
      transform.position.add(delta)
    }
    getMutableComponent(entity, CameraOrbitComponent).zoomDelta.set(0)
  }

  if (editorCamera.refocus.value) {
    let distance = 0
    if (editorCamera.focusedObjects.length === 0) {
      editorCameraCenter.set(0, 0, 0)
      distance = 10
    } else {
      box.makeEmpty()
      for (const object of editorCamera.focusedObjects.value) {
        const group =
          typeof object === 'string' ? [obj3dFromUuid(object)] : getOptionalComponent(object, GroupComponent) || []
        for (const obj of group) {
          box.expandByObject(obj)
        }
      }
      if (box.isEmpty()) {
        // Focusing on an Group, AmbientLight, etc
        const object = editorCamera.focusedObjects[0].value

        if (typeof object === 'string') {
          editorCameraCenter.setFromMatrixPosition(obj3dFromUuid(object).matrixWorld)
        } else if (hasComponent(object, TransformComponent)) {
          const position = getComponent(object, TransformComponent).position
          editorCameraCenter.copy(position)
        }
        distance = 0.1
      } else {
        box.getCenter(editorCameraCenter)
        distance = box.getBoundingSphere(sphere).radius
      }
    }

    delta
      .set(0, 0, 1)
      .applyQuaternion(transform.rotation)
      .multiplyScalar(Math.min(distance, MAX_FOCUS_DISTANCE) * 4)
    transform.position.copy(editorCameraCenter).add(delta)

    setComponent(entity, CameraOrbitComponent, { focusedObjects: null!, refocus: false })
  }

  if (editorCamera.isPanning.value) {
    const distance = transform.position.distanceTo(editorCameraCenter)
    delta
      .set(-editorCamera.cursorDeltaX.value, -editorCamera.cursorDeltaY.value, 0)
      .multiplyScalar(Math.max(distance, 1) * PAN_SPEED)
      .applyMatrix3(normalMatrix.getNormalMatrix(camera.matrix))
    transform.position.add(delta)
    editorCameraCenter.add(delta)

    getMutableComponent(entity, CameraOrbitComponent).isPanning.set(false)
  }

  if (editorCamera.isOrbiting.value) {
    delta.copy(transform.position).sub(editorCameraCenter)

    spherical.setFromVector3(delta)
    spherical.theta -= editorCamera.cursorDeltaX.value * ORBIT_SPEED
    spherical.phi += editorCamera.cursorDeltaY.value * ORBIT_SPEED
    spherical.makeSafe()
    delta.setFromSpherical(spherical)

    transform.position.copy(editorCameraCenter).add(delta)
    transform.matrix.lookAt(transform.position, editorCameraCenter, V_010)
    transform.rotation.setFromRotationMatrix(transform.matrix)

    getMutableComponent(entity, CameraOrbitComponent).isOrbiting.set(false)
  }
}

export const CameraOrbitSystem = defineSystem({
  uuid: 'ee.engine.CameraOrbitSystem',
  insert: { with: InputSystemGroup },
  execute
})
