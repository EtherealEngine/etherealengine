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

import LoadingView from '@etherealengine/client-core/src/common/components/LoadingView'
import {
  PanelEntities,
  PreviewPanelRendererState,
  useRender3DPanelSystem
} from '@etherealengine/client-core/src/user/components/Panel3D/useRender3DPanelSystem'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'

import { UUIDComponent, generateEntityUUID, setComponent } from '@etherealengine/ecs'
import { AssetPreviewCameraComponent } from '@etherealengine/engine/src/camera/components/AssetPreviewCameraComponent'
import { EnvmapComponent } from '@etherealengine/engine/src/scene/components/EnvmapComponent'
import { ModelComponent } from '@etherealengine/engine/src/scene/components/ModelComponent'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { ObjectLayerMaskComponent } from '@etherealengine/spatial/src/renderer/components/ObjectLayerComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import { ObjectLayers } from '@etherealengine/spatial/src/renderer/constants/ObjectLayers'
import styles from '../styles.module.scss'

export const ModelPreviewPanel = (props) => {
  const url = props.resourceProps.resourceUrl
  const loading = useHookstate(true)

  const error = useHookstate('')
  const panelRef = useRef() as React.MutableRefObject<HTMLDivElement>
  const renderPanel = useRender3DPanelSystem(panelRef)
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
    const renderPanelEntities = renderPanelState.entities[panelRef.current.id]
    const entity = renderPanelEntities[PanelEntities.model].value
    setComponent(entity, NameComponent, '3D Preview Entity')
    const uuid = generateEntityUUID()
    setComponent(entity, UUIDComponent, uuid)
    setComponent(entity, ModelComponent, { src: url, cameraOcclusion: false })
    setComponent(entity, EnvmapComponent, { type: 'Skybox', envMapIntensity: 2 })
    setComponent(entity, VisibleComponent, false)
    const cameraEntity = renderPanelEntities[PanelEntities.camera].value
    setComponent(cameraEntity, AssetPreviewCameraComponent, { targetModelEntity: entity })

    ObjectLayerMaskComponent.setLayer(entity, ObjectLayers.AssetPreview)

    loading.set(false)
  }, [url])

  return (
    <>
      {loading.value && <LoadingView />}
      {error.value && (
        <div className={styles.container}>
          <h1 className={styles.error}>{error.value}</h1>
        </div>
      )}
      <div
        id="modelPreview"
        ref={panelRef}
        style={{ minHeight: '250px', width: '100%', height: '100%', ...props.style }}
      ></div>
    </>
  )
}
