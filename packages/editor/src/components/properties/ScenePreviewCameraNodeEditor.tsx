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

import { debounce } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getComponent, useComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'

import CameraAltIcon from '@mui/icons-material/CameraAlt'

import { ScenePreviewCameraComponent } from '@etherealengine/engine/src/scene/components/ScenePreviewCamera'
import { computeTransformMatrix } from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import { EditorControlFunctions } from '../../functions/EditorControlFunctions'
import { previewScreenshot } from '../../functions/takeScreenshot'
import { PropertiesPanelButton } from '../inputs/Button'
import ImagePreviewInput from '../inputs/ImagePreviewInput'
import NodeEditor from './NodeEditor'
import { EditorComponentType } from './Util'

/**
 * ScenePreviewCameraNodeEditor provides the editor view to customize properties.
 *
 * @type {Class component}
 */
export const ScenePreviewCameraNodeEditor: EditorComponentType = (props) => {
  const { t } = useTranslation()
  const [bufferUrl, setBufferUrl] = useState<string>('')
  const transformComponent = useComponent(Engine.instance.cameraEntity, TransformComponent)

  const onSetFromViewport = () => {
    const { position, rotation } = getComponent(Engine.instance.cameraEntity, TransformComponent)
    const transform = getComponent(props.entity, TransformComponent)
    transform.position.copy(position)
    transform.rotation.copy(rotation)
    computeTransformMatrix(props.entity)

    EditorControlFunctions.commitTransformSave([props.entity])
  }

  const updateScenePreview = async () => {
    const imageBlob = (await previewScreenshot(
      512 / 2,
      320 / 2,
      0.9,
      'jpeg',
      getComponent(props.entity, ScenePreviewCameraComponent).camera
    ))!
    const url = URL.createObjectURL(imageBlob)
    setBufferUrl(url)
  }

  const updateCubeMapBakeDebounced = useCallback(debounce(updateScenePreview, 500), []) //ms

  useEffect(() => {
    updateCubeMapBakeDebounced()
    return () => {
      updateCubeMapBakeDebounced.cancel()
    }
  }, [transformComponent.position])

  return (
    <NodeEditor
      {...props}
      name={t('editor:properties.sceneCamera.name')}
      description={t('editor:properties.sceneCamera.description')}
    >
      <PropertiesPanelButton
        onClick={() => {
          onSetFromViewport()
          updateScenePreview()
        }}
      >
        {t('editor:properties.sceneCamera.lbl-setFromViewPort')}
      </PropertiesPanelButton>
      <ImagePreviewInput value={bufferUrl} />
    </NodeEditor>
  )
}

ScenePreviewCameraNodeEditor.iconComponent = CameraAltIcon

export default ScenePreviewCameraNodeEditor
