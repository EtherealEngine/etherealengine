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
import {
  BufferAttribute,
  BufferGeometry,
  CompressedTexture,
  DoubleSide,
  InterleavedBufferAttribute,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector2
} from 'three'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { useHookstate } from '@etherealengine/hyperflux'

import config from '@etherealengine/common/src/config'
import { StaticResourceType } from '@etherealengine/common/src/schema.type.module'
import { AssetLoader } from '../../assets/classes/AssetLoader'
import { AssetClass } from '../../assets/enum/AssetClass'
import { defineComponent, useComponent } from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { EngineRenderer } from '../../renderer/WebGLRendererSystem'
import { ImageAlphaMode, ImageAlphaModeType, ImageProjection, ImageProjectionType } from '../classes/ImageUtils'
import { addObjectToGroup, removeObjectFromGroup } from '../components/GroupComponent'
import { addError, clearErrors } from '../functions/ErrorFunctions'

export const PLANE_GEO = new PlaneGeometry(1, 1, 1, 1)
export const SPHERE_GEO = new SphereGeometry(1, 64, 32)
export const PLANE_GEO_FLIPPED = flipNormals(new PlaneGeometry(1, 1, 1, 1))
export const SPHERE_GEO_FLIPPED = flipNormals(new SphereGeometry(1, 64, 32))

export type ImageResource = {
  source?: string
  ktx2StaticResource?: StaticResourceType
  pngStaticResource?: StaticResourceType
  jpegStaticResource?: StaticResourceType
  gifStaticResource?: StaticResourceType
  id?: EntityUUID
}

export const ImageComponent = defineComponent({
  name: 'EE_image',
  jsonID: 'image',

  onInit: (entity) => {
    return {
      source: `${config.client.fileServer}/projects/default-project/assets/sample_etc1s.ktx2`,
      alphaMode: ImageAlphaMode.Opaque as ImageAlphaModeType,
      alphaCutoff: 0.5,
      projection: ImageProjection.Flat as ImageProjectionType,
      side: DoubleSide,
      // runtime props
      mesh: new Mesh(PLANE_GEO as PlaneGeometry | SphereGeometry, new MeshBasicMaterial())
    }
  },

  toJSON: (entity, component) => {
    return {
      source: component.source.value,
      alphaMode: component.alphaMode.value,
      alphaCutoff: component.alphaCutoff.value,
      projection: component.projection.value,
      side: component.side.value
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    // backwards compatability
    if (typeof json.source === 'string' && json.source !== component.source.value) component.source.set(json.source)
    if (typeof json.alphaMode === 'string' && json.alphaMode !== component.alphaMode.value)
      component.alphaMode.set(json.alphaMode)
    if (typeof json.alphaCutoff === 'number' && json.alphaCutoff !== component.alphaCutoff.value)
      component.alphaCutoff.set(json.alphaCutoff)
    if (typeof json.projection === 'string' && json.projection !== component.projection.value)
      component.projection.set(json.projection)
    if (typeof json.side === 'number' && json.side !== component.side.value) component.side.set(json.side)
  },

  onRemove: (entity, component) => {
    component.mesh.material.map.value?.dispose()
    component.mesh.value.removeFromParent()
  },

  errors: ['MISSING_TEXTURE_SOURCE', 'UNSUPPORTED_ASSET_CLASS', 'LOADING_ERROR', 'INVALID_URL'],

  reactor: ImageReactor
})

const _size = new Vector2()
export function getTextureSize(texture: Texture | CompressedTexture | null, size: Vector2 = _size) {
  const image = texture?.image as (HTMLImageElement & HTMLCanvasElement & HTMLVideoElement) | undefined
  const width = image?.videoWidth || image?.naturalWidth || image?.width || 0
  const height = image?.videoHeight || image?.naturalHeight || image?.height || 0
  return size.set(width, height)
}

export function resizeImageMesh(mesh: Mesh<any, MeshBasicMaterial>) {
  if (!mesh.material.map) return

  const { width, height } = getTextureSize(mesh.material.map)

  if (!width || !height) return

  const ratio = (height || 1) / (width || 1)
  const _width = Math.min(1.0, 1.0 / ratio)
  const _height = Math.min(1.0, ratio)
  mesh.scale.set(_width, _height, 1)
}

function flipNormals<G extends BufferGeometry>(geometry: G) {
  const uvs = (geometry.attributes.uv as BufferAttribute | InterleavedBufferAttribute).array
  for (let i = 1; i < uvs.length; i += 2) {
    // @ts-ignore
    uvs[i] = 1 - uvs[i]
  }
  return geometry
}

export function ImageReactor() {
  const entity = useEntityContext()
  const image = useComponent(entity, ImageComponent)
  const texture = useHookstate(null as Texture | null)

  useEffect(
    function updateTextureSource() {
      if (!image.source.value) {
        return addError(entity, ImageComponent, `MISSING_TEXTURE_SOURCE`)
      }

      const assetType = AssetLoader.getAssetClass(image.source.value)
      if (assetType !== AssetClass.Image) {
        return addError(entity, ImageComponent, `UNSUPPORTED_ASSET_CLASS`)
      }

      AssetLoader.loadAsync(image.source.value)
        .then((_texture) => {
          texture.set(_texture)
        })
        .catch((e) => {
          addError(entity, ImageComponent, `LOADING_ERROR`, e.message)
        })

      return () => {
        // TODO: abort load request, pending https://github.com/mrdoob/three.js/pull/23070
      }
    },
    [image.source]
  )

  useEffect(
    function updateTexture() {
      if (!image) return
      if (!texture.value) return

      clearErrors(entity, ImageComponent)

      texture.value.colorSpace = SRGBColorSpace
      texture.value.minFilter = LinearMipmapLinearFilter

      image.mesh.material.map.ornull?.value.dispose()
      image.mesh.material.map.set(texture.value)
      image.mesh.visible.set(true)
      image.mesh.material.value.needsUpdate = true

      // upload to GPU immediately
      EngineRenderer.instance.renderer.initTexture(texture.value)

      const imageMesh = image.mesh.value
      addObjectToGroup(entity, imageMesh)

      return () => {
        removeObjectFromGroup(entity, imageMesh)
      }
    },
    [texture]
  )

  useEffect(
    function updateGeometry() {
      if (!image.mesh.material.map.value) return

      const flippedTexture = image.mesh.material.map.value.flipY
      switch (image.projection.value) {
        case ImageProjection.Equirectangular360:
          image.mesh.value.geometry = flippedTexture ? SPHERE_GEO : SPHERE_GEO_FLIPPED
          image.mesh.scale.value.set(-1, 1, 1)
          break
        case ImageProjection.Flat:
        default:
          image.mesh.value.geometry = flippedTexture ? PLANE_GEO : PLANE_GEO_FLIPPED
          resizeImageMesh(image.mesh.value)
      }
    },
    [image.mesh.material.map, image.projection]
  )

  useEffect(
    function updateMaterial() {
      const material = image.mesh.material.value
      material.transparent = image.alphaMode.value === ImageAlphaMode.Blend
      material.alphaTest = image.alphaMode.value === 'Mask' ? image.alphaCutoff.value : 0
      material.side = image.side.value
      material.needsUpdate = true
    },
    [image.alphaMode, image.alphaCutoff, image.side]
  )

  return null
}
