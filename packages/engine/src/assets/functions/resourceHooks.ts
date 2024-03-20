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

import { Entity, UUIDComponent, UndefinedEntity, getOptionalComponent } from '@etherealengine/ecs'
import { State, useHookstate } from '@etherealengine/hyperflux'
import { useEffect } from 'react'
import { MathUtils, Texture } from 'three'
import { LoadingArgs } from '../classes/AssetLoader'
import { GLTF } from '../loaders/gltf/GLTFLoader'
import { AssetType, ResourceManager, ResourceProgressState, ResourceType } from '../state/ResourceState'

function useLoader<T extends AssetType>(
  url: string,
  resourceType: ResourceType,
  entity: Entity = UndefinedEntity,
  params: LoadingArgs = {},
  //Called when the asset url is changed, mostly useful for editor functions when changing an asset
  onUnload: (url: string) => void = (url: string) => {}
): [State<T | null>, () => void, State<ErrorEvent | Error | null>, State<ProgressEvent<EventTarget> | null>] {
  const urlState = useHookstate<string>(url)
  const value = useHookstate<T | null>(null)
  const error = useHookstate<ErrorEvent | Error | null>(null)
  const progress = useHookstate<ProgressEvent<EventTarget> | null>(null)
  const uuid = useHookstate<string>(MathUtils.generateUUID())

  const unload = () => {
    if (url) ResourceManager.unload(url, entity, uuid.value)
  }

  useEffect(() => {
    const controller = new AbortController()
    if (url !== urlState.value) {
      if (urlState.value) {
        const oldUrl = urlState.value
        ResourceManager.unload(oldUrl, entity, uuid.value)
        value.set(null)
        progress.set(null)
        error.set(null)
        onUnload(oldUrl)
      }
      urlState.set(url)
    }

    if (!url) return

    if (entity) {
      const uuid = getOptionalComponent(entity, UUIDComponent)
      if (uuid) {
        ResourceProgressState.addResource(uuid, url)
      }
    }
    let completed = false

    ResourceManager.load<T>(
      url,
      resourceType,
      entity,
      params,
      (response) => {
        completed = true
        value.set(response)
        if (entity) {
          const uuid = getOptionalComponent(entity, UUIDComponent)
          if (uuid) ResourceProgressState.removeResource(uuid, url)
        }
      },
      (request) => {
        progress.set(request)
        if (entity) {
          const uuid = getOptionalComponent(entity, UUIDComponent)
          if (uuid) ResourceProgressState.updateResource(uuid, url, request.loaded, request.total)
        }
      },
      (err) => {
        // Effect was unmounted, can't set error state safely
        if (controller.signal.aborted) return
        completed = true
        error.set(err)
        if (entity) {
          const uuid = getOptionalComponent(entity, UUIDComponent)
          if (uuid) ResourceProgressState.removeResource(uuid, url)
        }
      },
      controller.signal,
      uuid.value
    )

    return () => {
      if (!completed)
        controller.abort(
          `resourceHooks:useLoader Component loading ${resourceType} at url ${url} for entity ${entity} was unmounted`
        )
    }
  }, [url])

  return [value, unload, error, progress]
}

function useBatchLoader<T extends AssetType>(
  urls: string[],
  resourceType: ResourceType,
  entity: Entity = UndefinedEntity,
  params: LoadingArgs = {}
): [
  State<(T | null)[]>,
  () => void,
  State<(ErrorEvent | Error | null)[]>,
  State<(ProgressEvent<EventTarget> | null)[]>
] {
  const values = useHookstate<T[]>(new Array(urls.length).fill(null))
  const errors = useHookstate<(ErrorEvent | Error)[]>(new Array(urls.length).fill(null))
  const progress = useHookstate<ProgressEvent<EventTarget>[]>(new Array(urls.length).fill(null))

  const unload = () => {
    for (const url of urls) ResourceManager.unload(url, entity)
  }

  useEffect(() => {
    const completedArr = new Array(urls.length).fill(false) as boolean[]
    const controller = new AbortController()

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      if (!url) continue
      ResourceManager.load<T>(
        url,
        resourceType,
        entity,
        params,
        (response) => {
          completedArr[i] = true
          values[i].set(response)
        },
        (request) => {
          progress[i].set(request)
        },
        (err) => {
          completedArr[i] = true
          errors[i].set(err)
        },
        controller.signal
      )
    }

    return () => {
      for (const completed of completedArr) {
        if (!completed) {
          controller.abort(
            `resourceHooks:useBatchLoader Component loading ${resourceType} at urls ${urls.toString()} for entity ${entity} was unmounted`
          )
          return
        }
      }
    }
  }, [JSON.stringify(urls)])

  return [values, unload, errors, progress]
}

async function getLoader<T extends AssetType>(
  url: string,
  resourceType: ResourceType,
  entity: Entity = UndefinedEntity,
  params: LoadingArgs = {}
): Promise<[T | null, () => void, ErrorEvent | Error | null]> {
  const unload = () => {
    ResourceManager.unload(url, entity)
  }

  return new Promise((resolve) => {
    const controller = new AbortController()
    ResourceManager.load<T>(
      url,
      resourceType,
      entity,
      params,
      (response) => {
        resolve([response, unload, null])
      },
      (request) => {},
      (err) => {
        resolve([null, unload, err])
      },
      controller.signal
    )
  })
}

export function useGLTF(
  url: string,
  entity?: Entity,
  params?: LoadingArgs,
  onUnload?: (url: string) => void
): [State<GLTF | null>, () => void, State<ErrorEvent | Error | null>, State<ProgressEvent<EventTarget> | null>] {
  return useLoader<GLTF>(url, ResourceType.GLTF, entity, params, onUnload)
}

export function useBatchGLTF(
  urls: string[],
  entity?: Entity,
  params?: LoadingArgs
): [
  State<(GLTF | null)[]>,
  () => void,
  State<(ErrorEvent | Error | null)[]>,
  State<(ProgressEvent<EventTarget> | null)[]>
] {
  return useBatchLoader<GLTF>(urls, ResourceType.GLTF, entity, params)
}

export async function getGLTFAsync(
  url: string,
  entity?: Entity,
  params?: LoadingArgs
): Promise<[GLTF | null, () => void, ErrorEvent | Error | null]> {
  return getLoader<GLTF>(url, ResourceType.GLTF, entity, params)
}

export function useTexture(
  url: string,
  entity?: Entity,
  params?: LoadingArgs,
  onUnload?: (url: string) => void
): [State<Texture | null>, () => void, State<ErrorEvent | Error | null>, State<ProgressEvent<EventTarget> | null>] {
  return useLoader<Texture>(url, ResourceType.Texture, entity, params, onUnload)
}

export async function getTextureAsync(
  url: string,
  entity?: Entity,
  params?: LoadingArgs
): Promise<[Texture | null, () => void, ErrorEvent | Error | null]> {
  return getLoader<Texture>(url, ResourceType.Texture, entity, params)
}
