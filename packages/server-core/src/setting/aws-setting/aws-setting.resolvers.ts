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
  AwsCloudFrontType,
  AwsEksType,
  AwsS3Type,
  AwsSettingDatabaseType,
  AwsSettingQuery,
  AwsSettingType,
  AwsSmsType
} from '@etherealengine/common/src/schemas/setting/aws-setting.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export const awsDbToSchema = (rawData: AwsSettingDatabaseType): AwsSettingType => {
  let eks = JSON.parse(rawData.eks || '{}') as AwsEksType

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof eks === 'string') {
    eks = JSON.parse(eks)
  }

  let s3 = JSON.parse(rawData.s3) as AwsS3Type

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof s3 === 'string') {
    s3 = JSON.parse(s3)
  }

  let cloudfront = JSON.parse(rawData.cloudfront) as AwsCloudFrontType

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof cloudfront === 'string') {
    cloudfront = JSON.parse(cloudfront)
  }

  let sms = JSON.parse(rawData.sms) as AwsSmsType

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof sms === 'string') {
    sms = JSON.parse(sms)
  }

  return {
    ...rawData,
    eks,
    s3,
    cloudfront,
    sms
  }
}

export const awsSettingResolver = resolve<AwsSettingType, HookContext>(
  {
    createdAt: virtual(async (awsSetting) => fromDateTimeSql(awsSetting.createdAt)),
    updatedAt: virtual(async (awsSetting) => fromDateTimeSql(awsSetting.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return awsDbToSchema(rawData)
    }
  }
)

export const awsSettingExternalResolver = resolve<AwsSettingType, HookContext>({})

export const awsSettingDataResolver = resolve<AwsSettingDatabaseType, HookContext>(
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
        keys: JSON.stringify(rawData.keys),
        s3: JSON.stringify(rawData.s3),
        cloudfront: JSON.stringify(rawData.cloudfront),
        sms: JSON.stringify(rawData.sms)
      }
    }
  }
)

export const awsSettingPatchResolver = resolve<AwsSettingType, HookContext>(
  {
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        keys: JSON.stringify(rawData.keys),
        s3: JSON.stringify(rawData.s3),
        cloudfront: JSON.stringify(rawData.cloudfront),
        sms: JSON.stringify(rawData.sms)
      }
    }
  }
)

export const awsSettingQueryResolver = resolve<AwsSettingQuery, HookContext>({})
