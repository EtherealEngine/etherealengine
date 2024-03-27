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

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, virtual } from '@feathersjs/schema'
import { v4 as uuidv4 } from 'uuid'

import { BotQuery, BotType } from '@etherealengine/common/src/schemas/bot/bot.schema'
import { locationPath } from '@etherealengine/common/src/schemas/social/location.schema'

import {
  BotCommandData,
  BotCommandType,
  botCommandPath
} from '@etherealengine/common/src/schemas/bot/bot-command.schema'
import { InstanceID, InstanceType, instancePath } from '@etherealengine/common/src/schemas/networking/instance.schema'
import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import type { HookContext } from '@etherealengine/server-core/declarations'
import { botCommandDataResolver } from '../bot-command/bot-command.resolvers'

export const botResolver = resolve<BotType, HookContext>({})

export const botExternalResolver = resolve<BotType, HookContext>({
  location: virtual(async (bot, context) => {
    if (context.event !== 'removed' && bot.locationId)
      return await context.app.service(locationPath).get(bot.locationId)
  }),
  instance: virtual(async (bot, context) => {
    if (context.event !== 'removed' && bot.instanceId)
      return (await context.app.service(instancePath).get(bot.instanceId)) as any as InstanceType
  }),
  botCommands: virtual(async (bot, context) => {
    if (context.event !== 'removed' && bot.id)
      return (await context.app.service(botCommandPath).find({
        query: {
          botId: bot.id
        },
        paginate: false
      })) as BotCommandType[]
  }),
  createdAt: virtual(async (bot) => fromDateTimeSql(bot.createdAt)),
  updatedAt: virtual(async (bot) => fromDateTimeSql(bot.updatedAt))
})

export const botDataResolver = resolve<BotType, HookContext>({
  id: async () => {
    return uuidv4()
  },
  instanceId: async (instanceId) => {
    return instanceId ?? ('' as InstanceID)
  },
  botCommands: async (value, bot, context) => {
    const botCommands: BotCommandData[] = []
    for (const element of bot.botCommands) {
      const resolvedElement = await botCommandDataResolver.resolve(element, context)
      botCommands.push(resolvedElement)
    }
    return botCommands
  },
  createdAt: getDateTimeSql,
  updatedAt: getDateTimeSql
})

export const botPatchResolver = resolve<BotType, HookContext>({
  updatedAt: getDateTimeSql
})

export const botQueryResolver = resolve<BotQuery, HookContext>({})
