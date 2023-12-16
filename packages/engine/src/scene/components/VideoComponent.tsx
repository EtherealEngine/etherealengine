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

import React, { useEffect } from 'react'
import {
  BackSide,
  BufferGeometry,
  DoubleSide,
  FrontSide,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Side,
  SphereGeometry,
  Texture,
  Vector2
} from 'three'

import { defineState } from '@etherealengine/hyperflux'

import { isMobile } from '../../common/functions/isMobile'
import { createPriorityQueue } from '../../ecs/PriorityQueue'
import { Entity } from '../../ecs/classes/Entity'
import {
  defineComponent,
  getComponent,
  setComponent,
  useComponent,
  useOptionalComponent
} from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { isMobileXRHeadset } from '../../xr/XRState'
import { ContentFitType, ObjectFitFunctions } from '../../xrui/functions/ObjectFitFunctions'
import { ImageProjection, ImageProjectionType } from '../classes/ImageUtils'
import { clearErrors } from '../functions/ErrorFunctions'
import { addObjectToGroup, removeObjectFromGroup } from './GroupComponent'
import { resizeImageMesh } from './ImageComponent'
import { MediaComponent, MediaElementComponent } from './MediaComponent'
import { UUIDComponent } from './UUIDComponent'

export const VideoTexturePriorityQueueState = defineState({
  name: 'VideoTexturePriorityQueueState',
  initial: () => {
    const accumulationBudget = isMobileXRHeadset || isMobile ? 1 : 3
    return {
      queue: createPriorityQueue({
        accumulationBudget
      })
    }
  }
})

class VideoTexturePriorityQueue extends Texture {
  isVideoTexture = true
  constructor(video) {
    super(video)
    this.minFilter = LinearFilter
    this.magFilter = LinearFilter
    this.generateMipmaps = false
  }
  update() {}
}

export const VideoComponent = defineComponent({
  name: 'EE_video',
  jsonID: 'video',

  onInit: (entity) => {
    const videoGroup = new Group()
    videoGroup.name = `video-group-${entity}`
    const videoMesh = new Mesh(new PlaneGeometry(1, 1, 1, 1) as BufferGeometry, new MeshBasicMaterial())
    return {
      side: DoubleSide as Side,
      size: new Vector2(1, 1),
      fit: 'contain' as ContentFitType,
      /**
       * An entity with with an attached MediaComponent.
       * If an empty string, then the current entity is used.
       */
      mediaUUID: '',
      videoGroup,
      videoMesh,
      projection: ImageProjection.Equirectangular360 as ImageProjectionType
    }
  },

  toJSON: (entity, component) => {
    return {
      mediaUUID: component.mediaUUID.value,
      side: component.side.value,
      size: component.size.value,
      fit: component.fit.value,
      projection: component.projection.value
    }
  },

  onSet: (entity, component, json) => {
    setComponent(entity, MediaComponent)

    if (!json) return
    if (typeof json.mediaUUID === 'string') component.mediaUUID.set(json.mediaUUID)
    if (typeof json.side === 'number') component.side.set(json.side)
    if (typeof json.size === 'object') component.size.set(new Vector2(json.size.x, json.size.y))
    if (typeof json.fit === 'string') component.fit.set(json.fit)
    if (typeof json.projection === 'string') component.projection.set(json.projection)
  },

  onRemove: (entity, component) => {
    component.videoGroup.value.removeFromParent()
    component.videoMesh.value.material.map?.dispose()
    if (VideoComponent.uniqueVideoEntities.includes(entity)) {
      VideoComponent.uniqueVideoEntities.splice(VideoComponent.uniqueVideoEntities.indexOf(entity), 1)
    }
  },

  errors: ['INVALID_MEDIA_UUID', 'MISSING_MEDIA_ELEMENT'],

  uniqueVideoEntities: [] as Entity[],

  reactor: VideoReactor
})

function VideoReactor() {
  const entity = useEntityContext()
  const video = useComponent(entity, VideoComponent)
  const mediaUUID = video.mediaUUID.value
  const mediaEntity = UUIDComponent.entitiesByUUID[mediaUUID] ?? entity

  useEffect(() => {
    video.videoGroup.value.add(video.videoMesh.value)
  }, [])

  // update side
  useEffect(() => {
    video.videoMesh.material.side.set(video.side.value)
  }, [video.side])

  // update mesh
  useEffect(() => {
    const mesh = video.videoMesh.value
    if (!mesh) return
    if (mesh.geometry) mesh.geometry.dispose()
    if (video.projection.value === ImageProjection.Equirectangular360) {
      mesh.geometry = new SphereGeometry(1, 64, 32)
      mesh.material.side = BackSide
      video.videoGroup.scale.value.setScalar(1)
    }
    if (video.projection.value === ImageProjection.Flat) {
      mesh.geometry = new PlaneGeometry(1, 1, 1, 1)
      mesh.material.side = FrontSide

      resizeImageMesh(mesh)
      const scale = ObjectFitFunctions.computeContentFitScale(
        mesh.scale.x,
        mesh.scale.y,
        video.size.width.value,
        video.size.height.value,
        video.fit.value
      )
      mesh.scale.multiplyScalar(scale)
      mesh.updateMatrix()
    }

    const videoGroup = video.videoGroup.value
    addObjectToGroup(entity, videoGroup)
    return () => removeObjectFromGroup(entity, videoGroup)
  }, [video.size, video.fit, video.videoMesh.material.map, video.projection])

  useEffect(() => {
    const map = video.videoMesh.material.map
    if (!map) return
    return () => {
      if (VideoComponent.uniqueVideoEntities.includes(entity)) {
        VideoComponent.uniqueVideoEntities.splice(VideoComponent.uniqueVideoEntities.indexOf(entity), 1)
      }
    }
  }, [video.videoMesh.material.map])

  return <VideoMediaSourceReactor mediaEntity={mediaEntity} key={mediaEntity} />
}

const VideoMediaSourceReactor = (props: { mediaEntity }) => {
  const entity = useEntityContext()
  const video = useComponent(entity, VideoComponent)

  const { mediaEntity } = props

  const mediaElement = useOptionalComponent(mediaEntity, MediaElementComponent)

  // update video texture
  useEffect(() => {
    if (!mediaEntity || !mediaElement) return
    const material = video.videoMesh.material.value
    const sourceVideoComponent = getComponent(mediaEntity, VideoComponent)
    const sourceMaterial = sourceVideoComponent.videoMesh.material
    if (material.map) {
      material.map.image = mediaElement.element.value as HTMLVideoElement
    } else {
      if (sourceMaterial.map) {
        video.videoMesh.value.material = sourceMaterial
      } else {
        material.map = new VideoTexturePriorityQueue(mediaElement.element.value as HTMLVideoElement)
        VideoComponent.uniqueVideoEntities.push(mediaEntity)
      }
    }
    material.needsUpdate = true
    clearErrors(entity, VideoComponent)
  }, [video, mediaEntity, mediaElement])

  return null
}
