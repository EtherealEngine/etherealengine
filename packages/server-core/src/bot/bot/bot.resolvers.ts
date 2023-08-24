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
import { v4 } from 'uuid'

import { BotQuery, BotType } from '@etherealengine/engine/src/schemas/bot/bot.schema'
import { locationPath } from '@etherealengine/engine/src/schemas/social/location.schema'

import { BotCommandType, botCommandPath } from '@etherealengine/engine/src/schemas/bot/bot-command.schema'
import { InstanceType, instancePath } from '@etherealengine/engine/src/schemas/networking/instance.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'
import { getDateTimeSql } from '../../util/get-datetime-sql'

export const botResolver = resolve<BotType, HookContext>({})

export const botExternalResolver = resolve<BotType, HookContext>({
  location: virtual(async (bot, context) => {
    if (bot.locationId) {
      const location = await context.app.service(locationPath)._get(bot.locationId)
      return location
    }
  }),
  instance: virtual(async (bot, context) => {
    if (bot.instanceId) {
      const instance = (await context.app.service(instancePath)._get(bot.instanceId)) as any as InstanceType
      return instance
    }
  }),
  botCommands: virtual(async (bot, context) => {
    if (bot.id) {
      const botCommands = (await context.app.service(botCommandPath)._find({
        query: {
          botId: bot.id
        }
      })) as any as BotCommandType[]
      return botCommands
    }
  })
})

export const botDataResolver = resolve<BotType, HookContext>({
  id: async () => {
    return v4()
  },
  createdAt: getDateTimeSql,
  updatedAt: getDateTimeSql
})

export const botPatchResolver = resolve<BotType, HookContext>({
  updatedAt: getDateTimeSql
})

export const botQueryResolver = resolve<BotQuery, HookContext>({})
