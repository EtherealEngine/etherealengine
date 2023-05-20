import { Paginated } from '@feathersjs/feathers'

import { AdminBot, CreateBotAsAdmin } from '@etherealengine/common/src/interfaces/AdminBot'
import multiLogger from '@etherealengine/common/src/logger'
import { matches, Validator } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getMutableState } from '@etherealengine/hyperflux'

import { API } from '../../API'
import { AuthState } from '../../user/services/AuthService'

const logger = multiLogger.child({ component: 'client-core:BotsService' })

//State
export const BOTS_PAGE_LIMIT = 100

export const AdminBotState = defineState({
  name: 'AdminBotState',
  initial: () => ({
    bots: [] as Array<AdminBot>,
    skip: 0,
    limit: BOTS_PAGE_LIMIT,
    total: 0,
    retrieving: false,
    fetched: false,
    updateNeeded: true,
    lastFetched: Date.now()
  })
})

const fetchedBotReceptor = (action: typeof AdminBotsActions.fetchedBot.matches._TYPE) => {
  const state = getMutableState(AdminBotState)
  return state.merge({
    bots: action.bots.data,
    retrieving: false,
    fetched: true,
    updateNeeded: false,
    lastFetched: Date.now()
  })
}

const botCreatedReceptor = (action: typeof AdminBotsActions.botCreated.matches._TYPE) => {
  const state = getMutableState(AdminBotState)
  return state.merge({ updateNeeded: true })
}

const botPatchedReceptor = (action: typeof AdminBotsActions.botPatched.matches._TYPE) => {
  const state = getMutableState(AdminBotState)
  return state.merge({ updateNeeded: true })
}

const botRemovedReceptor = (action: typeof AdminBotsActions.botRemoved.matches._TYPE) => {
  const state = getMutableState(AdminBotState)
  return state.merge({ updateNeeded: true })
}

export const AdminBotServiceReceptors = {
  fetchedBotReceptor,
  botCreatedReceptor,
  botPatchedReceptor,
  botRemovedReceptor
}

//Service
export const AdminBotService = {
  createBotAsAdmin: async (data: CreateBotAsAdmin) => {
    try {
      console.log(`bot service creating bot ${data.name}`)
      const bot = await API.instance.client.service('bot').create(data)
      dispatchAction(AdminBotsActions.botCreated({ bot }))
    } catch (error) {
      logger.error(error)
    }
  },
  fetchBotAsAdmin: async (incDec?: 'increment' | 'decrement') => {
    try {
      const user = getMutableState(AuthState).user
      const skip = getMutableState(AdminBotState).skip.value
      const limit = getMutableState(AdminBotState).limit.value
      if (user.scopes?.value?.find((scope) => scope.type === 'admin:admin')) {
        const bots = (await API.instance.client.service('bot').find({
          query: {
            $sort: {
              name: 1
            },
            $skip: incDec === 'increment' ? skip + limit : incDec === 'decrement' ? skip - limit : skip,
            $limit: limit,
            action: 'admin'
          }
        })) as Paginated<AdminBot>
        dispatchAction(AdminBotsActions.fetchedBot({ bots }))
      }
    } catch (error) {
      logger.error(error)
    }
  },
  removeBots: async (id: string) => {
    try {
      console.log(`bot service removing bot ${id}`)
      const bot = (await API.instance.client.service('bot').remove(id)) as AdminBot
      dispatchAction(AdminBotsActions.botRemoved({ bot }))
    } catch (error) {
      logger.error(error)
    }
  },
  updateBotAsAdmin: async (id: string, bot: CreateBotAsAdmin) => {
    try {
      const result = (await API.instance.client.service('bot').patch(id, bot)) as AdminBot
      dispatchAction(AdminBotsActions.botPatched({ bot: result }))
    } catch (error) {
      logger.error(error)
    }
  }
}
//Action
export class AdminBotsActions {
  static fetchedBot = defineAction({
    type: 'ee.client.AdminBots.BOT_ADMIN_DISPLAY' as const,
    bots: matches.object as Validator<unknown, Paginated<AdminBot>>
  })
  static botCreated = defineAction({
    type: 'ee.client.AdminBots.BOT_ADMIN_CREATE' as const,
    bot: matches.object as Validator<unknown, AdminBot>
  })
  static botRemoved = defineAction({
    type: 'ee.client.AdminBots.BOT_ADMIN_REMOVE' as const,
    bot: matches.object as Validator<unknown, AdminBot>
  })
  static botPatched = defineAction({
    type: 'ee.client.AdminBots.BOT_ADMIN_UPDATE' as const,
    bot: matches.object as Validator<unknown, AdminBot>
  })
}
