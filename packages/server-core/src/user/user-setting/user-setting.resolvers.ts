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

import {
  UserSettingDatabaseType,
  UserSettingID,
  UserSettingQuery,
  UserSettingType
} from '@etherealengine/common/src/schemas/user/user-setting.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export const userDbToSchema = (rawData: UserSettingDatabaseType): UserSettingType => {
  let themeModes
  if (typeof rawData.themeModes !== 'object') themeModes = JSON.parse(rawData.themeModes) as Record<string, string>

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof themeModes === 'string') {
    themeModes = JSON.parse(themeModes)

    // There are some old records in our database that requires further parsing.
    if (typeof themeModes === 'string') {
      themeModes = JSON.parse(themeModes)
    }
  }

  return {
    ...rawData,
    themeModes
  }
}

export const userSettingResolver = resolve<UserSettingType, HookContext>(
  {
    createdAt: virtual(async (userSetting) => fromDateTimeSql(userSetting.createdAt)),
    updatedAt: virtual(async (userSetting) => fromDateTimeSql(userSetting.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return userDbToSchema(rawData)
    }
  }
)

export const userSettingExternalResolver = resolve<UserSettingType, HookContext>({})

export const userSettingDataResolver = resolve<UserSettingDatabaseType, HookContext>(
  {
    id: async () => {
      return uuidv4() as UserSettingID
    },
    createdAt: getDateTimeSql,
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        themeModes: JSON.stringify(rawData.themeModes)
      }
    }
  }
)

export const userSettingPatchResolver = resolve<UserSettingType, HookContext>(
  {
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        themeModes: JSON.stringify(rawData.themeModes)
      }
    }
  }
)

export const userSettingQueryResolver = resolve<UserSettingQuery, HookContext>({})
