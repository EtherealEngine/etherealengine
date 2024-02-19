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

import { DracoOptions, JoinOptions, PaletteOptions } from '@gltf-transform/functions'

import { OpaqueType } from '@etherealengine/common/src/interfaces/OpaqueType'

export type ResourceID = OpaqueType<'ResourceID'> & string

export type ParameterOverride<T> = OpaqueType<'ParameterOverride'> & {
  isParameterOverride: true
  enabled: boolean
  parameters: T
}

export function extractParameters<T>(parameters: ParameterOverride<T>) {
  if (!parameters.enabled) return {}
  if (typeof parameters.parameters === 'object' && !Array.isArray(parameters.parameters)) {
    return Object.fromEntries(
      Object.entries(parameters.parameters as object).map(([key, value]: [string, ParameterOverride<any>]) => {
        if (value.isParameterOverride) {
          if (value.enabled) return [key, extractParameters(value)]
          else return []
        } else return [key, value]
      })
    )
  } else if (Array.isArray(parameters.parameters)) {
    return [
      ...parameters.parameters.map((value) => {
        if (value.isParameterOverride) {
          if (value.enabled) return [extractParameters(value)]
          else return []
        } else return [value]
      })
    ]
  } else return parameters.parameters
}

export type ResourceParameters<T> = ParameterOverride<T> & {
  resourceId: ResourceID
}

export type ImageTransformParameters = ResourceParameters<{
  flipY: ParameterOverride<boolean>
  maxTextureSize: ParameterOverride<number>
  textureFormat: ParameterOverride<'default' | 'jpg' | 'ktx2' | 'png' | 'webp'>
  textureCompressionType: ParameterOverride<'etc1' | 'uastc'>
  textureCompressionQuality: ParameterOverride<number>
}>

export type ExtractedImageTransformParameters = {
  flipY: boolean
  linear: boolean
  mipmap: boolean
  maxTextureSize: number
  textureFormat: 'default' | 'jpg' | 'ktx2' | 'png' | 'webp'
  textureCompressionType: 'etc1' | 'uastc'
  textureCompressionQuality: number
  uastcLevel: number
  compLevel: number
  maxCodebooks: boolean
}

export type GeometryTransformParameters = ResourceParameters<{
  weld: ParameterOverride<number>
  dracoCompression: ParameterOverride<DracoOptions>
}>

export type ResourceTransforms = {
  geometries: GeometryTransformParameters[]
  images: ImageTransformParameters[]
}

export type ModelFormat = 'glb' | 'gltf' | 'vrm'

export type ModelTransformParameters = ExtractedImageTransformParameters & {
  src: string
  dst: string
  resourceUri: string
  split: boolean
  combineMaterials: boolean
  instance: boolean
  dedup: boolean
  flatten: boolean

  join: {
    enabled: boolean
    options: JoinOptions
  }

  palette: {
    enabled: boolean
    options: PaletteOptions
  }

  prune: boolean
  reorder: boolean
  resample: boolean

  weld: {
    enabled: boolean
    tolerance: number
  }

  meshoptCompression: {
    enabled: boolean
  }

  dracoCompression: {
    enabled: boolean
    options: DracoOptions
  }

  modelFormat: ModelFormat

  resources: ResourceTransforms
}

export const DefaultModelTransformParameters: ModelTransformParameters = {
  src: '',
  dst: '',
  resourceUri: '',
  modelFormat: 'gltf',
  split: true,
  combineMaterials: true,
  instance: true,
  dedup: true,
  flatten: true,
  join: {
    enabled: true,
    options: {
      keepMeshes: false,
      keepNamed: false
    }
  },
  palette: {
    enabled: false,
    options: {
      blockSize: 4,
      min: 2
    }
  },
  prune: true,
  reorder: true,
  resample: true,
  weld: {
    enabled: false,
    tolerance: 0.001
  },
  meshoptCompression: {
    enabled: true
  },
  dracoCompression: {
    enabled: false,
    options: {
      method: 'sequential',
      encodeSpeed: 0,
      decodeSpeed: 0,
      quantizePosition: 14,
      quantizeNormal: 8,
      quantizeColor: 8,
      quantizeTexcoord: 12,
      quantizeGeneric: 16,
      quantizationVolume: 'mesh'
    }
  },
  textureFormat: 'ktx2',
  textureCompressionType: 'etc1',
  uastcLevel: 4,
  compLevel: 4,
  maxCodebooks: true,
  flipY: false,
  linear: true,
  mipmap: true,
  textureCompressionQuality: 128,
  maxTextureSize: 1024,
  resources: {
    geometries: [],
    images: []
  }
}
