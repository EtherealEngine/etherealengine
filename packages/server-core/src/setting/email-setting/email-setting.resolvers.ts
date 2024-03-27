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
  EmailAuthType,
  EmailSettingDatabaseType,
  EmailSettingQuery,
  EmailSettingType,
  EmailSmtpType,
  EmailSubjectType
} from '@etherealengine/common/src/schemas/setting/email-setting.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export const emailDbToSchema = (rawData: EmailSettingDatabaseType): EmailSettingType => {
  let smtp = JSON.parse(rawData.smtp) as EmailSmtpType

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof smtp === 'string') {
    smtp = JSON.parse(smtp)

    // We need to deserialized nested objects of pre-feathers 5 data.
    if (typeof smtp.auth === 'string') {
      smtp.auth = JSON.parse(smtp.auth) as EmailAuthType
    }
  }

  let subject = JSON.parse(rawData.subject) as EmailSubjectType

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof subject === 'string') {
    subject = JSON.parse(subject)
  }

  return {
    ...rawData,
    smtp,
    subject
  }
}

export const emailSettingResolver = resolve<EmailSettingType, HookContext>(
  {
    createdAt: virtual(async (emailSetting) => fromDateTimeSql(emailSetting.createdAt)),
    updatedAt: virtual(async (emailSetting) => fromDateTimeSql(emailSetting.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return emailDbToSchema(rawData)
    }
  }
)

export const emailSettingExternalResolver = resolve<EmailSettingType, HookContext>({})

export const emailSettingDataResolver = resolve<EmailSettingDatabaseType, HookContext>(
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
        smtp: JSON.stringify(rawData.smtp),
        subject: JSON.stringify(rawData.subject)
      }
    }
  }
)

export const emailSettingPatchResolver = resolve<EmailSettingType, HookContext>(
  {
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        smtp: JSON.stringify(rawData.smtp),
        subject: JSON.stringify(rawData.subject)
      }
    }
  }
)

export const emailSettingQueryResolver = resolve<EmailSettingQuery, HookContext>({})
