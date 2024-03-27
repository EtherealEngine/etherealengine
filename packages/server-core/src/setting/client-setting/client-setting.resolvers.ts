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
  ClientSettingDatabaseType,
  ClientSettingQuery,
  ClientSettingType,
  ClientSocialLinkType,
  ClientThemeOptionsType
} from '@etherealengine/common/src/schemas/setting/client-setting.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { fromDateTimeSql, getDateTimeSql } from '../../../../common/src/utils/datetime-sql'

export const clientDbToSchema = (rawData: ClientSettingDatabaseType): ClientSettingType => {
  let appSocialLinks = JSON.parse(rawData.appSocialLinks) as ClientSocialLinkType[]

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof appSocialLinks === 'string') {
    appSocialLinks = JSON.parse(appSocialLinks)
  }

  let themeSettings = JSON.parse(rawData.themeSettings) as Record<string, ClientThemeOptionsType>

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof themeSettings === 'string') {
    themeSettings = JSON.parse(themeSettings)
  }

  let themeModes = JSON.parse(rawData.themeModes) as Record<string, string>

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof themeModes === 'string') {
    themeModes = JSON.parse(themeModes)
  }

  if (typeof rawData.mediaSettings === 'string') rawData.mediaSettings = JSON.parse(rawData.mediaSettings)

  return {
    ...rawData,
    appSocialLinks,
    themeSettings,
    themeModes
  }
}

export const clientSettingResolver = resolve<ClientSettingType, HookContext>(
  {
    createdAt: virtual(async (clientSetting) => fromDateTimeSql(clientSetting.createdAt)),
    updatedAt: virtual(async (clientSetting) => fromDateTimeSql(clientSetting.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return clientDbToSchema(rawData)
    }
  }
)

export const clientSettingExternalResolver = resolve<ClientSettingType, HookContext>({})

export const clientSettingDataResolver = resolve<ClientSettingDatabaseType, HookContext>(
  {
    id: async () => {
      return uuidv4()
    },
    createdAt: getDateTimeSql,
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        appSocialLinks: JSON.stringify(rawData.appSocialLinks),
        themeSettings: JSON.stringify(rawData.themeSettings),
        themeModes: JSON.stringify(rawData.themeModes),
        mediaSettings: JSON.stringify(rawData.mediaSettings)
      }
    }
  }
)

export const clientSettingPatchResolver = resolve<ClientSettingType, HookContext>(
  {
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        appSocialLinks: JSON.stringify(rawData.appSocialLinks),
        themeSettings: JSON.stringify(rawData.themeSettings),
        themeModes: JSON.stringify(rawData.themeModes),
        mediaSettings: JSON.stringify(rawData.mediaSettings)
      }
    }
  }
)

export const clientSettingQueryResolver = resolve<ClientSettingQuery, HookContext>({})
