import { Paginated } from '@feathersjs/feathers'
import { none } from '@speigg/hookstate'
import _ from 'lodash'

import { User } from '@xrengine/common/src/interfaces/User'
import { UserRelationship } from '@xrengine/common/src/interfaces/UserRelationship'
import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { addActionReceptor, defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'

import { NotificationService } from '../../common/services/NotificationService'
import { client } from '../../feathers'
import { store } from '../../store'
import { accessAuthState } from '../../user/services/AuthService'
import { UserAction } from '../../user/services/UserService'

//State
const FriendState = defineState({
  name: 'FriendState',
  initial: () => ({
    friends: {
      friends: [] as Array<User>,
      total: 0,
      limit: 5,
      skip: 0
    },
    getFriendsInProgress: false,
    updateNeeded: true
  })
})

export const FriendServiceReceptor = (action) => {
  getState(FriendState).batch((s) => {
    matches(action)
      .when(FriendAction.loadedFriendsAction.matches, (action) => {
        let newValues
        newValues = action
        if (s.updateNeeded.value === true) {
          s.friends.friends.set(newValues.friends.data)
        } else {
          s.friends.friends.set([s.friends.friends.value, newValues.friends.data])
        }
        s.friends.skip.set(newValues.friends.skip)
        s.friends.limit.set(newValues.friends.limit)
        s.friends.total.set(newValues.friends.total)
        s.updateNeeded.set(false)
        return s.getFriendsInProgress.set(false)
      })
      .when(FriendAction.createdFriendAction.matches, (action) => {
        let newValues
        newValues = action
        const createdUserRelationship = newValues.userRelationship
        return s.friends.friends.set([...s.friends.friends.value, createdUserRelationship])
      })
      .when(FriendAction.patchedFriendAction.matches, (action) => {
        let newValues, selfUser, otherUser
        newValues = action
        const patchedUserRelationship = newValues.userRelationship
        selfUser = newValues.selfUser
        otherUser =
          patchedUserRelationship.userId === selfUser.id
            ? patchedUserRelationship.relatedUser
            : patchedUserRelationship.user

        const patchedFriendIndex = s.friends.friends.value.findIndex((friendItem) => {
          return friendItem != null && friendItem.id === otherUser.id
        })
        if (patchedFriendIndex === -1) {
          return s.friends.friends.set([...s.friends.friends.value, otherUser])
        } else {
          return s.friends.friends[patchedFriendIndex].set(otherUser)
        }
      })
      .when(FriendAction.removedFriendAction.matches, (action) => {
        let newValues, selfUser, otherUserId
        newValues = action
        const removedUserRelationship = newValues.userRelationship
        selfUser = newValues.selfUser
        otherUserId =
          removedUserRelationship.userId === selfUser.id
            ? removedUserRelationship.relatedUserId
            : removedUserRelationship.userId

        const friendId = s.friends.friends.value.findIndex((friendItem) => {
          return friendItem != null && friendItem.id === otherUserId
        })

        return s.friends.friends[friendId].set(none)
      })
      .when(FriendAction.fetchingFriendsAction.matches, () => {
        return s.getFriendsInProgress.set(true)
      })
  })
}

addActionReceptor(FriendServiceReceptor)

export const accessFriendState = () => getState(FriendState)

export const useFriendState = () => useState(accessFriendState())

//Service
export const FriendService = {
  // export function getUserRelationshipasync (userId: string) {
  //; {
  //     // dispatch(actionProcessing(true))
  //
  //     console.log('------get relations-------', userId)
  //     client.service('user-relationship').find({
  //       query: {
  //         userId
  //       }
  //     }).then((res: any) => {
  //       console.log('relations------', res)
  //       dispatch(loadedUserRelationship(res as Relationship))
  //     })
  //       .catch((err: any) => {
  //         console.log(err)
  //       })
  //       // .finally(() => dispatch(actionProcessing(false)))
  //   }
  // }

  getFriends: async (skip: number = 0, limit: number = 10) => {
    dispatchAction(FriendAction.fetchingFriendsAction())
    try {
      const friendState = accessFriendState()
      const friendResult = (await client.service('user').find({
        query: {
          action: 'friends',
          $limit: limit != null ? limit : friendState.friends.limit.value,
          $skip: skip != null ? skip : friendState.friends.skip.value
        }
      })) as Paginated<User>
      dispatchAction(FriendAction.loadedFriendsAction({ friends: friendResult }))
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
      dispatchAction(FriendAction.loadedFriendsAction({ friends: { data: [], limit: 0, skip: 0, total: 0 } }))
    }
  },

  // function createRelationasync (userId: string, relatedUserId: string, type: 'friend' | 'blocking') {
  //; {
  //     client.service('user-relationship').create({
  //       relatedUserId,
  //       userRelationshipType: type
  //     }).then((res: any) => {
  //       console.log('add relations------', res)
  //       dispatch(changedRelation())
  //     })
  //       .catch((err: any) => {
  //         console.log(err)
  //       })
  //       // .finally(() => dispatch(actionProcessing(false)))
  //   }
  // }
  //
  removeFriend: async (relatedUserId: string) => {
    try {
      await client.service('user-relationship').remove(relatedUserId)
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  //
  // function patchRelationasync (userId: string, relatedUserId: string, type: 'friend') {
  //; {
  //     client.service('user-relationship').patch(relatedUserId, {
  //       userRelationshipType: type
  //     }).then((res: any) => {
  //       console.log('Patching relationship to friend', res)
  //       dispatch(changedRelation())
  //     })
  //       .catch((err: any) => {
  //         console.log(err)
  //       })
  //       // .finally(() => dispatch(actionProcessing(false)))
  //   }
  // }

  // export function requestFriend(userId: string, relatedUserId: string) {
  //   return createRelation(userId, relatedUserId, 'friend')
  // }
  //
  // export function blockUser(userId: string, relatedUserId: string) {
  //   return createRelation(userId, relatedUserId, 'blocking')
  // }
  //
  // export function acceptFriend(userId: string, relatedUserId: string) {
  //   return patchRelation(userId, relatedUserId, 'friend')
  // }
  //
  // export function declineFriend(userId: string, relatedUserId: string) {
  //   return removeRelation(userId, relatedUserId)
  // }
  //
  // export function cancelBlock(userId: string, relatedUserId: string) {
  //   return removeRelation(userId, relatedUserId)
  // }

  unfriend: (relatedUserId: string) => {
    return FriendService.removeFriend(relatedUserId)
  }
}
if (globalThis.process.env['VITE_OFFLINE_MODE'] !== 'true') {
  client.service('user-relationship').on('created', (params) => {
    if (params.userRelationship.userRelationshipType === 'friend') {
      dispatchAction(FriendAction.createdFriendAction({ userRelationship: params.userRelationship }))
    }
  })

  client.service('user-relationship').on('patched', (params) => {
    const patchedUserRelationship = params.userRelationship
    const selfUser = accessAuthState().user
    if (patchedUserRelationship.userRelationshipType === 'friend') {
      dispatchAction(
        FriendAction.patchedFriendAction({ userRelationship: patchedUserRelationship, selfUser: selfUser.value })
      )
      if (
        patchedUserRelationship.user.channelInstanceId != null &&
        patchedUserRelationship.user.channelInstanceId === selfUser.channelInstanceId.value
      )
        store.dispatch(UserAction.addedChannelLayerUser(patchedUserRelationship.user))
      if (patchedUserRelationship.user.channelInstanceId !== selfUser.channelInstanceId.value)
        store.dispatch(UserAction.removedChannelLayerUser(patchedUserRelationship.user))
    }
  })

  client.service('user-relationship').on('removed', (params) => {
    const deletedUserRelationship = params.userRelationship
    const selfUser = accessAuthState().user
    if (deletedUserRelationship.userRelationshipType === 'friend') {
      dispatchAction(
        FriendAction.removedFriendAction({ userRelationship: deletedUserRelationship, selfUser: selfUser.value })
      )
      if (
        deletedUserRelationship.user.channelInstanceId != null &&
        deletedUserRelationship.user.channelInstanceId === selfUser.channelInstanceId.value
      )
        store.dispatch(UserAction.addedChannelLayerUser(deletedUserRelationship.user))
      if (deletedUserRelationship.user.channelInstanceId !== selfUser.channelInstanceId.value)
        store.dispatch(UserAction.removedChannelLayerUser(deletedUserRelationship.user))
    }
  })
}

//Action
export class FriendAction {
  static loadedFriendsAction = defineAction({
    type: 'LOADED_FRIENDS' as const,
    friends: matches.any as Validator<unknown, Paginated<User>>
  })

  static createdFriendAction = defineAction({
    type: 'CREATED_FRIEND' as const,
    userRelationship: matches.object as Validator<unknown, UserRelationship>
  })

  static patchedFriendAction = defineAction({
    type: 'PATCHED_FRIEND' as const,
    userRelationship: matches.object as Validator<unknown, UserRelationship>,
    selfUser: matches.object as Validator<unknown, User>
  })

  static removedFriendAction = defineAction({
    type: 'REMOVED_FRIEND' as const,
    userRelationship: matches.object as Validator<unknown, UserRelationship>,
    selfUser: matches.object as Validator<unknown, User>
  })

  static fetchingFriendsAction = defineAction({
    type: 'FETCHING_FRIENDS' as const
  })
}
