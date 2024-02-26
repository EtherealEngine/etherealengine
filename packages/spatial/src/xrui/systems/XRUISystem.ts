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
import { Color } from 'three'

import { NO_PROXY_STEALTH, getMutableState, getState } from '@etherealengine/hyperflux'
import { WebContainer3D } from '@etherealengine/xrui'

import { getComponent, getMutableComponent, hasComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Entity } from '@etherealengine/ecs/src/Entity'
import { defineQuery } from '@etherealengine/ecs/src/QueryFunctions'
import { defineSystem } from '@etherealengine/ecs/src/SystemFunctions'
import { InputComponent } from '../../input/components/InputComponent'
import { InputSourceComponent } from '../../input/components/InputSourceComponent'
import { XRStandardGamepadButton } from '../../input/state/ButtonState'
import { InputState } from '../../input/state/InputState'
import { VisibleComponent } from '../../renderer/components/VisibleComponent'
import { XRState } from '../../xr/XRState'

import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import { removeEntity } from '@etherealengine/ecs/src/EntityFunctions'
import { TransformSystem } from '../../transform/systems/TransformSystem'
import { XRUIState } from '../XRUIState'
import { PointerComponent } from '../components/PointerComponent'
import { XRUIComponent } from '../components/XRUIComponent'

const hitColor = new Color(0x00e6e6)
const normalColor = new Color(0xffffff)
const visibleInteractableXRUIQuery = defineQuery([XRUIComponent, VisibleComponent, InputComponent])
const visibleXRUIQuery = defineQuery([XRUIComponent, VisibleComponent])
const xruiQuery = defineQuery([XRUIComponent])

// redirect DOM events from the canvas, to the 3D scene,
// to the appropriate child Web3DLayer, and finally (back) to the
// DOM to dispatch an event on the intended DOM target
const redirectDOMEvent = (evt) => {
  for (const entity of visibleInteractableXRUIQuery()) {
    const layer = getComponent(entity, XRUIComponent)
    const assigned = InputSourceComponent.isAssignedButtons(entity)
    if (!assigned) continue
    layer.updateWorldMatrix(true, true)
    const pointerScreenRaycaster = getState(InputState).pointerScreenRaycaster
    const hit = layer.hitTest(pointerScreenRaycaster.ray)
    if (hit && hit.intersection.object.visible) {
      hit.target.dispatchEvent(new evt.constructor(evt.type, evt))
      hit.target.focus()
      return
    }
  }
}

const updateControllerRayInteraction = (entity: Entity, xruiEntities: Entity[]) => {
  const pointerComponentState = getMutableComponent(entity, PointerComponent)
  const pointer = pointerComponentState.pointer.value
  const cursor = pointerComponentState.cursor.value

  let hit = null! as ReturnType<typeof WebContainer3D.prototype.hitTest>

  for (const entity of xruiEntities) {
    const assigned = InputSourceComponent.isAssignedButtons(entity)
    if (!assigned) continue

    const layer = getComponent(entity, XRUIComponent)

    /**
     * get closest hit from all XRUIs
     */
    const layerHit = layer.hitTest(pointer)
    if (layerHit && (!hit || layerHit.intersection.distance < hit.intersection.distance)) hit = layerHit
  }

  pointerComponentState.lastHit.set(hit)

  if (hit) {
    const interactable = window.getComputedStyle(hit.target).cursor == 'pointer'

    if (cursor) {
      cursor.visible = true
      cursor.position.copy(hit.intersection.point)
      pointer.worldToLocal(cursor.position)
      // this is a hack because this system runs after the transform system
      // @todo turn cursor and pointer into entities
      cursor.updateMatrixWorld(true)

      if (interactable) {
        cursor.material.color = hitColor
      } else {
        cursor.material.color = normalColor
      }
    }
  } else {
    if (cursor) {
      cursor.material.color = normalColor
      cursor.visible = false
    }
  }
}

const updateClickEventsForController = (entity: Entity) => {
  const pointerComponentState = getMutableComponent(entity, PointerComponent)
  const hit = pointerComponentState.lastHit.value
  if (hit && hit.intersection.object.visible) {
    hit.target.dispatchEvent(new PointerEvent('click', { bubbles: true }))
    hit.target.focus()
  }
}

const execute = () => {
  const xruiState = getMutableState(XRUIState)
  const xrFrame = getState(XRState).xrFrame

  /** Update the objects to use for intersection tests */
  const pointerScreenRaycaster = getState(InputState).pointerScreenRaycaster
  if (xrFrame && xruiState.interactionRays[0].get(NO_PROXY_STEALTH) === pointerScreenRaycaster.ray)
    xruiState.interactionRays.set([...PointerComponent.getPointers(), pointerScreenRaycaster.ray]) // todo, replace pointerScreenRaycaster with input sources

  if (!xrFrame && xruiState.interactionRays[0].get(NO_PROXY_STEALTH) !== pointerScreenRaycaster.ray)
    xruiState.interactionRays.set([pointerScreenRaycaster.ray])

  const interactableXRUIEntities = visibleInteractableXRUIQuery()

  const inputSourceEntities = InputSourceComponent.nonCapturedInputSourceQuery()

  /** do intersection tests */
  for (const inputSourceEntity of inputSourceEntities) {
    const inputSourceComponent = getComponent(inputSourceEntity, InputSourceComponent)
    const inputSource = inputSourceComponent.source
    const buttons = inputSourceComponent.buttons

    if (inputSource.targetRayMode !== 'tracked-pointer') continue
    if (!PointerComponent.pointers.has(inputSource)) {
      PointerComponent.addPointer(inputSourceEntity)
    }

    const pointerEntity = PointerComponent.pointers.get(inputSource)
    if (!pointerEntity) continue

    const pointer = getComponent(pointerEntity, PointerComponent).pointer
    if (!pointer) continue

    if (
      buttons[XRStandardGamepadButton.Trigger]?.down &&
      (inputSource.handedness === 'left' || inputSource.handedness === 'right')
    )
      updateClickEventsForController(pointerEntity)

    updateControllerRayInteraction(pointerEntity, interactableXRUIEntities)
  }

  for (const [pointerSource, entity] of PointerComponent.pointers) {
    if (!inputSourceEntities.find((entity) => getComponent(entity, InputSourceComponent).source === pointerSource)) {
      removeEntity(entity)
    }
  }

  /** only update visible XRUI */

  for (const entity of visibleXRUIQuery()) {
    const xrui = getComponent(entity, XRUIComponent)
    xrui.update()
  }

  /** @todo remove this once XRUI no longer forces it internally */
  for (const entity of xruiQuery()) {
    const xrui = getComponent(entity, XRUIComponent)
    const visible = hasComponent(entity, VisibleComponent)
    xrui.matrixWorldAutoUpdate = visible
    xrui.matrixAutoUpdate = visible
  }

  // xrui.layoutSystem.viewFrustum.setFromPerspectiveProjectionMatrix(getComponent(Engine.instance.cameraEntity, CameraComponent).projectionMatrix)
  // EngineRenderer.instance.renderer.getSize(xrui.layoutSystem.viewResolution)
  // xrui.layoutSystem.update(world.delta, world.elapsedTime)
}

const reactor = () => {
  if (!isClient) return null

  useEffect(() => {
    // @ts-ignore
    // console.log(JSON.stringify(xrui.WebLayerModule.WebLayerManager.instance.textureLoader.workerConfig))
    // xrui.WebLayerModule.WebLayerManager.instance.textureLoader.workerConfig = {
    //   astcSupported: false,
    //   etc1Supported: renderer.extensions.has( 'WEBGL_compressed_texture_etc1' ),
    //   etc2Supported: renderer.extensions.has( 'WEBGL_compressed_texture_etc' ),
    //   dxtSupported: renderer.extensions.has( 'WEBGL_compressed_texture_s3tc' ),
    //   bptcSupported: renderer.extensions.has( 'EXT_texture_compression_bptc' ),
    //   pvrtcSupported: false
    // }

    // const canvas = EngineRenderer.instance.renderer.getContext().canvas
    document.body.addEventListener('pointerdown', redirectDOMEvent)
    document.body.addEventListener('click', redirectDOMEvent)
    document.body.addEventListener('contextmenu', redirectDOMEvent)
    document.body.addEventListener('dblclick', redirectDOMEvent)

    const pointerScreenRaycaster = getState(InputState).pointerScreenRaycaster

    getMutableState(XRUIState).interactionRays.set([pointerScreenRaycaster.ray])

    return () => {
      document.body.removeEventListener('pointerdown', redirectDOMEvent)
      document.body.removeEventListener('click', redirectDOMEvent)
      document.body.removeEventListener('contextmenu', redirectDOMEvent)
      document.body.removeEventListener('dblclick', redirectDOMEvent)
    }
  }, [])
  return null
}

export const XRUISystem = defineSystem({
  uuid: 'ee.engine.XRUISystem',
  insert: { with: TransformSystem },
  execute,
  reactor
})
