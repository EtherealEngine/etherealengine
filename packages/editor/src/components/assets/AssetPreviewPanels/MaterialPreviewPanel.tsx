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

import debounce from 'lodash.debounce'
import React, { useEffect, useRef } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

import {
  PanelEntities,
  PreviewPanelRendererState,
  useRender3DPanelSystem
} from '@etherealengine/client-core/src/user/components/Panel3D/useRender3DPanelSystem'
import { getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'

import {
  UUIDComponent,
  createEntity,
  generateEntityUUID,
  getMutableComponent,
  removeEntity,
  setComponent
} from '@etherealengine/ecs'
import { EnvmapComponent } from '@etherealengine/engine/src/scene/components/EnvmapComponent'
import { MaterialLibraryState } from '@etherealengine/engine/src/scene/materials/MaterialLibrary'
import { MaterialSelectionState } from '@etherealengine/engine/src/scene/materials/MaterialLibraryState'
import { CameraOrbitComponent } from '@etherealengine/spatial/src/camera/components/CameraOrbitComponent'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { addObjectToGroup } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { ObjectLayerMaskComponent } from '@etherealengine/spatial/src/renderer/components/ObjectLayerComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import { ObjectLayers } from '@etherealengine/spatial/src/renderer/constants/ObjectLayers'
import { Mesh, SphereGeometry } from 'three'

export const MaterialPreviewPanel = (props) => {
  const panelRef = useRef() as React.MutableRefObject<HTMLDivElement>
  const renderPanel = useRender3DPanelSystem(panelRef)
  const selectedMaterial = useHookstate(getMutableState(MaterialSelectionState).selectedMaterial)
  const renderPanelState = getMutableState(PreviewPanelRendererState)

  useEffect(() => {
    const handleSizeChange = () => {
      renderPanel.resize()
    }

    const handleSizeChangeDebounced = debounce(handleSizeChange, 100)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === panelRef.current) {
          handleSizeChangeDebounced()
        }
      }
    })

    if (panelRef.current) {
      resizeObserver.observe(panelRef.current)
    }

    return () => {
      resizeObserver.disconnect()
      handleSizeChangeDebounced.cancel()
    }
  }, [])

  useEffect(() => {
    if (!selectedMaterial.value) return
    const renderPanelEntities = renderPanelState.entities[panelRef.current.id]
    const entity = createEntity()
    setComponent(entity, NameComponent, 'Material Preview Entity')
    const uuid = generateEntityUUID()
    setComponent(entity, UUIDComponent, uuid)
    setComponent(entity, VisibleComponent, true)
    const material = getState(MaterialLibraryState).materials[selectedMaterial.value].material
    if (!material) return
    addObjectToGroup(entity, new Mesh(new SphereGeometry(5, 32, 32), material))
    setComponent(entity, EnvmapComponent, { type: 'Skybox', envMapIntensity: 2 })
    const orbitCamera = getMutableComponent(renderPanelEntities[PanelEntities.camera].value, CameraOrbitComponent)
    orbitCamera.focusedEntities.set([entity])
    orbitCamera.refocus.set(true)

    ObjectLayerMaskComponent.setLayer(entity, ObjectLayers.AssetPreview)
    if (renderPanelEntities[PanelEntities.model]) removeEntity(renderPanelEntities[PanelEntities.model].value)
    renderPanelEntities[PanelEntities.model].set(entity)
  }, [selectedMaterial])

  return (
    <>
      <div id="materialPreview" ref={panelRef} style={{ minHeight: '250px', width: '100%', height: '100%' }}></div>
    </>
  )
}
