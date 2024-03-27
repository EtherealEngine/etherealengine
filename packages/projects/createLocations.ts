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

import { Paginated } from '@feathersjs/feathers/lib'
import appRootPath from 'app-root-path'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import {
  LocationData,
  LocationID,
  locationPath,
  LocationSettingType,
  LocationType,
  SceneID
} from '@etherealengine/common/src/schema.type.module'
import { toCapitalCase } from '@etherealengine/common/src/utils/miscUtils'
import { Application } from '@etherealengine/server-core/declarations'

export const createLocations = async (app: Application, projectName: string) => {
  return Promise.all(
    fs
      .readdirSync(path.resolve(appRootPath.path, 'packages/projects/projects', projectName))
      .filter((file) => file.endsWith('.scene.json'))
      .map(async (sceneJson) => {
        const locationId = uuidv4() as LocationID
        const settingsId = uuidv4()
        const sceneName = sceneJson.replace('.scene.json', '')
        const locationName = toCapitalCase(sceneName.replace('-', ' '))
        const locationSetting = {
          id: settingsId,
          locationId,
          locationType: 'public',
          audioEnabled: true,
          videoEnabled: true,
          screenSharingEnabled: true,
          faceStreamingEnabled: true
        } as LocationSettingType
        const location = {
          id: locationId,
          name: locationName,
          slugifiedName: sceneName,
          maxUsersPerInstance: 20,
          sceneId: `projects/${projectName}/${sceneName}.scene.json` as SceneID,
          locationSetting,
          isLobby: false,
          isFeatured: false
        } as LocationData

        const existingLocation = (await app.service(locationPath).find({
          query: {
            slugifiedName: sceneName
          }
        })) as Paginated<LocationType>
        if (existingLocation.total === 0) await app.service(locationPath).create(location)
      })
  )
}
