/**
 * @author Tanya Vykliuk <tanya.vykliuk@gmail.com>
 */
import { useDispatch } from '../../store'
import { AlertService } from '../../common/services/AlertService'
import { client } from '../../feathers'
import { upload } from '../../util/upload'
import { ArMediaResult } from '@xrengine/common/src/interfaces/ArMediaResult'
import { createState, DevTools, useState, none, Downgraded } from '@hookstate/core'
import { ArMedia } from '@xrengine/common/src/interfaces/ArMedia'
import { store } from '../../store'

//Service
export const ARMEDIA_PAGE_LIMIT = 100

const state = createState({
  arMedia: {
    arMedia: [] as Array<ArMedia>,
    skip: 0,
    limit: ARMEDIA_PAGE_LIMIT,
    total: 0,
    retrieving: false,
    fetched: false,
    updateNeeded: true,
    lastFetched: Date.now()
  },
  adminList: [],
  list: [] as Array<ArMedia>,
  fetching: false,
  item: {} as ArMedia | {},
  fetchingItem: false
})

store.receptors.push((action: ArMediaActionType): any => {
  state.batch((s) => {
    let result: any
    switch (action.type) {
      case 'ARMEDIA_FETCHING':
        return s.merge({
          fetching: true
        })
      case 'ARMEDIA_ADMIN_RETRIEVED':
        result = action.list
        return s.merge({
          arMedia: {
            arMedia: result.data,
            skip: result.skip,
            total: result.total,
            limit: result.limit,
            retrieving: false,
            fetched: true,
            updateNeeded: false,
            lastFetched: Date.now()
          }
        })
      case 'ARMEDIA_RETRIEVED':
        return s.merge({ list: action.list, fetching: false })
      case 'ADD_ARMEDIA':
        return s.merge({
          arMedia: {
            ...s.arMedia.value,
            updateNeeded: true
          }
        })
      case 'REMOVE_ARMEDIA':
        return s.merge({
          arMedia: {
            ...s.arMedia.value,
            updateNeeded: true
          }
        })
      case 'ARMEDIA_FETCHING_ITEM':
        return s.merge({
          fetchingItem: true
        })
      case 'ARMEDIA_RETRIEVED_ITEM':
        return s.merge({ item: action.item, fetchingItem: false })
      case 'UPDATE_AR_MEDIA':
        return s.merge({
          arMedia: {
            ...s.arMedia.value,
            updateNeeded: true
          }
        })
    }
  }, action.type)
})

export const accessArMediaState = () => state
export const useArMediaState = () => useState(state)

//Service
export const ArMediaService = {
  getArMediaService: async (type?: string, limit: Number = 12) => {
    const dispatch = useDispatch()
    {
      try {
        dispatch(ArMediaAction.fetchingArMedia())
        const list = await client.service('ar-media').find({
          query: {
            action: type,
            $limit: limit
          }
        })
        dispatch(ArMediaAction.setAdminArMedia(list))
      } catch (err) {
        console.log(err)
        AlertService.dispatchAlertError(err.message)
      }
    }
  },
  getArMedia: async (type?: string) => {
    const dispatch = useDispatch()
    {
      try {
        dispatch(ArMediaAction.fetchingArMedia())
        const list = await client.service('ar-media').find({ query: { action: type || null } })
        dispatch(ArMediaAction.setArMedia(list.data))
      } catch (err) {
        console.log(err)
        AlertService.dispatchAlertError(err.message)
      }
    }
  },
  getArMediaItem: async (itemId: string) => {
    const dispatch = useDispatch()
    {
      try {
        dispatch(ArMediaAction.fetchingArMediaItem(itemId))
        const item = await client.service('ar-media').get(itemId)
        dispatch(ArMediaAction.retrievedArMediaItem(item))
      } catch (err) {
        console.log(err)
        AlertService.dispatchAlertError(err.message)
      }
    }
  },
  uploadFile: async (files) => {
    const manifest = files.manifest instanceof File ? ((await upload(files.manifest, null)) as any) : null
    const audio = files.audio instanceof File ? ((await upload(files.audio, null)) as any) : null
    const dracosis = files.dracosis instanceof File ? ((await upload(files.dracosis, null)) as any) : null
    const preview = files.preview instanceof File ? ((await upload(files.preview, null)) as any) : null
    return {
      manifestId: manifest?.file_id,
      audioId: audio?.file_id,
      dracosisId: dracosis?.file_id,
      previewId: preview?.file_id
    }
  },
  createArMedia: async (mediaItem: any, files: any) => {
    const dispatch = useDispatch()
    {
      try {
        const file = await ArMediaService.uploadFile(files)
        const newItem = await client.service('ar-media').create({
          ...mediaItem,
          ...file
        })
        dispatch(ArMediaAction.addAdminArMedia(newItem))
      } catch (err) {
        console.log(err)
        AlertService.dispatchAlertError(err.message)
      }
    }
  },
  updateArMedia: async (mediaItem, files, id) => {
    const dispatch = useDispatch()
    {
      try {
        const result = await ArMediaService.uploadFile(files)
        const newItem = await client.service('ar-media').patch(id, {
          ...mediaItem,
          ...result
        })
        dispatch(ArMediaAction.updateAdminArMedia(newItem))
      } catch (error) {
        console.error(error)
        AlertService.dispatchAlertError(error.message)
      }
    }
  },
  removeArMedia: async (mediaItemId: string) => {
    const dispatch = useDispatch()
    {
      try {
        await client.service('ar-media').remove(mediaItemId)
        dispatch(ArMediaAction.removeArMediaItem(mediaItemId))
      } catch (err) {
        console.log(err)
        AlertService.dispatchAlertError(err.message)
      }
    }
  }
}

//Action
export const ArMediaAction = {
  setAdminArMedia: (list: ArMediaResult[]) => {
    return {
      type: 'ARMEDIA_ADMIN_RETRIEVED' as const,
      list
    }
  },
  setArMedia: (list: ArMedia[]) => {
    return {
      type: 'ARMEDIA_RETRIEVED' as const,
      list
    }
  },
  fetchingArMedia: () => {
    return {
      type: 'ARMEDIA_FETCHING' as const
    }
  },
  addAdminArMedia: (item: ArMedia) => {
    return {
      type: 'ADD_ARMEDIA' as const,
      item
    }
  },
  removeArMediaItem: (id: string) => {
    return {
      type: 'REMOVE_ARMEDIA' as const,
      id
    }
  },
  fetchingArMediaItem: (id: string) => {
    return {
      type: 'ARMEDIA_FETCHING_ITEM' as const,
      id
    }
  },
  retrievedArMediaItem: (item: ArMedia) => {
    return {
      type: 'ARMEDIA_RETRIEVED_ITEM' as const,
      item
    }
  },
  updateAdminArMedia: (result: ArMedia) => {
    return {
      type: 'UPDATE_AR_MEDIA' as const,
      item: result
    }
  }
}

export type ArMediaActionType = ReturnType<typeof ArMediaAction[keyof typeof ArMediaAction]>
