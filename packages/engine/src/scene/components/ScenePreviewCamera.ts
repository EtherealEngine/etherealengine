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
import { CameraHelper, PerspectiveCamera } from 'three'

import { getMutableState, none, useHookstate } from '@etherealengine/hyperflux'

import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import { defineComponent, getComponent, setComponent, useComponent } from '../../ecs/functions/ComponentFunctions'
import { createEntity, removeEntity, useEntityContext } from '../../ecs/functions/EntityFunctions'
import { EntityTreeComponent } from '../../ecs/functions/EntityTree'
import { RendererState } from '../../renderer/RendererState'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { ObjectLayers } from '../constants/ObjectLayers'
import { setObjectLayers } from '../functions/setObjectLayers'
import { addObjectToGroup } from './GroupComponent'
import { NameComponent } from './NameComponent'
import { setVisibleComponent } from './VisibleComponent'

export const ScenePreviewCameraComponent = defineComponent({
  name: 'EE_scenePreviewCamera',
  jsonID: 'scene-preview-camera',

  onInit: (entity) => {
    const camera = new PerspectiveCamera(80, 16 / 9, 0.2, 8000)

    return {
      camera,
      helperEntity: null as Entity | null
    }
  },

  toJSON: () => {
    return {} as any
  },

  reactor: function () {
    const entity = useEntityContext()
    const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility)
    const previewCamera = useComponent(entity, ScenePreviewCameraComponent)
    const previewCameraTransform = useComponent(entity, TransformComponent)
    const engineCameraTransform = useComponent(Engine.instance.cameraEntity, TransformComponent)

    useEffect(() => {
      const transform = getComponent(entity, TransformComponent)
      const cameraTransform = getComponent(Engine.instance.cameraEntity, TransformComponent)
      cameraTransform.position.copy(transform.position)
      cameraTransform.rotation.copy(transform.rotation)
      addObjectToGroup(entity, previewCamera.camera.value)
    }, [])

    useEffect(() => {
      engineCameraTransform.position.value.copy(previewCameraTransform.position.value)
      engineCameraTransform.rotation.value.copy(previewCameraTransform.rotation.value)
    }, [previewCameraTransform])

    useEffect(() => {
      if (!debugEnabled.value) return

      const helper = new CameraHelper(previewCamera.camera.value)
      helper.name = `scene-preview-helper-${entity}`
      const helperEntity = createEntity()
      addObjectToGroup(helperEntity, helper)
      setObjectLayers(helper, ObjectLayers.NodeHelper)
      setComponent(helperEntity, NameComponent, helper.name)
      setComponent(helperEntity, EntityTreeComponent, { parentEntity: entity })
      setVisibleComponent(helperEntity, true)
      previewCamera.helperEntity.set(helperEntity)

      return () => {
        removeEntity(helperEntity)
        previewCamera.helperEntity.set(none)
      }
    }, [debugEnabled])

    return null
  }
})
