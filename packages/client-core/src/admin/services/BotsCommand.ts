import { BotCommands, CreateBotCammand } from '@etherealengine/common/src/interfaces/AdminBot'
import multiLogger from '@etherealengine/common/src/logger'
import { matches, Validator } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getMutableState } from '@etherealengine/hyperflux'

import { API } from '../../API'

const logger = multiLogger.child({ component: 'client-core:BotsCommand' })
//State
export const BOTS_PAGE_LIMIT = 100

export const AdminBotsCommandState = defineState({
  name: 'AdminBotsCommandState',
  initial: () => ({
    botCommand: [] as BotCommands[],
    skip: 0,
    limit: BOTS_PAGE_LIMIT,
    total: 0,
    retrieving: false,
    fetched: false,
    updateNeeded: true,
    lastFetched: Date.now()
  })
})

const botCommandCreatedReceptor = (action: typeof AdminBotCommandActions.botCommandCreated.matches._TYPE) => {
  const state = getMutableState(AdminBotsCommandState)
  return state.merge({ updateNeeded: true })
}
const botCommandRemovedReceptor = (action: typeof AdminBotCommandActions.botCommandRemoved.matches._TYPE) => {
  const state = getMutableState(AdminBotsCommandState)
  return state.merge({ updateNeeded: true })
}

export const AdminBotsCommandReceptors = {
  botCommandCreatedReceptor,
  botCommandRemovedReceptor
}

//Service
export const AdminBotCommandService = {
  createBotCommand: async (data: CreateBotCammand) => {
    try {
      const botCommand = (await API.instance.client.service('bot-command').create(data)) as BotCommands
      dispatchAction(AdminBotCommandActions.botCommandCreated({ botCommand }))
    } catch (error) {
      logger.error(error)
    }
  },
  removeBotsCommand: async (id: string) => {
    try {
      const result = (await API.instance.client.service('bot-command').remove(id)) as BotCommands
      dispatchAction(AdminBotCommandActions.botCommandRemoved({ botCommand: result }))
    } catch (error) {
      logger.error(error)
    }
  }
}

//Action

export class AdminBotCommandActions {
  static botCommandCreated = defineAction({
    type: 'ee.client.AdminBotCommand.BOT_COMMAND_ADMIN_CREATE' as const,
    botCommand: matches.object as Validator<unknown, BotCommands>
  })
  static botCommandRemoved = defineAction({
    type: 'ee.client.AdminBotCommand.BOT_COMMAND_ADMIN_REMOVE' as const,
    botCommand: matches.object as Validator<unknown, BotCommands>
  })
}
