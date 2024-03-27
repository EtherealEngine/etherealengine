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

import appRootPath from 'app-root-path'
import { Knex } from 'knex'
import path from 'path'
import url from 'url'
import { v4 as uuidv4 } from 'uuid'

import {
  ServerSettingDatabaseType,
  serverSettingPath
} from '@etherealengine/common/src/schemas/setting/server-setting.schema'
import appConfig from '@etherealengine/server-core/src/appconfig'

import { getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

const kubernetesEnabled = process.env.KUBERNETES === 'true'

const server = {
  mode: process.env.SERVER_MODE!,
  hostname: process.env.SERVER_HOST!,
  port: process.env.SERVER_PORT!,
  clientHost: process.env.APP_HOST!,
  rootDir: path.resolve(appRootPath.path, 'packages', 'server'),
  publicDir:
    process.env.SERVER_PUBLIC_DIR ||
    (process.env.BUILD_MODE === 'individual'
      ? path.resolve(appRootPath.path, 'public')
      : path.resolve(appRootPath.path, 'packages', 'server', 'public')),
  nodeModulesDir: path.resolve(__dirname, '../..', 'node_modules'),
  localStorageProvider: process.env.LOCAL_STORAGE_PROVIDER ?? 's3',
  performDryRun: process.env.PERFORM_DRY_RUN === 'true',
  storageProvider: process.env.STORAGE_PROVIDER!,
  gaTrackingId: process.env.GOOGLE_ANALYTICS_TRACKING_ID || null!,
  hub: JSON.stringify({
    endpoint: process.env.HUB_ENDPOINT
  }),
  url: '' || (null! as string),
  certPath: appRootPath.path.toString() + '/' + process.env.CERT,
  keyPath: appRootPath.path.toString() + '/' + process.env.KEY,
  gitPem: '',
  local: process.env.LOCAL === 'true',
  releaseName: process.env.RELEASE_NAME || 'local',
  instanceserverUnreachableTimeoutSeconds: parseInt(process.env.INSTANCESERVER_UNREACHABLE_TIMEOUT_SECONDS || '2'),
  githubWebhookSecret: ''
}

server.url =
  process.env.SERVER_URL ||
  url.format(kubernetesEnabled ? { protocol: 'https', hostname: server.hostname } : { protocol: 'https', ...server })

export async function seed(knex: Knex): Promise<void> {
  const { testEnabled } = appConfig
  const { forceRefresh } = appConfig.db

  const seedData: ServerSettingDatabaseType[] = await Promise.all(
    [server].map(async (item) => ({
      ...item,
      id: uuidv4(),
      createdAt: await getDateTimeSql(),
      updatedAt: await getDateTimeSql()
    }))
  )

  if (forceRefresh || testEnabled) {
    // Deletes ALL existing entries
    await knex(serverSettingPath).del()

    // Inserts seed entries
    await knex(serverSettingPath).insert(seedData)
  } else {
    const existingData = await knex(serverSettingPath).count({ count: '*' })

    if (existingData.length === 0 || existingData[0].count === 0) {
      for (const item of seedData) {
        await knex(serverSettingPath).insert(item)
      }
    }
  }
}
