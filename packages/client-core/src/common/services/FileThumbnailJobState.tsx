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

import { fileBrowserUploadPath, staticResourcePath } from '@etherealengine/common/src/schema.type.module'
import {
  Engine,
  EntityUUID,
  UUIDComponent,
  UndefinedEntity,
  createEntity,
  getComponent,
  removeComponent,
  removeEntity,
  setComponent
} from '@etherealengine/ecs'
import { previewScreenshot } from '@etherealengine/editor/src/functions/takeScreenshot'
import { useTexture } from '@etherealengine/engine/src/assets/functions/resourceHooks'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import { ModelComponent } from '@etherealengine/engine/src/scene/components/ModelComponent'
import { getModelSceneID } from '@etherealengine/engine/src/scene/functions/loaders/ModelFunctions'
import { defineState, getMutableState, none, useHookstate } from '@etherealengine/hyperflux'
import { TransformComponent } from '@etherealengine/spatial'
import { CameraComponent } from '@etherealengine/spatial/src/camera/components/CameraComponent'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { GroupComponent } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import {
  ObjectLayerComponents,
  ObjectLayerMaskComponent
} from '@etherealengine/spatial/src/renderer/components/ObjectLayerComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import { ObjectLayers } from '@etherealengine/spatial/src/renderer/constants/ObjectLayers'
import createReadableTexture from '@etherealengine/spatial/src/renderer/functions/createReadableTexture'
import {
  BoundingBoxComponent,
  updateBoundingBox
} from '@etherealengine/spatial/src/transform/components/BoundingBoxComponents'
import { iterateEntityNode } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { computeTransformMatrix } from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import React, { useEffect, useLayoutEffect } from 'react'
import { Group, MathUtils, Vector3 } from 'three'
import { uploadToFeathersService } from '../../util/upload'
import { getCanvasBlob } from '../utils'

type ThumbnailJob = Record<
  string,
  {
    key: string
    project: string // the project name
    id: string // the existing static resource ID
  }
>

const seekVideo = (video: HTMLVideoElement, time: number): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    video.currentTime = time
    video.onerror = reject
    video.onseeked = () => {
      video.onerror = null
      video.onseeked = null
      resolve()
    }
  })

const drawToCanvas = (source: CanvasImageSource): Promise<HTMLCanvasElement | null> => {
  const canvas = document.createElement('canvas')
  canvas.width = 90
  canvas.height = 90
  const ctx = canvas.getContext('2d')
  if (ctx == null) {
    return Promise.reject()
  }
  ctx.drawImage(source, 0, 0, 90, 90)
  return Promise.resolve(canvas)
}

const uploadThumbnail = async (key: string, projectName: string, staticResourceId: string, blob: Blob | null) => {
  if (!blob) return
  const thumbnailType = 'automatic'
  const thumbnailKey = `${key.replace(/^.*?\/projects\//, '').replaceAll('/', '-')}-thumbnail.png`
  const file = new File([blob], thumbnailKey)
  const path = `projects/${projectName}/thumbnails`
  const upload: Promise<string[]> = uploadToFeathersService(fileBrowserUploadPath, [file], {
    fileName: file.name,
    path,
    contentType: ''
  }).promise
  const thumbnailURL = (await upload)[0]
  await Engine.instance.api.service(staticResourcePath).patch(staticResourceId, { thumbnailURL, thumbnailType })
}

export const FileThumbnailJobState = defineState({
  name: 'FileThumbnailJobState',
  initial: {} as ThumbnailJob,
  reactor: () => {
    const state = useHookstate(getMutableState(FileThumbnailJobState))
    return (
      <>
        {state.keys.map((key) => (
          <ThumbnailJobReactor key={key} src={key} />
        ))}
      </>
    )
  }
})

type ThumbnailFileType = 'image' | 'model' | 'texture' | 'video'

const extensionThumbnailTypes: { extensions: string[]; thumbnailType: ThumbnailFileType }[] = [
  { extensions: ['gltf', 'glb', 'vrm', 'usdz', 'fbx'], thumbnailType: 'model' },
  { extensions: ['png', 'jpeg', 'jpg'], thumbnailType: 'image' },
  { extensions: ['ktx2'], thumbnailType: 'texture' },
  { extensions: ['mp4', 'm3u8'], thumbnailType: 'video' }
]
const extensionThumbnailTypeMap = new Map<string, ThumbnailFileType>()
for (const { extensions, thumbnailType } of extensionThumbnailTypes) {
  for (const extension of extensions) {
    extensionThumbnailTypeMap.set(extension, thumbnailType)
  }
}

export const extensionCanHaveThumbnail = (ext: string): boolean => extensionThumbnailTypeMap.has(ext)

const ThumbnailJobReactor = (props: { src: string }) => {
  const extension = props.src.split('.').pop() ?? ''
  const fileType = extensionThumbnailTypeMap.get(extension)
  if (fileType == null) {
    return null
  }
  const jobState = useHookstate(getMutableState(FileThumbnailJobState)[props.src])
  const state = useHookstate({
    fileType,
    entity: UndefinedEntity
  })
  const loadPromiseState = useHookstate(null as Promise<any> | null) // for asset loading
  const sceneState = useHookstate(getMutableState(SceneState).scenes) // for model rendering
  const [tex, texUnload] = useTexture(state.fileType.value === 'texture' ? props.src : '') // for texture loading
  useLayoutEffect(() => texUnload, []) // deallocate texture on unmount

  // Load and render image
  useEffect(() => {
    if (state.fileType.value !== 'image') return
    if (loadPromiseState.value != null) return
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = props.src
    loadPromiseState.set(
      image
        .decode()
        .then(() => drawToCanvas(image))
        .then(getCanvasBlob)
        .then((blob) => uploadThumbnail(props.src, jobState.project.value, jobState.id.value, blob))
        .then(() => jobState.set(none))
    )
  }, [state.fileType.value])

  // Load and render video
  useEffect(() => {
    if (state.fileType.value !== 'video') return
    if (loadPromiseState.value != null) return
    const video: HTMLVideoElement = document.createElement('video')
    video.src = props.src
    video.crossOrigin = 'anonymous'
    loadPromiseState.set(
      seekVideo(video, 1)
        .then(() => drawToCanvas(video))
        .then(getCanvasBlob)
        .then((blob) => uploadThumbnail(props.src, jobState.project.value, jobState.id.value, blob))
        .then(() => jobState.set(none))
    )
  }, [state.fileType.value])

  // Load and render texture
  useEffect(() => {
    if (state.fileType.value !== 'texture') return
    if (loadPromiseState.value != null) return
    if (!tex.value) return

    const image = new Image()
    image.crossOrigin = 'anonymous'

    loadPromiseState.set(
      createReadableTexture(tex.value, { url: true })
        .then((result) => {
          image.src = result as string
          return image.decode()
        })
        .then(() => drawToCanvas(image))
        .then(getCanvasBlob)
        .then((blob) => uploadThumbnail(props.src, jobState.project.value, jobState.id.value, blob))
        .then(() => jobState.set(none))
    )
    tex.value.dispose()
  }, [state.fileType.value, tex.value])

  // Load models
  useEffect(() => {
    if (state.fileType.value !== 'model') return

    const entity = createEntity()
    setComponent(entity, NameComponent, 'thumbnail job asset ' + props.src)
    const uuid = MathUtils.generateUUID() as EntityUUID
    setComponent(entity, UUIDComponent, uuid)
    setComponent(entity, ModelComponent, { src: props.src, cameraOcclusion: false })
    setComponent(entity, VisibleComponent)
    setComponent(entity, BoundingBoxComponent)

    ObjectLayerMaskComponent.setLayer(entity, ObjectLayers.AssetPreview)

    state.entity.set(entity)
  }, [state.fileType.value])

  // Render model to canvas
  useEffect(() => {
    if (state.fileType.value !== 'model' || !state.entity.value) return

    const entity = state.entity.value

    const sceneID = getModelSceneID(entity)

    if (!sceneState.value[sceneID]) return

    updateBoundingBox(entity)

    const bbox = getComponent(entity, BoundingBoxComponent).box
    const length = bbox.getSize(new Vector3(0, 0, 0)).length()
    const normalizedSize = new Vector3().setScalar(length)

    const cameraEntity = createEntity()
    setComponent(cameraEntity, VisibleComponent, true)
    setComponent(cameraEntity, NameComponent, 'thumbnail job camera for ' + props.src)

    // make camera look at the model from outside it's bounding box
    setComponent(cameraEntity, TransformComponent, { position: normalizedSize.add(bbox.getCenter(new Vector3())) })
    computeTransformMatrix(cameraEntity)
    setComponent(cameraEntity, CameraComponent)
    const camera = getComponent(cameraEntity, CameraComponent)
    camera.lookAt(0, 0, 0)
    computeTransformMatrix(cameraEntity)
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
    const viewCamera = camera.cameras[0]
    viewCamera.matrixWorld.copy(camera.matrixWorld)
    viewCamera.matrixWorldInverse.copy(camera.matrixWorldInverse)
    viewCamera.projectionMatrix.copy(camera.projectionMatrix)
    viewCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse)
    ObjectLayerMaskComponent.setLayer(cameraEntity, ObjectLayers.AssetPreview)
    viewCamera.layers.mask = getComponent(cameraEntity, ObjectLayerMaskComponent)

    const group = getComponent(entity, GroupComponent)[0] as Group

    iterateEntityNode(entity, (child) => {
      setComponent(child, ObjectLayerComponents[ObjectLayers.AssetPreview])
    })

    previewScreenshot(90, 90, 0.9, 'png', getComponent(cameraEntity, CameraComponent), group, ObjectLayers.AssetPreview)
      .then((blob) => uploadThumbnail(props.src, jobState.project.value, jobState.id.value, blob))
      .then(() => jobState.set(none))

    iterateEntityNode(entity, (child) => {
      removeComponent(child, ObjectLayerComponents[ObjectLayers.AssetPreview])
    })

    removeEntity(entity)
    removeEntity(cameraEntity)
  }, [state.entity.value, sceneState.keys])

  return null
}
