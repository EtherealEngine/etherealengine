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

import { Paginated } from '@feathersjs/feathers/lib'

import { defineState, getMutableState } from '@etherealengine/hyperflux'

import {
  FileBrowserContentType,
  fileBrowserPath,
  staticResourcePath
} from '@etherealengine/common/src/schema.type.module'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { FileThumbnailJobState, extensionCanHaveThumbnail } from './FileThumbnailJobState'
import { NotificationService } from './NotificationService'

export const FILES_PAGE_LIMIT = 100

export const FileBrowserState = defineState({
  name: 'FileBrowserState',
  initial: () => ({
    files: [] as Array<FileBrowserContentType>,
    skip: 0,
    limit: FILES_PAGE_LIMIT,
    total: 0,
    retrieving: false,
    fetched: false,
    lastFetched: Date.now()
  })
})

let _lastDir = null! as string

const seenThumbnails = new Set<string>()

export const FileBrowserService = {
  fetchFiles: async (directory: string = _lastDir, skip = 0) => {
    const fileBrowserState = getMutableState(FileBrowserState)

    _lastDir = directory

    fileBrowserState.retrieving.set(true)

    try {
      const files = (await Engine.instance.api.service(fileBrowserPath).find({
        query: {
          $skip: skip * FILES_PAGE_LIMIT,
          $limit: FILES_PAGE_LIMIT,
          directory
        }
      })) as Paginated<FileBrowserContentType>

      Promise.all(
        files.data
          .filter((file) => extensionCanHaveThumbnail(file.key.split('.').pop() ?? ''))
          .map(async (file) => {
            const { key, url } = file

            if (seenThumbnails.has(key)) {
              return
            }

            seenThumbnails.add(key)

            const resources = await Engine.instance.api.service(staticResourcePath).find({
              query: { key }
            })

            if (resources.data.length === 0) {
              return
            }
            const resource = resources.data[0]
            if (resource.thumbnailURL != null) {
              return
            }
            getMutableState(FileThumbnailJobState)[url].set({
              key: url,
              project: resource.project,
              id: resource.id
            })

            // TODO: cache pending thumbnail promises by static resource key
          })
      )

      fileBrowserState.merge({
        files: files.data,
        skip: files.skip,
        total: files.total,
        retrieving: false,
        fetched: true,
        lastFetched: Date.now()
      })
    } catch (err) {
      NotificationService.dispatchNotify((err as Error)?.message, { variant: 'error' })
      fileBrowserState.retrieving.set(false)
    }
  },
  moveContent: async (oldName: string, newName: string, oldPath: string, newPath: string, isCopy = false) => {
    return Engine.instance.api.service(fileBrowserPath).update(null, { oldName, newName, oldPath, newPath, isCopy })
  },
  deleteContent: async (contentPath: string) => {
    await Engine.instance.api.service(fileBrowserPath).remove(contentPath)
  },
  addNewFolder: async (folderName: string) => {
    await Engine.instance.api.service(fileBrowserPath).create(folderName)
  },
  resetSkip: () => {
    const fileBrowserState = getMutableState(FileBrowserState)
    fileBrowserState.skip.set(0)
  },
  getNestingDirectory: () => {
    return Engine.instance.api
      .service(fileBrowserPath)
      .get('', { query: { getNestingDirectory: true } }) as Promise<string>
  }
}
