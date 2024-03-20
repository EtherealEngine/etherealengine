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

import { SceneID } from '@etherealengine/common/src/schema.type.module'
import { Engine, Entity, EntityUUID, getOptionalComponent } from '@etherealengine/ecs'
import { NO_PROXY, State, defineState, getMutableState, getState, none } from '@etherealengine/hyperflux'
import iterateObject3D from '@etherealengine/spatial/src/common/functions/iterateObject3D'
import { PerformanceState } from '@etherealengine/spatial/src/renderer/PerformanceState'
import { EngineRenderer } from '@etherealengine/spatial/src/renderer/WebGLRendererSystem'
import {
  Cache,
  CompressedTexture,
  DefaultLoadingManager,
  InstancedMesh,
  Light,
  LoadingManager,
  Material,
  Mesh,
  Object3D,
  SkinnedMesh,
  Texture
} from 'three'
import { SceneComponent } from '../../scene/components/SceneComponent'
import { SourceType } from '../../scene/materials/components/MaterialSource'
import { removeMaterialSource } from '../../scene/materials/functions/MaterialLibraryFunctions'
import { AssetLoader, LoadingArgs } from '../classes/AssetLoader'
import { Geometry } from '../constants/Geometry'
import { ResourceLoadingManager } from '../loaders/base/ResourceLoadingManager'
import { GLTF } from '../loaders/gltf/GLTFLoader'

//isProxified: used to check if an object is proxified
declare module 'three/src/core/Object3D' {
  export interface Object3D {
    readonly isProxified: true | undefined
  }
}

Cache.enabled = true

export enum ResourceStatus {
  Unloaded,
  Loading,
  Loaded,
  Error
}

export enum ResourceType {
  GLTF = 'GLTF',
  Mesh = 'Mesh',
  Texture = 'Texture',
  Geometry = 'Geometry',
  Material = 'Material',
  Unknown = 'Unknown'
  // ECSData = 'ECSData',
  // Audio = 'Audio',
}

export type AssetType = GLTF | Texture | CompressedTexture | Geometry | Material | Mesh

type BaseMetadata = {
  size?: number
}

type GLTFMetadata = {
  vertexCount: number
  textureWidths: number[]
} & BaseMetadata

type TexutreMetadata = {
  textureWidth: number
  onGPU: boolean
} & BaseMetadata

type Metadata = GLTFMetadata | TexutreMetadata | BaseMetadata

type Resource = {
  id: string
  status: ResourceStatus
  type: ResourceType
  references: Entity[]
  asset?: AssetType
  assetRefs?: Record<ResourceType, string[]>
  args?: LoadingArgs
  onLoads?: Record<string, (response: AssetType) => void>
  metadata: Metadata
}

const debug = false
const debugLog = debug
  ? (message?: any, ...optionalParams: any[]) => {
      console.log(message)
    }
  : () => {}

export const ResourceState = defineState({
  name: 'ResourceManagerState',
  initial: () => ({
    resources: {} as Record<string, Resource>,
    referencedAssets: {} as Record<string, string[]>,
    totalVertexCount: 0,
    totalBufferCount: 0
  })
})

export type ResourceProgressType = Record<
  string,
  {
    loadedAmount: number
    totalAmount: number
  }
>

export const ResourceProgressState = defineState({
  name: 'ResourceEntityUUIDState',
  initial: {} as Record<EntityUUID, ResourceProgressType>,

  addResource: (entityUUID: EntityUUID, url: string) => {
    if (getState(ResourceProgressState)[entityUUID]) {
      if (!getMutableState(ResourceProgressState)[entityUUID].keys.includes(url))
        getMutableState(ResourceProgressState)[entityUUID].merge({
          [url]: {
            loadedAmount: -1,
            totalAmount: 0
          }
        })
    } else {
      getMutableState(ResourceProgressState).merge({
        [entityUUID]: {
          [url]: {
            loadedAmount: -1,
            totalAmount: 0
          }
        }
      })
    }
  },

  updateResource: (entityUUID: EntityUUID, url: string, loaded: number, total: number) => {
    if (!getState(ResourceProgressState)[entityUUID]) return
    if (!getMutableState(ResourceProgressState)[entityUUID].keys.includes(url)) return
    // console.log('scene resources updateResource, entityUUID:', entityUUID, 'url:', url, 'loaded:', loaded, 'total:', total)
    getMutableState(ResourceProgressState)[entityUUID].merge({
      [url]: {
        loadedAmount: loaded,
        totalAmount: total
      }
    })
  },

  removeResource: (entityUUID: EntityUUID, url: string) => {
    if (!getState(ResourceProgressState)[entityUUID]) return
    if (!getMutableState(ResourceProgressState)[entityUUID].keys.includes(url)) return
    getMutableState(ResourceProgressState)[entityUUID][url].loadedAmount.set(
      getState(ResourceProgressState)[entityUUID][url].totalAmount
    )
  }
})

const setDefaultLoadingManager = (
  loadingManager: LoadingManager = new ResourceLoadingManager(
    onItemStart,
    onStart,
    onLoad,
    onProgress,
    onError
  ) as LoadingManager
) => {
  DefaultLoadingManager.itemStart = loadingManager.itemStart
  DefaultLoadingManager.itemEnd = loadingManager.itemEnd
  DefaultLoadingManager.itemError = loadingManager.itemError
  DefaultLoadingManager.resolveURL = loadingManager.resolveURL
  DefaultLoadingManager.setURLModifier = loadingManager.setURLModifier
  DefaultLoadingManager.addHandler = loadingManager.addHandler
  DefaultLoadingManager.removeHandler = loadingManager.removeHandler
  DefaultLoadingManager.getHandler = loadingManager.getHandler
  //@ts-ignore
  DefaultLoadingManager.itemEndFor = onItemLoadedFor
}

const onItemStart = (url: string) => {
  const resourceState = getMutableState(ResourceState)
  const resources = resourceState.nested('resources')
  if (!resources[url].value) {
    // console.warn('ResourceManager: asset loaded outside of the resource manager, url: ' + url)
    return
  }

  const resource = resources[url]
  if (resource.status.value === ResourceStatus.Unloaded) {
    resource.status.set(ResourceStatus.Loading)
  }
}

const onStart = (url: string, loaded: number, total: number) => {}
const onLoad = () => {
  if (debug) {
    const totalSize = getTotalSizeOfResources()
    const totalVerts = getTotalVertexCount()
    const totalBuff = getTotalBufferSize()
    debugLog(
      `ResourceState:onLoad: Loaded ${totalSize} bytes of resources, ${totalVerts} vertices, ${totalBuff} bytes in buffer`
    )

    //@ts-ignore
    window.resources = getState(ResourceState)
  }
}

const onItemLoadedFor = <T extends AssetType>(url: string, resourceType: ResourceType, id: string, asset: T) => {
  const resourceState = getMutableState(ResourceState)
  const resources = resourceState.nested('resources')
  const referencedAssets = resourceState.nested('referencedAssets')
  if (!resources[url].value) {
    // Volumetric models load assets that aren't managed by the resource manager
    // console.warn('ResourceManager:loadedFor asset loaded for asset that is not loaded: ' + url)
    return
  }

  debugLog(
    'ResourceManager:loadedFor loading asset of type ' + resourceType + ' with ID: ' + id + ' for asset at url: ' + url
  )

  if (!referencedAssets[id].value) {
    referencedAssets.merge({
      [id]: []
    })
  }

  if (!resources[id].value) {
    resources.merge({
      [id]: {
        id: id,
        status: ResourceStatus.Loaded,
        type: resourceType,
        references: [],
        asset: asset,
        metadata: {}
      }
    })
    const callbacks = Callbacks[resourceType]
    callbacks.onStart(resources[id])
    callbacks.onLoad(asset, resources[id], resourceState)
  }

  if (!resources[url].assetRefs.value)
    resources[url].assetRefs.set({ [resourceType]: [id] } as Record<ResourceType, string[]>)
  else if (!resources[url].assetRefs[resourceType].value) resources[url].assetRefs.merge({ [resourceType]: [id] })
  else resources[url].assetRefs[resourceType].merge([id])

  /**@todo figure out a way to uniquely map an asset for a GLTF to the GLTF resource */
  referencedAssets[id].set([url])
}

const onProgress = (url: string, loaded: number, total: number) => {}
const onError = (url: string) => {}

setDefaultLoadingManager()

const getTotalSizeOfResources = () => {
  let size = 0
  const resources = getState(ResourceState).resources
  for (const key in resources) {
    const resource = resources[key]
    if (resource.metadata.size) size += resource.metadata.size
  }

  return size
}

const getTotalBufferSize = () => {
  let size = 0
  const resources = getState(ResourceState).resources
  for (const key in resources) {
    const resource = resources[key]
    if (resource.type == ResourceType.Texture && resource.metadata.size) size += resource.metadata.size
  }

  return size
}

const getTotalVertexCount = () => {
  let verts = 0
  const resources = getState(ResourceState).resources
  for (const key in resources) {
    const resource = resources[key]
    if (resource.type == ResourceType.GLTF && (resource.metadata as GLTFMetadata).vertexCount)
      verts += (resource.metadata as GLTFMetadata).vertexCount
  }

  return verts
}

const getRendererInfo = () => {
  if (!EngineRenderer.instance || !EngineRenderer.instance.renderer) return {}
  return {
    memory: EngineRenderer.instance.renderer.info.memory,
    programCount: EngineRenderer.instance.renderer.info.programs?.length
  }
}

const Callbacks = {
  [ResourceType.GLTF]: {
    onStart: (resource: State<Resource>) => {},
    onLoad: (response: GLTF, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {
      const resources = getMutableState(ResourceState).nested('resources')
      const geometryIDs = resource.assetRefs[ResourceType.Geometry]
      const metadata = resource.metadata as State<GLTFMetadata>
      if (geometryIDs && geometryIDs.value) {
        let vertexCount = 0
        for (const geoID of geometryIDs.value) {
          const geoResource = resources[geoID].value
          const verts = (geoResource.metadata as GLTFMetadata).vertexCount
          if (verts) vertexCount += verts
        }
        metadata.merge({ vertexCount: vertexCount })
        resourceState.totalVertexCount.set(resourceState.totalVertexCount.value + vertexCount)
      }
      const textureIDs = resource.assetRefs[ResourceType.Texture]
      if (textureIDs && textureIDs.value) {
        const textureWidths = [] as number[]
        for (const textureID of textureIDs.value) {
          const texResource = resources[textureID].value
          const textureWidth = (texResource.metadata as TexutreMetadata).textureWidth
          if (textureWidth) textureWidths.push(textureWidth)
        }
        metadata.textureWidths.set(textureWidths)
      }
    },
    onProgress: (request: ProgressEvent, resource: State<Resource>) => {
      resource.metadata.size.set(request.total)
    },
    onError: (event: ErrorEvent | Error, resource: State<Resource>) => {},
    onUnload: (asset: GLTF, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {
      removeMaterialSource({ type: SourceType.MODEL, path: resource.id.value })
      const metadata = resource.metadata.value as GLTFMetadata
      if (metadata.vertexCount)
        resourceState.totalVertexCount.set(resourceState.totalVertexCount.value - metadata.vertexCount)
    }
  },
  [ResourceType.Texture]: {
    onStart: (resource: State<Resource>) => {
      resource.metadata.merge({ onGPU: false })
    },
    onLoad: (
      response: Texture | CompressedTexture,
      resource: State<Resource>,
      resourceState: State<typeof ResourceState._TYPE>
    ) => {
      response.onUpdate = () => {
        resource.metadata.merge({ onGPU: true })
        //@ts-ignore
        response.onUpdate = null
      }
      //Compressed texture size
      if (response.mipmaps[0]) {
        let size = 0
        for (const mip of response.mipmaps) {
          size += mip.data.byteLength
        }
        resource.metadata.size.set(size)
        // Non compressed texture size
      } else {
        const height = response.image.height
        const width = response.image.width
        const size = width * height * 4
        resource.metadata.size.set(size)
      }

      resource.metadata.merge({ textureWidth: response.image.width })
      resourceState.totalBufferCount.set(resourceState.totalBufferCount.value + resource.metadata.size.value!)
    },
    onProgress: (request: ProgressEvent, resource: State<Resource>) => {},
    onError: (event: ErrorEvent | Error, resource: State<Resource>) => {},
    onUnload: (
      asset: Texture | CompressedTexture,
      resource: State<Resource>,
      resourceState: State<typeof ResourceState._TYPE>
    ) => {
      asset.dispose()
      const size = resource.metadata.size.value
      if (size) resourceState.totalBufferCount.set(resourceState.totalBufferCount.value - size)
    }
  },
  [ResourceType.Material]: {
    onStart: (resource: State<Resource>) => {},
    onLoad: (response: Material, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {},
    onProgress: (request: ProgressEvent, resource: State<Resource>) => {},
    onError: (event: ErrorEvent | Error, resource: State<Resource>) => {},
    onUnload: (asset: Material, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {
      for (const [key, val] of Object.entries(asset) as [string, Texture][]) {
        if (val && typeof val.dispose === 'function') {
          val.dispose()
        }
      }
      asset.dispose()
    }
  },
  [ResourceType.Geometry]: {
    onStart: (resource: State<Resource>) => {},
    onLoad: (response: Geometry, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {
      // Estimated geometry size
      let size = 0
      for (const name in response.attributes) {
        const attr = response.getAttribute(name)
        size += attr.count * attr.itemSize * attr.array.BYTES_PER_ELEMENT
      }

      const indices = response.getIndex()
      if (indices) {
        resource.metadata.merge({ vertexCount: indices.count })
        size += indices.count * indices.itemSize * indices.array.BYTES_PER_ELEMENT
      }
      resource.metadata.size.set(size)
    },
    onProgress: (request: ProgressEvent, resource: State<Resource>) => {},
    onError: (event: ErrorEvent | Error, resource: State<Resource>) => {},
    onUnload: (asset: Geometry, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {
      asset.dispose()
      for (const key in asset.attributes) {
        asset.deleteAttribute(key)
      }
      for (const key in asset.morphAttributes) {
        delete asset.morphAttributes[key]
      }

      //@ts-ignore todo - figure out why check errors flags this
      if (asset.boundsTree) asset.disposeBoundsTree()
    }
  },
  [ResourceType.Mesh]: {
    onStart: (resource: State<Resource>) => {},
    onLoad: (response: Material, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {},
    onProgress: (request: ProgressEvent, resource: State<Resource>) => {},
    onError: (event: ErrorEvent | Error, resource: State<Resource>) => {},
    onUnload: (asset: Mesh, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {
      const skinnedMesh = asset as SkinnedMesh
      if (skinnedMesh.isSkinnedMesh && skinnedMesh.skeleton) {
        skinnedMesh.skeleton.dispose()
      }

      // InstancedMesh or anything with a dispose function
      const instancedMesh = asset as InstancedMesh
      if (instancedMesh.isInstancedMesh || typeof instancedMesh.dispose === 'function') {
        instancedMesh.dispose()
      }
    }
  },
  [ResourceType.Unknown]: {
    onStart: (resource: State<Resource>) => {},
    onLoad: (response: Material, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {},
    onProgress: (request: ProgressEvent, resource: State<Resource>) => {},
    onError: (event: ErrorEvent | Error, resource: State<Resource>) => {},
    onUnload: (asset: AssetType, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => {}
  }
} as {
  [key in ResourceType]: {
    onStart: (resource: State<Resource>) => void
    onLoad: (response: AssetType, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => void
    onProgress: (request: ProgressEvent, resource: State<Resource>) => void
    onError: (event: ErrorEvent | Error, resource: State<Resource>) => void
    onUnload: (asset: AssetType, resource: State<Resource>, resourceState: State<typeof ResourceState._TYPE>) => void
  }
}

const checkBudgets = () => {
  const resourceState = getState(ResourceState)
  const performanceState = getState(PerformanceState)
  const maxVerts = performanceState.budgets.maxVerticies
  const maxBuffer = performanceState.budgets.maxBufferSize
  const currVerts = resourceState.totalVertexCount
  const currBuff = resourceState.totalBufferCount
  if (currVerts > maxVerts)
    console.warn('ResourceState:GLTF:onLoad Exceeded vertex budget, budget: ' + maxVerts + ', loaded: ' + currVerts)
  if (currBuff > maxBuffer)
    console.warn('ResourceState:GLTF:onLoad Exceeded buffer budget, budget: ' + maxBuffer + ', loaded: ' + currBuff)
}

const load = <T extends AssetType>(
  url: string,
  resourceType: ResourceType,
  entity: Entity,
  args: LoadingArgs,
  onLoad: (response: T) => void,
  onProgress: (request: ProgressEvent) => void,
  onError: (event: ErrorEvent | Error) => void,
  signal: AbortSignal,
  uuid?: string
) => {
  const resourceState = getMutableState(ResourceState)
  const resources = resourceState.nested('resources')
  let callbacks = Callbacks[resourceType]
  if (!resources[url].value) {
    resources.merge({
      [url]: {
        id: url,
        status: ResourceStatus.Unloaded,
        type: resourceType,
        references: [entity],
        metadata: {},
        args: args,
        onLoads: {}
      }
    })
  } else {
    //No need for callbacks if the asset has already been loaded
    callbacks = Callbacks[ResourceType.Unknown]
    resources[url].references.merge([entity])
  }
  if (uuid) resources[url].onLoads.merge({ [uuid]: onLoad })

  const resource = resources[url]
  callbacks.onStart(resource)
  debugLog('ResourceManager:load Loading resource: ' + url + ' for entity: ' + entity)
  AssetLoader.load(
    url,
    args,
    (response: T) => {
      resource.status.set(ResourceStatus.Loaded)
      resource.asset.set(response)
      callbacks.onLoad(response, resource, resourceState)
      debugLog('ResourceManager:load Loaded resource: ' + url + ' for entity: ' + entity)
      checkBudgets()
      onLoad(response)
    },
    (request) => {
      callbacks.onProgress(request, resource)
      onProgress(request)
    },
    (error) => {
      console.warn(`ResourceManager:load error loading ${resourceType} at url ${url} for entity ${entity}`)
      if (resource && resource.value && resource.status.value) {
        resource.status.set(ResourceStatus.Error)
        callbacks.onError(error, resource)
      }
      onError(error)
      unload(url, entity, uuid)
    },
    signal
  )
}

const update = (url: string) => {
  const resourceState = getMutableState(ResourceState)
  const resources = resourceState.nested('resources')
  const resource = resources[url]
  if (!resource.value) {
    console.warn('ResourceManager:update No resource found to update for url: ' + url)
    return
  }
  const onLoads = resource.onLoads.get(NO_PROXY)
  if (!onLoads) {
    console.warn('ResourceManager:update No callbacks found to update for url: ' + url)
    return
  }

  debugLog('ResourceManager:update Updating asset for url: ' + url)
  removeReferencedResources(resource)
  for (const [_, onLoad] of Object.entries(onLoads)) {
    AssetLoader.load(
      url,
      resource.args.value || {},
      (response: AssetType) => {
        resource.asset.set(response)
        onLoad(response)
      },
      (request) => {},
      (error) => {}
    )
  }
}

const unload = (url: string, entity: Entity, uuid?: string) => {
  const resourceState = getMutableState(ResourceState)
  const resources = resourceState.nested('resources')
  if (!resources[url].value) {
    console.warn('ResourceManager:unload No resource exists for url: ' + url)
    return
  }

  debugLog('ResourceManager:unload Unloading resource: ' + url + ' for entity: ' + entity)
  const resource = resources[url]
  if (uuid) resource.onLoads.merge({ [uuid]: none })
  resource.references.set((entities) => {
    const index = entities.indexOf(entity)
    if (index > -1) {
      entities.splice(index, 1)
    }
    return entities
  })

  if (resource.references.length == 0) {
    if (debug) debugLog('Before Removing Resources: ' + JSON.stringify(getRendererInfo()))
    removeReferencedResources(resource)
    removeResource(url)
    if (debug) debugLog('After Removing Resources: ' + JSON.stringify(getRendererInfo()))
  }
}

const unloadObj = (obj: Object3D, sceneID: SceneID | undefined) => {
  const remove = (obj: Object3D) => {
    const light = obj as Light // anything with dispose function
    if (typeof light.dispose === 'function') light.dispose()

    const scene = Engine.instance.scene
    const index = scene.children.indexOf(obj)
    if (index > -1) scene.children.splice(index, 1)
  }

  if (obj.isProxified) {
    remove(obj)
  } else {
    iterateObject3D(obj, remove, (obj: Object3D) => getOptionalComponent(obj.entity, SceneComponent) === sceneID)
  }
}

const removeReferencedResources = (resource: State<Resource>) => {
  const resourceState = getMutableState(ResourceState)
  const referencedAssets = resourceState.referencedAssets

  if (!resource.assetRefs.value) return

  for (const resourceType in ResourceType) {
    const assetRefs = resource.assetRefs[resourceType as ResourceType]
    if (!assetRefs.value) continue
    for (const ref of assetRefs.value) {
      if (referencedAssets[ref].value) {
        referencedAssets[ref].set((refs) => {
          const index = refs.indexOf(resource.id.value)
          if (index > -1) {
            refs.splice(index, 1)
          }
          return refs
        })

        if (referencedAssets[ref].length == 0) {
          removeResource(ref)
          referencedAssets[ref].set(none)
        }
      }
    }
  }
}

const removeResource = (id: string) => {
  const resourceState = getMutableState(ResourceState)
  const resources = resourceState.nested('resources')
  if (!resources[id].value) {
    console.warn('ResourceManager:removeResource No resource exists at id: ' + id)
    return
  }

  const resource = resources[id]
  debugLog('ResourceManager:removeResource: Removing ' + resource.type.value + ' resource with ID: ' + id)
  Cache.remove(id)

  const asset = resource.asset.get(NO_PROXY)
  if (asset) {
    Callbacks[resource.type.value].onUnload(asset, resource, resourceState)
  }

  resources[id].set(none)
}

export const ResourceManager = {
  load,
  unload,
  unloadObj,
  update,
  setDefaultLoadingManager
}
