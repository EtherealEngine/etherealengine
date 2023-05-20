import { AdminBot, BotCommands } from '@etherealengine/common/src/interfaces/AdminBot'

import { Application } from '../../../declarations'

export const createBotCommands = async (app: Application, bot: AdminBot, commands: BotCommands[]) => {
  const botId = bot.id
  for (let element of commands) {
    await app.service('bot-command').create({
      name: element.name,
      description: element.description,
      botId: botId
    })
  }
  return commands
}
