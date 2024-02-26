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

import { useEffect } from 'react'
import { Mesh, MeshBasicMaterial, Object3D, Quaternion, Ray, Raycaster, Vector3 } from 'three'

import { getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'

import { Object3DUtils } from '@etherealengine/common/src/utils/Object3DUtils'
import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import {
  getComponent,
  getMutableComponent,
  getOptionalComponent,
  hasComponent,
  setComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { Entity, UndefinedEntity } from '@etherealengine/ecs/src/Entity'
import { createEntity, removeEntity } from '@etherealengine/ecs/src/EntityFunctions'
import { defineQuery } from '@etherealengine/ecs/src/QueryFunctions'
import { defineSystem } from '@etherealengine/ecs/src/SystemFunctions'
import { InputSystemGroup } from '@etherealengine/ecs/src/SystemGroups'
import { EngineState } from '@etherealengine/spatial/src/EngineState'
import { EntityTreeComponent } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { CameraComponent } from '../../camera/components/CameraComponent'
import { NameComponent } from '../../common/NameComponent'
import { ObjectDirection } from '../../common/constants/Axis3D'
import { Physics, RaycastArgs } from '../../physics/classes/Physics'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { AllCollisionMask } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { PhysicsState } from '../../physics/state/PhysicsState'
import { SceneQueryType } from '../../physics/types/PhysicsTypes'
import { EngineRenderer } from '../../renderer/WebGLRendererSystem'
import { GroupComponent } from '../../renderer/components/GroupComponent'
import { VisibleComponent } from '../../renderer/components/VisibleComponent'
import { BoundingBoxComponent } from '../../transform/components/BoundingBoxComponents'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { computeTransformMatrix } from '../../transform/systems/TransformSystem'
import { XRSpaceComponent } from '../../xr/XRComponents'
import { ReferenceSpace, XRState } from '../../xr/XRState'
import { XRUIComponent } from '../../xrui/components/XRUIComponent'
import { InputComponent } from '../components/InputComponent'
import {
  InputSourceAxesCapturedComponent,
  InputSourceButtonsCapturedComponent,
  InputSourceComponent
} from '../components/InputSourceComponent'
import normalizeWheel from '../functions/normalizeWheel'
import { ButtonStateMap, MouseButton, createInitialButtonState } from '../state/ButtonState'
import { InputState } from '../state/InputState'

function preventDefault(e) {
  e.preventDefault()
}

export const addClientInputListeners = (canvas = EngineRenderer.instance.renderer.domElement) => {
  const xrState = getState(XRState)

  canvas.addEventListener('DOMMouseScroll', preventDefault, false)

  const preventDefaultKeyDown = (evt) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
    if (evt.code === 'Tab') evt.preventDefault()
    // prevent DOM tab selection and spacebar/enter button toggling (since it interferes with avatar controls)
    if (evt.code === 'Space' || evt.code === 'Enter') evt.preventDefault()
  }

  //canvas.addEventListener('keydown', preventDefaultKeyDown, false)

  canvas.addEventListener('gesturestart', preventDefault)
  canvas.addEventListener('contextmenu', preventDefault)

  const addInputSource = (source: XRInputSource) => {
    // we don't want to override our custom thumbpad input source for mobile AR
    if (
      session?.interactionMode === 'screen-space' &&
      (source.targetRayMode === 'screen' || source.targetRayMode === 'gaze')
    ) {
      return
    }
    const entity = createEntity()
    setComponent(entity, InputSourceComponent, { source })
    setComponent(entity, EntityTreeComponent, {
      parentEntity: session?.interactionMode === 'world-space' ? Engine.instance.originEntity : UndefinedEntity
    })
    setComponent(entity, TransformComponent)
    setComponent(entity, NameComponent, 'InputSource-handed:' + source.handedness + '-mode:' + source.targetRayMode)
  }

  const removeInputSource = (source: XRInputSource) => {
    const entity = InputSourceComponent.entitiesByInputSource.get(source)
    if (!entity) return
    removeEntity(entity)
  }

  const session = xrState.session

  if (session?.inputSources) {
    const { inputSources } = session
    for (const inputSource of inputSources) {
      addInputSource(inputSource)
    }
  }

  const onInputSourcesChanged = (event: XRInputSourceChangeEvent) => {
    event.added.map(addInputSource)
    event.removed.map(removeInputSource)
  }

  session?.addEventListener('inputsourceschange', onInputSourcesChanged)

  const addGamepad = (e: GamepadEvent) => {
    const gamepad = navigator.getGamepads()[e.gamepad.index]
    if (!gamepad) return console.warn('[ClientInputSystem] gamepad not found', e.gamepad)
    console.log('[ClientInputSystem] found gamepad', gamepad, e.gamepad)
    gamepadRef = gamepad
  }

  const removeGamepad = (e: GamepadEvent) => {
    console.log('[ClientInputSystem] lost gamepad', e.gamepad)
    gamepadRef = emulatedGamepad
  }

  /** @todo - currently only one gamepad supported */
  window.addEventListener('gamepadconnected', addGamepad)
  window.addEventListener('gamepaddisconnected', removeGamepad)

  /** Keyboard events */
  const onKeyEvent = (event: KeyboardEvent) => {
    const element = event.target as HTMLElement
    // Сheck which excludes the possibility of controlling the avatar when typing in a text field
    if (element?.tagName === 'INPUT' || element?.tagName === 'SELECT' || element?.tagName === 'TEXTAREA') return

    const code = event.code
    const down = event.type === 'keydown'

    const inputSourceComponent = getOptionalComponent(emulatedInputSourceEntity, InputSourceComponent)
    if (!inputSourceComponent) return

    const buttonState = inputSourceComponent.buttons as ButtonStateMap

    if (down) buttonState[code] = createInitialButtonState()
    else if (buttonState[code]) buttonState[code].up = true
  }

  document.addEventListener('keyup', onKeyEvent)
  document.addEventListener('keydown', onKeyEvent)

  /** Clear mouse events */
  const pointerButtons = ['PrimaryClick', 'AuxiliaryClick', 'SecondaryClick']
  const clearKeyState = () => {
    const inputSourceComponent = getOptionalComponent(emulatedInputSourceEntity, InputSourceComponent)
    if (!inputSourceComponent) return
    const state = inputSourceComponent.buttons as ButtonStateMap
    for (const button of pointerButtons) {
      const val = state[button]
      if (!val?.up && val?.pressed) state[button].up = true
    }
  }

  canvas.addEventListener('blur', clearKeyState)
  canvas.addEventListener('mouseleave', clearKeyState)

  const handleVisibilityChange = (event: Event) => {
    if (document.visibilityState === 'hidden') clearKeyState()
  }

  canvas.addEventListener('visibilitychange', handleVisibilityChange)

  /** Mouse events */
  const onWheelEvent = (event: WheelEvent) => {
    const pointerState = getMutableState(InputState).pointerState
    const normalizedValues = normalizeWheel(event)
    const x = Math.sign(normalizedValues.spinX + Math.random() * 0.000001)
    const y = Math.sign(normalizedValues.spinY + Math.random() * 0.000001)
    pointerState.scroll.x.set((curr_x) => curr_x + x)
    pointerState.scroll.y.set((curr_y) => curr_y + y)
  }
  canvas.addEventListener('wheel', onWheelEvent, { passive: true, capture: true })

  const handleMouseClick = (event: MouseEvent) => {
    const down = event.type === 'mousedown' || event.type === 'touchstart'

    let button = MouseButton.PrimaryClick
    if (event.button === 1) button = MouseButton.AuxiliaryClick
    else if (event.button === 2) button = MouseButton.SecondaryClick

    const inputSourceComponent = getOptionalComponent(emulatedInputSourceEntity, InputSourceComponent)
    if (!inputSourceComponent) return

    const state = inputSourceComponent.buttons as ButtonStateMap

    if (down) state[button] = createInitialButtonState()
    else if (state[button]) state[button]!.up = true
  }

  const handleMouseMove = (event: MouseEvent) => {
    const pointerState = getState(InputState).pointerState
    pointerState.position.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      (event.clientY / window.innerHeight) * -2 + 1
    )
  }

  const handleTouchMove = (event: TouchEvent) => {
    const pointerState = getState(InputState).pointerState
    const touch = event.touches[0]
    pointerState.position.set(
      (touch.clientX / window.innerWidth) * 2 - 1,
      (touch.clientY / window.innerHeight) * -2 + 1
    )
  }

  canvas.addEventListener('touchmove', handleTouchMove, { passive: true, capture: true })
  canvas.addEventListener('mousemove', handleMouseMove, { passive: true, capture: true })
  canvas.addEventListener('mouseup', handleMouseClick)
  canvas.addEventListener('mousedown', handleMouseClick)
  canvas.addEventListener('touchstart', handleMouseClick)
  canvas.addEventListener('touchend', handleMouseClick)

  const handleTouchDirectionalPad = (event: CustomEvent): void => {
    const { stick, value }: { stick: 'LeftStick' | 'RightStick'; value: { x: number; y: number } } = event.detail
    if (!stick) {
      return
    }

    const inputSourceComponent = getOptionalComponent(emulatedInputSourceEntity, InputSourceComponent)
    if (!inputSourceComponent) return

    const index = stick === 'LeftStick' ? 0 : 2

    if (!inputSourceComponent.source.gamepad) return

    const axes = inputSourceComponent.source.gamepad.axes as number[]

    axes[index] = value.x
    axes[index + 1] = value.y
  }
  document.addEventListener('touchstickmove', handleTouchDirectionalPad)

  /**
   * AR uses the `select` event as taps on the screen for mobile AR sessions
   * This gets piped into the input system as a TouchInput.Touch
   */

  const onXRSelectStart = (event: any) => {
    const inputSourceComponent = getOptionalComponent(emulatedInputSourceEntity, InputSourceComponent)
    if (!inputSourceComponent) return
    const state = inputSourceComponent.buttons as ButtonStateMap
    state.PrimaryClick = createInitialButtonState()
  }
  const onXRSelectEnd = (event: any) => {
    const inputSourceComponent = getOptionalComponent(emulatedInputSourceEntity, InputSourceComponent)
    if (!inputSourceComponent) return
    const state = inputSourceComponent.buttons as ButtonStateMap
    if (!state.PrimaryClick) return
    state.PrimaryClick.up = true
  }
  session?.addEventListener('selectstart', onXRSelectStart)
  session?.addEventListener('selectend', onXRSelectEnd)

  const emulatedTargetRaySpace = {
    emulated: true
  } as any as XRSpace

  const emulatedGamepad = {
    axes: [0, 0, 0, 0],
    buttons: [],
    connected: true,
    hapticActuators: [],
    id: 'ee.emulated-gamepad',
    index: 0,
    mapping: 'standard',
    timestamp: performance.now(),
    vibrationActuator: null
  } as Gamepad

  let gamepadRef = emulatedGamepad

  console.log('XRSession interaction mode ' + session?.interactionMode)

  // create an emulated input source for mouse/keyboard/touch input
  const emulatedInputSource = {
    handedness: 'none',
    targetRayMode: session ? (session.interactionMode === 'screen-space' ? 'screen' : 'gaze') : 'screen',
    targetRaySpace: emulatedTargetRaySpace,
    gripSpace: undefined,
    get gamepad() {
      // workaround since the gamepad doesn't always store a reference internally, so return a new reference
      return gamepadRef === emulatedGamepad ? gamepadRef : navigator.getGamepads()[gamepadRef!.index]
    },
    profiles: [],
    hand: undefined
  } as XRInputSource

  const emulatedInputSourceEntity = createEntity()
  setComponent(emulatedInputSourceEntity, InputSourceComponent, { source: emulatedInputSource })
  setComponent(
    emulatedInputSourceEntity,
    NameComponent,
    'InputSource-emulated ' + '-mode:' + emulatedInputSource.targetRayMode
  )

  return () => {
    inputSources().map((eid) => removeEntity(eid))

    canvas.removeEventListener('DOMMouseScroll', preventDefault, false)
    canvas.removeEventListener('keydown', preventDefaultKeyDown, false)
    canvas.removeEventListener('gesturestart', preventDefault)
    canvas.removeEventListener('contextmenu', preventDefault)

    session?.removeEventListener('inputsourceschange', onInputSourcesChanged)

    window.removeEventListener('gamepadconnected', addGamepad)
    window.removeEventListener('gamepaddisconnected', removeGamepad)

    document.removeEventListener('keyup', onKeyEvent)
    document.removeEventListener('keydown', onKeyEvent)

    canvas.removeEventListener('focus', clearKeyState)
    canvas.removeEventListener('blur', clearKeyState)
    canvas.removeEventListener('mouseleave', clearKeyState)

    canvas.removeEventListener('visibilitychange', handleVisibilityChange)

    canvas.removeEventListener('wheel', onWheelEvent)

    canvas.removeEventListener('touchmove', handleTouchMove)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mouseup', handleMouseClick)
    canvas.removeEventListener('mousedown', handleMouseClick)
    canvas.removeEventListener('touchstart', handleMouseClick)
    canvas.removeEventListener('touchend', handleMouseClick)

    document.removeEventListener('touchstickmove', handleTouchDirectionalPad)

    session?.removeEventListener('selectstart', onXRSelectStart)
    session?.removeEventListener('selectend', onXRSelectEnd)
  }
}

export function updateGamepadInput(eid: Entity) {
  const inputSource = getComponent(eid, InputSourceComponent)
  const source = inputSource.source
  const buttons = inputSource.buttons as ButtonStateMap

  // log buttons
  // if (source.gamepad) {
  //   for (let i = 0; i < source.gamepad.buttons.length; i++) {
  //     const button = source.gamepad.buttons[i]
  //     if (button.pressed) console.log('button ' + i + ' pressed: ' + button.pressed)
  //   }
  // }

  if (!source.gamepad) return
  const gamepadButtons = source.gamepad.buttons
  if (gamepadButtons) {
    for (let i = 0; i < gamepadButtons.length; i++) {
      const button = gamepadButtons[i]
      if (!buttons[i] && (button.pressed || button.touched)) {
        buttons[i] = createInitialButtonState(button)
      }
      if (buttons[i] && (button.pressed || button.touched)) {
        if (!buttons[i].pressed && button.pressed) buttons[i].down = true
        buttons[i].pressed = button.pressed
        buttons[i].touched = button.touched
        buttons[i].value = button.value
      } else if (buttons[i]) {
        buttons[i].up = true
      }
    }
  }
}

const xrSpaces = defineQuery([XRSpaceComponent, TransformComponent])
const inputSources = defineQuery([InputSourceComponent])

const inputXRUIs = defineQuery([InputComponent, VisibleComponent, XRUIComponent])
const inputBoundingBoxes = defineQuery([InputComponent, VisibleComponent, BoundingBoxComponent])
const inputObjects = defineQuery([InputComponent, VisibleComponent, GroupComponent])

const rayRotation = new Quaternion()

const inputRaycast = {
  type: SceneQueryType.Closest,
  origin: new Vector3(),
  direction: new Vector3(),
  maxDistance: 1000,
  groups: getInteractionGroups(AllCollisionMask, AllCollisionMask),
  excludeRigidBody: undefined //
} as RaycastArgs

const inputRay = new Ray()
const raycaster = new Raycaster()
const bboxHitTarget = new Vector3()

const quat = new Quaternion()

const execute = () => {
  const pointerState = getState(InputState).pointerState
  const pointerScreenRaycaster = getState(InputState).pointerScreenRaycaster
  pointerScreenRaycaster.setFromCamera(
    pointerState.position,
    getComponent(Engine.instance.cameraEntity, CameraComponent)
  )

  pointerState.movement.subVectors(pointerState.position, pointerState.lastPosition)
  pointerState.lastPosition.copy(pointerState.position)
  pointerState.lastScroll.copy(pointerState.scroll)

  const xrFrame = getState(XRState).xrFrame
  const origin = ReferenceSpace.origin

  for (const eid of xrSpaces()) {
    const space = getComponent(eid, XRSpaceComponent)
    // our custom input source is not a valid pose, so ignore it - might want a better way than this
    if ('emulated' in space) continue
    const pose = origin && xrFrame?.getPose(space, origin)
    if (pose) {
      TransformComponent.position.x[eid] = pose.transform.position.x
      TransformComponent.position.y[eid] = pose.transform.position.y
      TransformComponent.position.z[eid] = pose.transform.position.z
      TransformComponent.rotation.x[eid] = pose.transform.orientation.x
      TransformComponent.rotation.y[eid] = pose.transform.orientation.y
      TransformComponent.rotation.z[eid] = pose.transform.orientation.z
      TransformComponent.rotation.w[eid] = pose.transform.orientation.w
      TransformComponent.dirtyTransforms[eid] = true
    }
  }

  for (const sourceEid of inputSources()) {
    const sourceTransform = getComponent(sourceEid, TransformComponent)
    const { source } = getComponent(sourceEid, InputSourceComponent)

    if (!xrFrame && source.targetRayMode === 'screen') {
      const ray = pointerScreenRaycaster.ray

      TransformComponent.position.x[sourceEid] = ray.origin.x
      TransformComponent.position.y[sourceEid] = ray.origin.y
      TransformComponent.position.z[sourceEid] = ray.origin.z

      // set rayDirection to be the direction of the ray
      rayRotation.setFromUnitVectors(ObjectDirection.Forward, ray.direction)

      TransformComponent.rotation.x[sourceEid] = rayRotation.x
      TransformComponent.rotation.y[sourceEid] = rayRotation.y
      TransformComponent.rotation.z[sourceEid] = rayRotation.z
      TransformComponent.rotation.w[sourceEid] = rayRotation.w
      TransformComponent.dirtyTransforms[sourceEid] = true
    }

    if (xrFrame && source.targetRayMode === 'tracked-pointer') {
      const transform = getComponent(sourceEid, TransformComponent)

      const referenceSpace = ReferenceSpace.localFloor
      if (xrFrame && referenceSpace) {
        const pose = xrFrame.getPose(source.targetRaySpace, referenceSpace)
        if (pose) {
          transform.position.copy(pose.transform.position as any as Vector3)
          transform.rotation.copy(pose.transform.orientation as any as Quaternion)
          computeTransformMatrix(sourceEid)
        }
      }
    }

    const capturedButtons = hasComponent(sourceEid, InputSourceButtonsCapturedComponent)
    const capturedAxes = hasComponent(sourceEid, InputSourceAxesCapturedComponent)

    if (!capturedButtons || !capturedAxes) {
      let assignedInputEntity = UndefinedEntity as Entity
      let hitDistance = Infinity

      const sourceRotation = TransformComponent.getWorldRotation(sourceEid, quat)
      inputRaycast.direction.copy(ObjectDirection.Forward).applyQuaternion(sourceRotation)
      TransformComponent.getWorldPosition(sourceEid, inputRaycast.origin).addScaledVector(inputRaycast.direction, -0.01)
      inputRaycast.excludeRigidBody = getOptionalComponent(Engine.instance.localClientEntity, RigidBodyComponent)?.body
      inputRay.set(inputRaycast.origin, inputRaycast.direction)

      // only heuristic is scene objects when in the editor
      if (getState(EngineState).isEditor) {
        raycaster.set(inputRaycast.origin, inputRaycast.direction)
        const objects = inputObjects()
          .map((eid) => getComponent(eid, GroupComponent))
          .flat()
        const hits = raycaster.intersectObjects<Object3D>(objects, true).sort((a, b) => a.distance - b.distance)

        if (hits.length && hits[0].distance < hitDistance) {
          const object = hits[0].object
          const parentObject = Object3DUtils.findAncestor(object, (obj) => obj.parent === Engine.instance.scene)
          if (parentObject?.entity) {
            assignedInputEntity = parentObject.entity
            hitDistance = hits[0].distance
          }
        }
      } else {
        // 1st heuristic is XRUI
        for (const eid of inputXRUIs()) {
          const xrui = getComponent(eid, XRUIComponent)
          const layerHit = xrui.hitTest(inputRay)
          if (
            !layerHit ||
            !layerHit.intersection.object.visible ||
            (layerHit.intersection.object as Mesh<any, MeshBasicMaterial>).material?.opacity < 0.01
          )
            continue
          if (layerHit.intersection.distance < hitDistance) {
            assignedInputEntity = eid
            hitDistance = layerHit.intersection.distance
          }
          break
        }

        const physicsWorld = getState(PhysicsState).physicsWorld

        // 2nd heuristic is physics colliders
        if (physicsWorld) {
          const hit = Physics.castRay(physicsWorld, inputRaycast)[0]
          if (hit && hit.distance < hitDistance) {
            assignedInputEntity = hit.entity
            hitDistance = hit.distance
          }
        }

        // 3rd heuristic is bboxes
        for (const entity of inputBoundingBoxes()) {
          const boundingBox = getComponent(entity, BoundingBoxComponent)
          const hit = inputRay.intersectBox(boundingBox.box, bboxHitTarget)
          if (hit) {
            const distance = inputRay.origin.distanceTo(bboxHitTarget)
            if (distance < hitDistance) {
              assignedInputEntity = entity
              hitDistance = distance
              break
            }
          }
        }
      }

      const sourceState = getMutableComponent(sourceEid, InputSourceComponent)
      if (!capturedButtons) sourceState.assignedButtonEntity.set(assignedInputEntity)
      if (!capturedAxes) sourceState.assignedAxesEntity.set(assignedInputEntity)
    }

    updateGamepadInput(sourceEid)
  }
}

const reactor = () => {
  if (!isClient) return null

  const xrState = useHookstate(getMutableState(XRState))

  useEffect(addClientInputListeners, [xrState.session])

  return null
}

export const ClientInputSystem = defineSystem({
  uuid: 'ee.engine.input.ClientInputSystem',
  insert: { with: InputSystemGroup },
  execute,
  reactor
})
