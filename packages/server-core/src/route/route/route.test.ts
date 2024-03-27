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
import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import { destroyEngine } from '@etherealengine/ecs/src/Engine'

import { projectPath } from '@etherealengine/common/src/schemas/projects/project.schema'
import { RouteType, routePath } from '@etherealengine/common/src/schemas/route/route.schema'
import { deleteFolderRecursive } from '@etherealengine/common/src/utils/fsHelperFunctions'
import { Paginated } from '@feathersjs/feathers/lib'
import { Application } from '../../../declarations'
import { createFeathersKoaApp } from '../../createApp'

const params = { isInternal: true } as any

const cleanup = async (app: Application, projectName: string) => {
  const projectDir = path.resolve(appRootPath.path, `packages/projects/projects/${projectName}/`)
  deleteFolderRecursive(projectDir)
  try {
    await app.service(projectPath).remove(null, { query: { name: projectName } })
  } catch (e) {
    //
  }
}

const updateXREngineConfigForTest = (projectName: string, customRoute: string) => {
  const testXREngineConfig = `
  import type { ProjectConfigInterface } from '@etherealengine/projects/ProjectConfigInterface'

  const config: ProjectConfigInterface = {
    routes: {
      test: {
        component: () => import('@etherealengine/client/src/pages/index'),
      },
      "${customRoute}": {
        component: () => import('@etherealengine/client/src/pages/index'),
      }
    },
  }
  
  export default config
  `

  const projectsRootFolder = path.join(appRootPath.path, 'packages/projects/projects/')
  const projectLocalDirectory = path.resolve(projectsRootFolder, projectName)
  const xrEngineConfigFilePath = path.resolve(projectLocalDirectory, 'xrengine.config.ts')

  fs.rmSync(xrEngineConfigFilePath)
  fs.writeFileSync(xrEngineConfigFilePath, testXREngineConfig)
}

describe('route.test', () => {
  let app: Application
  let testProject: string
  let testRoute: string

  before(async () => {
    app = createFeathersKoaApp()
    await app.setup()
  })

  after(async () => {
    await cleanup(app, testProject)
    await destroyEngine()
  })

  it('should find the installed project routes', async () => {
    testProject = `test-project-${uuidv4()}`
    testRoute = `test-route-${uuidv4()}`

    await app.service(projectPath).create({ name: testProject }, params)
    updateXREngineConfigForTest(testProject, testRoute)

    const installedRoutes = await app.service('routes-installed').find()
    const route = installedRoutes.find((route) => route.project === testProject)

    assert.ok(route)
    assert.equal(route.project, testProject)
  })

  it('should not be activated by default (the installed project)', async () => {
    const route = (await app.service(routePath).find({ query: { project: testProject } })) as Paginated<RouteType>
    assert.equal(route.total, 0)
  })

  it('should activate a route', async () => {
    const activateResult = await app
      .service('route-activate')
      .create({ project: testProject, route: testRoute, activate: true }, params)
    const fetchResult = (await app.service(routePath).find({ query: { project: testProject } })) as Paginated<RouteType>
    const route = fetchResult.data.find((d) => d.project === testProject)

    assert.ok(activateResult)
    assert.equal(fetchResult.total, 1)

    assert.equal(route?.project, testProject)
    assert.equal(route?.route, testRoute)
  })

  it('should deactivate a route', async () => {
    await app.service('route-activate').create({ project: testProject, route: testRoute, activate: false }, params)

    const route = (await app.service(routePath).find({ query: { project: testProject } })) as Paginated<RouteType>
    assert.equal(route.total, 0)
  })
})
