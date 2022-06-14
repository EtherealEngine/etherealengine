import { AvatarInterface } from '@xrengine/common/src/interfaces/AvatarInterface'
import { AvatarResult } from '@xrengine/common/src/interfaces/AvatarResult'
import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'

import { client } from '../../feathers'

//State
export const AVATAR_PAGE_LIMIT = 100

const AdminAvatarState = defineState({
  name: 'AdminAvatarState',
  initial: () => ({
    avatars: [] as Array<AvatarInterface>,
    skip: 0,
    limit: AVATAR_PAGE_LIMIT,
    total: 0,
    retrieving: false,
    fetched: false,
    updateNeeded: true,
    lastFetched: Date.now()
  })
})

export const AdminAvatarServiceReceptor = (action) => {
  getState(AdminAvatarState).batch((s) => {
    matches(action)
      .when(AvatarAction.avatarsFetched.matches, (action) => {
        return s.merge({
          avatars: action.avatars.data,
          skip: action.avatars.skip,
          limit: action.avatars.limit,
          total: action.avatars.total,
          retrieving: false,
          fetched: true,
          updateNeeded: false,
          lastFetched: Date.now()
        })
      })
      .when(AvatarAction.avatarCreated.matches, (action) => {
        return s.merge({ updateNeeded: true })
      })
      .when(AvatarAction.avatarRemoved.matches, (action) => {
        return s.merge({ updateNeeded: true })
      })
      .when(AvatarAction.avatarUpdated.matches, (action) => {
        return s.merge({ updateNeeded: true })
      })
  })
}

export const accessAvatarState = () => getState(AdminAvatarState)

export const useAvatarState = () => useState(accessAvatarState())

//Service
export const AvatarService = {
  fetchAdminAvatars: async (skip = 0, search: string | null = null, sortField = 'name', orderBy = 'asc') => {
    let sortData = {}
    if (sortField.length > 0) {
      sortData[sortField] = orderBy === 'desc' ? 0 : 1
    }
    const adminAvatarState = accessAvatarState()
    const limit = adminAvatarState.limit.value
    const avatars = await client.service('static-resource').find({
      query: {
        $sort: {
          ...sortData
        },
        $select: ['id', 'sid', 'key', 'name', 'url', 'staticResourceType', 'userId'],
        staticResourceType: 'avatar',
        userId: null,
        $limit: limit,
        $skip: skip * AVATAR_PAGE_LIMIT,
        getAvatarThumbnails: true,
        search: search
      }
    })
    dispatchAction(AvatarAction.avatarsFetched({ avatars }))
  },
  removeAdminAvatar: async (id: string, name: string) => {
    try {
      await client.service('static-resource').remove(id)
      const avatarThumbnail = await client.service('static-resource').find({
        query: {
          name: name,
          staticResourceType: 'user-thumbnail',
          $limit: 1
        }
      })
      avatarThumbnail?.data?.length > 0 &&
        (await client.service('static-resource').remove(avatarThumbnail?.data[0]?.id))
      dispatchAction(AvatarAction.avatarRemoved())
    } catch (err) {
      console.error(err)
    }
  }
}

//Action
export class AvatarAction {
  static avatarsFetched = defineAction({
    type: 'AVATARS_RETRIEVED' as const,
    avatars: matches.object as Validator<unknown, AvatarResult>
  })

  static avatarCreated = defineAction({
    type: 'AVATAR_CREATED' as const
  })

  static avatarRemoved = defineAction({
    type: 'AVATAR_REMOVED' as const
  })

  static avatarUpdated = defineAction({
    type: 'AVATAR_UPDATED' as const
  })
}
