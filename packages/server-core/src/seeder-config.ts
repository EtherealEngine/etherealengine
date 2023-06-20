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

import fs from 'fs'
import path from 'path'

import { KnexSeed } from '@etherealengine/common/src/interfaces/KnexSeed'
import { ServicesSeedConfig } from '@etherealengine/common/src/interfaces/ServicesSeedConfig'
import { ProjectConfigInterface } from '@etherealengine/projects/ProjectConfigInterface'

import { analyticsSeeds } from './analytics/seeder-config'
import { mediaSeeds } from './media/seeder-config'
import { networkingSeeds } from './networking/seeder-config'
import { projectSeeds } from './projects/seeder-config'
import { routeSeeds } from './route/seeder-config'
import { scopeSeeds } from './scope/seeder-config'
import { settingSeeds, settingSequelizeSeeds } from './setting/seeder-config'
import { socialSeeds, socialSequelizeSeeds } from './social/seeder-config'
import { userSeeds } from './user/seeder-config'

const installedProjects = fs.existsSync(path.resolve(__dirname, '../../projects/projects'))
  ? fs
      .readdirSync(path.resolve(__dirname, '../../projects/projects'), { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => {
        try {
          const config: ProjectConfigInterface =
            require(`../../projects/projects/${dirent.name}/xrengine.config.ts`).default
          if (!config.databaseSeed) return null
          return path.join(dirent.name, config.databaseSeed)
        } catch (e) {
          // console.log(e)
        }
      })
      .filter((hasServices) => !!hasServices)
      .map((seedDir) => require(`../../projects/projects/${seedDir}`).default)
      .flat()
  : []

export const sequelizeSeeds: Array<ServicesSeedConfig> = [
  ...mediaSeeds,
  ...networkingSeeds,
  ...socialSequelizeSeeds,
  ...userSeeds,
  ...scopeSeeds,
  ...settingSequelizeSeeds,
  ...projectSeeds,
  ...installedProjects
]

export const knexSeeds: Array<KnexSeed> = [...routeSeeds, ...analyticsSeeds, ...settingSeeds, ...socialSeeds]
