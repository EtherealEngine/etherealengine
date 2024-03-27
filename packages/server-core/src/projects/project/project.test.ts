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
import nock from 'nock'
import path from 'path'

import { destroyEngine } from '@etherealengine/ecs/src/Engine'

import { ProjectType, projectPath } from '@etherealengine/common/src/schemas/projects/project.schema'
import { ScopeType } from '@etherealengine/common/src/schemas/scope/scope.schema'
import { avatarPath } from '@etherealengine/common/src/schemas/user/avatar.schema'
import { identityProviderPath } from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { UserApiKeyType, userApiKeyPath } from '@etherealengine/common/src/schemas/user/user-api-key.schema'
import { UserName, userPath } from '@etherealengine/common/src/schemas/user/user.schema'
import { copyFolderRecursiveSync, deleteFolderRecursive } from '@etherealengine/common/src/utils/fsHelperFunctions'
import { Paginated } from '@feathersjs/feathers'
import { v4 as uuidv4 } from 'uuid'
import { Application } from '../../../declarations'
import { createFeathersKoaApp } from '../../createApp'
import { useGit } from '../../util/gitHelperFunctions'

const cleanup = async (app: Application, projectName: string) => {
  const projectDir = path.resolve(appRootPath.path, `packages/projects/projects/${projectName}/`)
  deleteFolderRecursive(projectDir)
  const removingProjects = await app.service(projectPath).find({ query: { name: projectName } })
  if (removingProjects.data.length) await app.service(projectPath).remove(removingProjects.data[0].id)
}

describe('project.test', () => {
  let app: Application
  let testUserApiKey: UserApiKeyType
  let testProject: ProjectType

  const getParams = () => ({
    provider: 'rest',
    headers: {
      authorization: `Bearer ${testUserApiKey.token}`
    }
  })

  before(async () => {
    app = createFeathersKoaApp()
    await app.setup()
  })

  before(async () => {
    const name = ('test-project-user-name-' + uuidv4()) as UserName
    const avatarName = 'test-project-avatar-name-' + uuidv4()

    const avatar = await app.service(avatarPath).create({
      name: avatarName
    })

    const testUser = await app.service(userPath).create({
      name,
      avatarId: avatar.id,
      isGuest: false,
      scopes: [{ type: 'editor:write' as ScopeType }]
    })

    testUserApiKey = await app.service(userApiKeyPath).create({ userId: testUser.id })

    await app.service(identityProviderPath).create(
      {
        type: 'github',
        token: `test-token-${Math.round(Math.random() * 1000)}`,
        userId: testUser.id
      },
      getParams()
    )
  })

  after(async () => {
    await cleanup(app, testProject.name)
    await destroyEngine()
  })

  describe('create', () => {
    it('should add new project', async () => {
      const projectName = `test-project-${uuidv4()}`

      testProject = await app.service(projectPath).create(
        {
          name: projectName
        },
        getParams()
      )

      assert.ok(testProject.id)
      assert.equal(testProject.name, projectName)
    })

    it('should not add new project with same name as existing project', () => {
      assert.rejects(async () => {
        await app.service(projectPath).create(
          {
            name: testProject.name
          },
          getParams()
        )
      })
    })
  })

  describe('update', () => {
    let sourceDirectory: string
    let testUpdateProjectName: string

    before(() => {
      sourceDirectory = path.resolve(appRootPath.path, `packages/projects/projects/test-cloning-directory`)
      copyFolderRecursiveSync(
        path.resolve(appRootPath.path, `packages/projects/template-project`),
        path.resolve(appRootPath.path, `packages/projects/projects`)
      )
      fs.renameSync(path.resolve(appRootPath.path, `packages/projects/projects/template-project`), sourceDirectory)

      const git = useGit(sourceDirectory)
      git.init()
      git.add('.')
      git.commit('initial commit')

      testUpdateProjectName = `test-update-project-name-${uuidv4()}`
    })

    after(async () => {
      await cleanup(app, testUpdateProjectName)
      await cleanup(app, 'template-project')
      fs.rmSync(sourceDirectory, { force: true, recursive: true })
    })

    it('should create and add the project details if it does not exist', async () => {
      nock('https://api.github.com')
        .get(/\/user.*/)
        .reply(200, getAuthenticatedUser('test-user'))

      await app.service(projectPath).update(
        testProject.id,
        {
          sourceURL: sourceDirectory + '/', // slash is needed to force the sourceURL to be a directory
          name: testUpdateProjectName
        },
        getParams()
      )

      const updatedProject = await app
        .service(projectPath)
        .find({ query: { name: testUpdateProjectName }, ...getParams() })
      assert.ok(updatedProject.data[0].commitDate)
      assert.equal(updatedProject.data[0].name, testUpdateProjectName)
    })

    it('should update the project details if it already exists', async () => {
      nock('https://api.github.com')
        .get(/\/user.*/)
        .reply(200, getAuthenticatedUser('test-user'))

      await app.service(projectPath).update(
        testProject.id,
        {
          sourceURL: sourceDirectory + '/',
          name: testProject.name
        },
        getParams()
      )

      const updatedProject = await app.service(projectPath).get(testProject.id)
      assert.equal(updatedProject.name, testProject.name)
      assert.notEqual(updatedProject.commitDate, testProject.commitDate)
    })
  })

  describe('patch', () => {
    it('should change the project data', async () => {
      const randomUpdateType = `test-update-type-${Math.round(Math.random() * 1000)}`
      const patchedProject = await app.service(projectPath).patch(testProject.id, { updateType: randomUpdateType })

      assert.equal(patchedProject.name, testProject.name)
      assert.equal(patchedProject.updateType, randomUpdateType)
    })
  })

  describe('remove', () => {
    it('should remove project', async function () {
      await app.service(projectPath).remove(testProject.id, getParams())

      const project = (await app
        .service(projectPath)
        .find({ query: { id: testProject.id }, ...getParams() })) as Paginated<ProjectType>
      assert.equal(project.data.length, 0)
    })
  })
})

const getAuthenticatedUser = (username: string) => ({
  login: username,
  id: 1,
  node_id: 'MDQ6VXNlcjE=',
  avatar_url: 'https://github.com/images/error/octocat_happy.gif',
  gravatar_id: '',
  url: `https://api.github.com/users/${username}`,
  html_url: `https://github.com/${username}`,
  followers_url: `https://api.github.com/users/${username}/followers`,
  following_url: `https://api.github.com/users/${username}/following{/other_user}`,
  gists_url: `https://api.github.com/users/${username}/gists{/gist_id}`,
  starred_url: `https://api.github.com/users/${username}/starred{/owner}{/repo}`,
  subscriptions_url: `https://api.github.com/users/${username}/subscriptions`,
  organizations_url: `https://api.github.com/users/${username}/orgs`,
  repos_url: `https://api.github.com/users/${username}/repos`,
  events_url: `https://api.github.com/users/${username}/events{/privacy}`,
  received_events_url: `https://api.github.com/users/${username}/received_events`,
  type: 'User',
  site_admin: false,
  name: `Test User ${username}`,
  company: 'GitHub',
  blog: 'https://github.com/blog',
  location: 'San Francisco',
  email: 'octocat@github.com',
  hireable: false,
  bio: 'There once was...',
  twitter_username: 'monatheoctocat',
  public_repos: 2,
  public_gists: 1,
  followers: 20,
  following: 0,
  created_at: '2008-01-14T04:33:35Z',
  updated_at: '2008-01-14T04:33:35Z',
  private_gists: 81,
  total_private_repos: 100,
  owned_private_repos: 100,
  disk_usage: 10000,
  collaborators: 8,
  two_factor_authentication: true,
  plan: {
    name: 'Medium',
    space: 400,
    private_repos: 20,
    collaborators: 0
  }
})
