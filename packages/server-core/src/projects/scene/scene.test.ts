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

import { ProjectType, projectPath } from '@etherealengine/common/src/schemas/projects/project.schema'
import { sceneUploadPath } from '@etherealengine/common/src/schemas/projects/scene-upload.schema'
import { SceneDataType, scenePath } from '@etherealengine/common/src/schemas/projects/scene.schema'
import { parseStorageProviderURLs } from '@etherealengine/common/src/utils/parseSceneJSON'
import { destroyEngine } from '@etherealengine/ecs/src/Engine'
import { SceneJsonType } from '@etherealengine/engine/src/scene/types/SceneTypes'
import defaultSceneSeed from '@etherealengine/projects/default-project/default.scene.json'
import assert from 'assert'
import { v4 as uuidv4 } from 'uuid'
import { Application } from '../../../declarations'
import { createFeathersKoaApp } from '../../createApp'

describe('scene.test', () => {
  let app: Application
  let projectName: string
  let sceneName: string
  let sceneData: SceneJsonType
  let parsedSceneData: Record<string, unknown>
  const params = { isInternal: true }

  before(async () => {
    app = createFeathersKoaApp()
    await app.setup()
  })

  before(async () => {
    projectName = `test-scene-project-${uuidv4()}`
    sceneName = `test-scene-name-${uuidv4()}`
    sceneData = structuredClone(defaultSceneSeed) as unknown as SceneJsonType
    parsedSceneData = parseStorageProviderURLs(structuredClone(defaultSceneSeed))
    await app.service(projectPath).create({ name: projectName })
    await app
      .service(sceneUploadPath)
      .create({ project: projectName, name: sceneName, sceneData }, { files: [], ...params })
  })

  after(async () => {
    const foundProjects = (await app
      .service(projectPath)
      .find({ query: { name: projectName }, paginate: false })) as ProjectType[]
    await app.service(projectPath).remove(foundProjects[0].id, { ...params })
    await destroyEngine()
  })

  describe('"scene" service', () => {
    it('should get scene data', async () => {
      const data = (await app
        .service(scenePath)
        .get('', { query: { project: projectName, name: sceneName, metadataOnly: false } })) as SceneDataType
      assert.equal(data.name, sceneName)
      assert.equal(data.project, projectName)
      assert.deepStrictEqual(data.scene, parsedSceneData)
    })

    it('should add a new scene', async () => {
      const sceneName = `test-apartment-scene-${uuidv4()}`
      await app.service(scenePath).update('', { name: sceneName, project: projectName, sceneData } as any)

      const addedSceneData = (await app
        .service(scenePath)
        .get('', { query: { project: projectName, name: sceneName, metadataOnly: false } })) as SceneDataType
      assert.equal(addedSceneData.name, sceneName)
      assert.equal(addedSceneData.project, projectName)
      assert.deepStrictEqual(addedSceneData.scene, parsedSceneData)
    })

    it('should save or update an existing scene', async () => {
      const newSceneData = structuredClone(defaultSceneSeed) as unknown as SceneJsonType
      const updatedVersion = Math.floor(Math.random() * 100)
      newSceneData.version = updatedVersion
      const newParsedSceneData = parseStorageProviderURLs(structuredClone(newSceneData))

      await app.service(scenePath).update('', { name: sceneName, project: projectName, sceneData: newSceneData })

      const updatedSceneData = (await app
        .service(scenePath)
        .get('', { query: { project: projectName, name: sceneName, metadataOnly: false } })) as SceneDataType
      assert.equal(updatedSceneData.scene.version, updatedVersion)
      assert.equal(updatedSceneData.name, sceneName)
      assert.equal(updatedSceneData.project, projectName)
      assert.deepStrictEqual(updatedSceneData.scene, newParsedSceneData)
    })

    it('should remove the scene', async () => {
      await app.service(scenePath).remove(null, { query: { project: projectName, name: sceneName } })
      assert.rejects(async () => {
        await app.service(scenePath).get('', { query: { name: sceneName, project: projectName, metadataOnly: false } })
      })
    })
  })
})
