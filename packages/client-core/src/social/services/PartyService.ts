import { Paginated } from '@feathersjs/feathers'
// TODO: Reenable me! But decoupled so we don't need to import this lib
// import { endVideoChat } from '@xrengine/client-networking/src/transports/SocketWebRTCClientFunctions';
import { createState, useState } from '@speigg/hookstate'
import i18n from 'i18next'
import _ from 'lodash'

import { Channel } from '@xrengine/common/src/interfaces/Channel'
import { Party } from '@xrengine/common/src/interfaces/Party'
import { PartyUser } from '@xrengine/common/src/interfaces/PartyUser'
import { User } from '@xrengine/common/src/interfaces/User'
import multiLogger from '@xrengine/common/src/logger'
import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import {
  addActionReceptor,
  defineAction,
  defineState,
  dispatchAction,
  getState,
  registerState
} from '@xrengine/hyperflux'

import { NotificationService } from '../../common/services/NotificationService'
import { client } from '../../feathers'
import { store, useDispatch } from '../../store'
import { accessAuthState } from '../../user/services/AuthService'
import { UserAction } from '../../user/services/UserService'
import { ChatService } from './ChatService'

const logger = multiLogger.child({ component: 'client-core:social' })

// State
const PartyState = defineState({
  name: 'PartyState',
  initial: () => ({
    party: {} as Party,
    updateNeeded: true
  })
})

export const registerPartyServiceactions = () => {
  registerState(PartyState)

  addActionReceptor(function PartyServiceReceptor(action) {
    getState(PartyState).batch((s) => {
      let newValues, updateMap, partyUser, updateMapPartyUsers
      matches(action)
        .when(PartyAction.loadedPartyAction.matches, (action) => {
          return s.merge({ party: action.party, updateNeeded: false })
        })
        .when(PartyAction.createdPartyAction.matches, () => {
          return s.updateNeeded.set(true)
        })
        .when(PartyAction.removedPartyAction.matches, () => {
          return s.merge({ party: {}, updateNeeded: true })
        })
        .when(PartyAction.invitedPartyUserAction.matches, () => {
          return s.updateNeeded.set(true)
        })
        .when(PartyAction.createdPartyUserAction.matches, (action) => {
          newValues = action
          partyUser = newValues.partyUser
          updateMap = _.cloneDeep(s.party.value)
          if (updateMap != null) {
            updateMapPartyUsers = updateMap.partyUsers
            updateMapPartyUsers = Array.isArray(updateMapPartyUsers)
              ? updateMapPartyUsers.find((pUser) => {
                  return pUser != null && pUser.id === partyUser.id
                }) == null
                ? updateMapPartyUsers.concat([partyUser])
                : updateMap.partyUsers.map((pUser) => {
                    return pUser != null && pUser.id === partyUser.id ? partyUser : pUser
                  })
              : [partyUser]
            updateMap.partyUsers = updateMapPartyUsers
          }
          return s.merge({ party: updateMap, updateNeeded: true })
        })
        .when(PartyAction.patchedPartyUserAction.matches, (action) => {
          newValues = action
          partyUser = newValues.partyUser
          logger.info({ partyUser }, 'Patched partyUser.')
          updateMap = _.cloneDeep(s.party.value)
          if (updateMap != null) {
            updateMapPartyUsers = updateMap.partyUsers
            updateMapPartyUsers = Array.isArray(updateMapPartyUsers)
              ? updateMapPartyUsers.find((pUser) => {
                  return pUser != null && pUser.id === partyUser.id
                }) == null
                ? updateMapPartyUsers.concat([partyUser])
                : updateMap.partyUsers.map((pUser) => {
                    return pUser != null && pUser.id === partyUser.id ? partyUser : pUser
                  })
              : [partyUser]
            updateMap.partyUsers = updateMapPartyUsers
          }
          return s.party.set(updateMap)
        })
        .when(PartyAction.removedPartyUserAction.matches, (action) => {
          newValues = action
          partyUser = newValues.partyUser
          updateMap = _.cloneDeep(s.party.value)
          if (updateMap != null) {
            updateMapPartyUsers = updateMap.partyUsers
            _.remove(updateMapPartyUsers, (pUser: PartyUser) => {
              return pUser != null && partyUser.id === pUser.id
            })
          }
          s.party.set(updateMap)
          return s.updateNeeded.set(true)
        })
    })
  })
}

registerPartyServiceactions()

export const accessPartyState = () => getState(PartyState)

export const usePartyState = () => useState(accessPartyState())

//Service
export const PartyService = {
  getParty: async () => {
    const dispatch = useDispatch()
    try {
      // console.log('CALLING GETPARTY()');
      const partyResult = (await client.service('party').get('')) as Party
      dispatchAction(PartyAction.loadedPartyAction({ party: partyResult }))
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  // Temporary Method for arbitrary testing
  getParties: async (): Promise<void> => {
    let socketId: any
    const parties = await client.service('party').find()
    const userId = accessAuthState().user.id.value
    if (client.io && socketId === undefined) {
      client.io.emit('request-user-id', ({ id }: { id: number }) => {
        logger.info('Socket-ID received: ' + id)
        socketId = id
      })
      client.io.on('message-party', (data: any) => {
        logger.info({ data }, 'Message received.')
      })
      ;(window as any).joinParty = (userId: number, partyId: number) => {
        client.io.emit(
          'join-party',
          {
            userId,
            partyId
          },
          (res) => {
            logger.info({ res }, 'Join response.')
          }
        )
      }
      ;(window as any).messageParty = (userId: number, partyId: number, message: string) => {
        client.io.emit('message-party-request', {
          userId,
          partyId,
          message
        })
      }
      ;(window as any).partyInit = (userId: number) => {
        client.io.emit('party-init', { userId }, (response: any) => {
          response ? logger.info({ response }, 'Init success.') : logger.info('Init failed.')
        })
      }
    } else {
      logger.info('Your socket id is: ' + socketId)
    }
  },
  createParty: async () => {
    logger.info('CREATING PARTY')
    try {
      await client.service('party').create({})
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  removeParty: async (partyId: string) => {
    const dispatch = useDispatch()

    try {
      const channelResult = (await client.service('channel').find({
        query: {
          channelType: 'party',
          partyId: partyId
        }
      })) as Paginated<Channel>
      if (channelResult.total > 0) {
        await client.service('channel').remove(channelResult.data[0].id)
      }
      const party = (await client.service('party').remove(partyId)) as Party
      dispatchAction(PartyAction.removedPartyAction({ party }))
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  inviteToParty: async (partyId: string, userId: string) => {
    try {
      const result = await client.service('party-user').create({
        partyId,
        userId
      })
      NotificationService.dispatchNotify(i18n.t('social:partyInvitationSent'), { variant: 'success' })
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  removePartyUser: async (partyUserId: string) => {
    try {
      await client.service('party-user').remove(partyUserId)
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  transferPartyOwner: async (partyUserId: string) => {
    try {
      await client.service('party-user').patch(partyUserId, {
        isOwner: true
      })
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  }
}

if (globalThis.process.env['VITE_OFFLINE_MODE'] !== 'true') {
  client.service('party-user').on('created', async (params) => {
    const selfUser = accessAuthState().user
    if (accessPartyState().party == null) {
      dispatchAction(PartyAction.createdPartyAction({ party: params }))
    }
    dispatchAction(PartyAction.createdPartyUserAction({ partyUser: params.partyUser }))
    if (params.partyUser.userId === selfUser.id.value) {
      const party = await client.service('party').get(params.partyUser.partyId)
      const userId = selfUser.id.value ?? ''
      const dbUser = (await client.service('user').get(userId)) as User
      if (party.instanceId != null && party.instanceId !== dbUser.instanceId) {
        const updateUser: PartyUser = {
          ...params.partyUser,
          user: dbUser
        }
        updateUser.partyId = party.id
        dispatchAction(PartyAction.patchedPartyUserAction({ partyUser: updateUser }))
        // TODO: Reenable me!
        // await provisionServer(instance.locationId, instance.id)(store.dispatch, store.getState);
      }
    }
  })

  client.service('party-user').on('patched', (params) => {
    const updatedPartyUser = params.partyUser
    const selfUser = accessAuthState().user
    dispatchAction(PartyAction.patchedPartyUserAction({ partyUser: updatedPartyUser }))
    if (
      updatedPartyUser.user.channelInstanceId != null &&
      updatedPartyUser.user.channelInstanceId === selfUser.channelInstanceId.value
    )
      dispatchAction(UserAction.addedChannelLayerUserAction({ user: updatedPartyUser.user }))
    if (updatedPartyUser.user.channelInstanceId !== selfUser.channelInstanceId.value)
      dispatchAction(UserAction.removedChannelLayerUserAction({ user: updatedPartyUser.user }))
  })

  client.service('party-user').on('removed', (params) => {
    const deletedPartyUser = params.partyUser
    const selfUser = accessAuthState().user
    dispatchAction(PartyAction.removedPartyUserAction({ partyUser: deletedPartyUser }))
    dispatchAction(UserAction.removedChannelLayerUserAction({ user: deletedPartyUser.user }))
    if (params.partyUser.userId === selfUser.id) {
      ChatService.clearChatTargetIfCurrent('party', { id: params.partyUser.partyId })
      // TODO: Reenable me!
      // endVideoChat({ leftParty: true });
    }
  })

  client.service('party').on('created', (params) => {
    dispatchAction(PartyAction.createdPartyAction({ party: params.party }))
  })

  client.service('party').on('patched', (params) => {
    dispatchAction(PartyAction.patchedPartyAction({ party: params.party }))
    ChatService.clearChatTargetIfCurrent('party', params.party)
  })

  client.service('party').on('removed', (params) => {
    dispatchAction(PartyAction.removedPartyAction({ party: params.party }))
  })
}

//Action

export class PartyAction {
  static loadedPartyAction = defineAction({
    store: 'ENGINE',
    type: 'LOADED_PARTY' as const,
    party: matches.object as Validator<unknown, Party>
  })

  static createdPartyAction = defineAction({
    store: 'ENGINE',
    type: 'CREATED_PARTY' as const,
    party: matches.object as Validator<unknown, Party>
  })

  static patchedPartyAction = defineAction({
    store: 'ENGINE',
    type: 'PATCHED_PARTY' as const,
    party: matches.object as Validator<unknown, Party>
  })

  static removedPartyAction = defineAction({
    store: 'ENGINE',
    type: 'REMOVED_PARTY' as const,
    party: matches.object as Validator<unknown, Party>
  })

  static invitedPartyUserAction = defineAction({
    store: 'ENGINE',
    type: 'INVITED_PARTY_USER' as const
  })

  static leftPartyAction = defineAction({
    store: 'ENGINE',
    type: 'LEFT_PARTY' as const
  })

  static createdPartyUserAction = defineAction({
    store: 'ENGINE',
    type: 'CREATED_PARTY_USER' as const,
    partyUser: matches.object as Validator<unknown, PartyUser>
  })

  static patchedPartyUserAction = defineAction({
    store: 'ENGINE',
    type: 'PATCHED_PARTY_USER' as const,
    partyUser: matches.object as Validator<unknown, PartyUser>
  })

  static removedPartyUserAction = defineAction({
    store: 'ENGINE',
    type: 'REMOVED_PARTY_USER' as const,
    partyUser: matches.object as Validator<unknown, PartyUser>
  })
}
