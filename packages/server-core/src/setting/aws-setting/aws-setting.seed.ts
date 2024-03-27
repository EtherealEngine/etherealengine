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

import { Knex } from 'knex'
import { v4 as uuidv4 } from 'uuid'

import { AwsSettingDatabaseType, awsSettingPath } from '@etherealengine/common/src/schemas/setting/aws-setting.schema'
import appConfig from '@etherealengine/server-core/src/appconfig'

import { getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export async function seed(knex: Knex): Promise<void> {
  const { testEnabled } = appConfig
  const { forceRefresh } = appConfig.db

  const seedData: AwsSettingDatabaseType[] = await Promise.all(
    [
      {
        s3: JSON.stringify({
          accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.STORAGE_AWS_ACCESS_KEY_SECRET,
          endpoint: process.env.STORAGE_S3_ENDPOINT,
          staticResourceBucket: process.env.STORAGE_S3_STATIC_RESOURCE_BUCKET,
          region: process.env.STORAGE_S3_REGION,
          avatarDir: process.env.STORAGE_S3_AVATAR_DIRECTORY,
          s3DevMode: process.env.STORAGE_S3_DEV_MODE
        }),
        eks: JSON.stringify({
          accessKeyId: process.env.EKS_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.EKS_AWS_ACCESS_KEY_SECRET
        }),
        cloudfront: JSON.stringify({
          domain:
            process.env.SERVE_CLIENT_FROM_STORAGE_PROVIDER === 'true'
              ? process.env.APP_HOST
              : process.env.STORAGE_CLOUDFRONT_DOMAIN!,
          distributionId: process.env.STORAGE_CLOUDFRONT_DISTRIBUTION_ID,
          region: process.env.STORAGE_CLOUDFRONT_REGION || process.env.STORAGE_S3_REGION
        }),
        sms: JSON.stringify({
          accessKeyId: process.env.AWS_SMS_ACCESS_KEY_ID,
          applicationId: process.env.AWS_SMS_APPLICATION_ID,
          region: process.env.AWS_SMS_REGION,
          senderId: process.env.AWS_SMS_SENDER_ID,
          secretAccessKey: process.env.AWS_SMS_SECRET_ACCESS_KEY
        })
      }
    ].map(async (item) => ({
      ...item,
      id: uuidv4(),
      createdAt: await getDateTimeSql(),
      updatedAt: await getDateTimeSql()
    }))
  )

  if (forceRefresh || testEnabled) {
    // Deletes ALL existing entries
    await knex(awsSettingPath).del()

    // Inserts seed entries
    await knex(awsSettingPath).insert(seedData)
  } else {
    const existingData = await knex(awsSettingPath).count({ count: '*' })

    if (existingData.length === 0 || existingData[0].count === 0) {
      for (const item of seedData) {
        await knex(awsSettingPath).insert(item)
      }
    }
  }
}
