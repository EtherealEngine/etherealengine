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
import fs from 'fs'
import path from 'path'

import { EntityUUID, generateEntityUUID } from '@etherealengine/ecs'
import { SceneJsonType } from '@etherealengine/engine/src/scene/types/SceneTypes'

for (const project of fs.readdirSync(path.resolve(appRootPath.path, 'packages/projects/projects/'))) {
  const files = fs.readdirSync(path.resolve(appRootPath.path, 'packages/projects/projects/', project))
  const scenes = files.filter((dirent) => dirent.endsWith('.scene.json'))
  for (const scene of scenes) {
    const uuidMapping = {} as { [uuid: string]: EntityUUID }
    const sceneJson = JSON.parse(
      fs.readFileSync(path.resolve(appRootPath.path, 'packages/projects/projects/', project, scene)).toString()
    ) as SceneJsonType
    for (const uuid of Object.keys(sceneJson.entities)) {
      uuidMapping[uuid] = generateEntityUUID()
    }
    sceneJson.root = uuidMapping[Object.keys(sceneJson.entities)[0]]
    for (const uuid of Object.keys(sceneJson.entities)) {
      if (Object.keys(uuidMapping).includes(sceneJson.entities[uuid].parent!)) {
        sceneJson.entities[uuid].parent =
          uuidMapping[Object.keys(uuidMapping).find((u) => u === sceneJson.entities[uuid].parent!)!]
      }
      if (Object.keys(uuidMapping).includes(uuid)) {
        sceneJson.entities[uuidMapping[Object.keys(uuidMapping).find((u) => u === uuid)!]] = sceneJson.entities[uuid]
        delete sceneJson.entities[uuid]
      }
    }
    fs.writeFileSync(
      path.resolve(appRootPath.path, 'packages/projects/projects/', project, scene),
      JSON.stringify(sceneJson, null, 2)
    )
  }
}
