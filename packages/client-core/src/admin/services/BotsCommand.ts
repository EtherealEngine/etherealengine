import { BotCommands, CreateBotCammand } from '@xrengine/common/src/interfaces/AdminBot'
import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'

import { client } from '../../feathers'

//State
export const BOTS_PAGE_LIMIT = 100

const AdminBotsCommandState = defineState({
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

export const AdminBotsCommandServiceReceptor = (action) => {
  getState(AdminBotsCommandState).batch((s) => {
    matches(action)
      .when(BotsCommandAction.botCammandCreated.matches, (action) => {
        return s.merge({ updateNeeded: true })
      })
      .when(BotsCommandAction.botCommandRemoved.matches, (action) => {
        return s.merge({ updateNeeded: true })
      })
  })
}

export const accessBotCommandState = () => getState(AdminBotsCommandState)

export const useBotCommandState = () => useState(accessBotCommandState())

//Service
export const BotCommandService = {
  createBotCammand: async (data: CreateBotCammand) => {
    try {
      const botCommand = (await client.service('bot-command').create(data)) as BotCommands
      dispatchAction(BotsCommandAction.botCammandCreated({ botCommand }))
    } catch (error) {
      console.error(error)
    }
  },
  removeBotsCommand: async (id: string) => {
    try {
      const result = (await client.service('bot-command').remove(id)) as BotCommands
      dispatchAction(BotsCommandAction.botCommandRemoved({ botCommand: result }))
    } catch (error) {
      console.error(error)
    }
  }
}
//Action
export class BotsCommandAction {
  static botCammandCreated = defineAction({
    type: 'BOT_COMMAND_ADMIN_CREATE' as const,
    botCommand: matches.object as Validator<unknown, BotCommands>
  })
  static botCommandRemoved = defineAction({
    type: 'BOT_COMMAND_ADMIN_REMOVE' as const,
    botCommand: matches.object as Validator<unknown, BotCommands>
  })
}
