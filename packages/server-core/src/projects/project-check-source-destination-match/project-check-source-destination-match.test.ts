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

import { projectCheckSourceDestinationMatchPath } from '@etherealengine/common/src/schemas/projects/project-check-source-destination-match.schema'
import { ProjectType, projectPath } from '@etherealengine/common/src/schemas/projects/project.schema'
import { ScopeType } from '@etherealengine/common/src/schemas/scope/scope.schema'
import { avatarPath } from '@etherealengine/common/src/schemas/user/avatar.schema'
import { identityProviderPath } from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { UserApiKeyType, userApiKeyPath } from '@etherealengine/common/src/schemas/user/user-api-key.schema'
import { UserName, userPath } from '@etherealengine/common/src/schemas/user/user.schema'
import { destroyEngine } from '@etherealengine/ecs/src/Engine'
import assert from 'assert'
import nock from 'nock'
import { v4 as uuidv4 } from 'uuid'
import { Application } from '../../../declarations'
import { createFeathersKoaApp } from '../../createApp'

describe('project-check-source-destination-match.test', () => {
  let app: Application
  let testUserApiKey: UserApiKeyType

  const getTestSourceDestinationUrlQuery1 = () => ({
    sourceURL: 'https://github.com/EtherealEngine/ee-ethereal-village',
    destinationURL: 'https://github.com/EtherealEngine/ee-ethereal-village'
  })

  const getTestSourceDestinationUrlQuery2 = () => ({
    sourceURL: 'https://github.com/EtherealEngine/ee-ethereal-village',
    destinationURL: 'https://github.com/EtherealEngine/ee-bot'
  })

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
    const name = ('test-project-check-source-destination-match-user-name-' + uuidv4()) as UserName

    const avatar = await app.service(avatarPath).create({
      name: 'test-project-check-source-destination-match-avatar-name-' + uuidv4()
    })

    const testUser = await app.service(userPath).create({
      name,
      avatarId: avatar.id,
      isGuest: false,
      scopes: [{ type: 'projects:read' as ScopeType }]
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

  after(() => destroyEngine())

  it('should match source and destination contents with same repos', async () => {
    nock('https://api.github.com')
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoPackageJson1())
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoXrengineConfig1())
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoPackageJson1())

    const result = await app
      .service(projectCheckSourceDestinationMatchPath)
      .find({ query: getTestSourceDestinationUrlQuery1(), ...getParams() }, undefined as any)

    assert.ok(result)
    assert.ok(result.projectName)
    assert.equal(result.sourceProjectMatchesDestination, true)
  })

  it('should not match source and destination contents with different repos', async () => {
    nock('https://api.github.com')
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoPackageJson1())
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoXrengineConfig1())
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoPackageJson2())

    const result = await app
      .service(projectCheckSourceDestinationMatchPath)
      .find({ query: getTestSourceDestinationUrlQuery2(), ...getParams() }, undefined as any)

    assert.ok(result)
    assert.ok(result.error)
    assert.ok(result.text)
    assert.ok(!result.sourceProjectMatchesDestination)
  })

  describe('installed project check', () => {
    let createdProject: ProjectType

    before(async () => {
      createdProject = await app.service(projectPath).create({
        name: 'ee-ethereal-village'
      })
    })

    after(async () => {
      await app.service(projectPath).remove(createdProject.id)
    })

    it('should check if project is already installed', async () => {
      nock('https://api.github.com')
        .get(/\/repos.*\/contents\/.*/)
        .reply(200, getRepoPackageJson1())
        .get(/\/repos.*\/contents\/.*/)
        .reply(200, getRepoXrengineConfig1())
        .get(/\/repos.*\/contents\/.*/)
        .reply(200, getRepoPackageJson1())

      const result = await app
        .service(projectCheckSourceDestinationMatchPath)
        .find({ query: getTestSourceDestinationUrlQuery1(), ...getParams() }, undefined as any)

      assert.ok(result)
      assert.ok(result.error)
    })
  })

  it('should match if destination package.json is empty', async () => {
    nock('https://api.github.com')
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoPackageJson1())
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoXrengineConfig1())
      .get(/\/repos.*\/contents\/.*/)
      .reply(404)

    const result = await app
      .service(projectCheckSourceDestinationMatchPath)
      .find({ query: getTestSourceDestinationUrlQuery1(), ...getParams() }, undefined as any)

    assert.ok(result)
    assert.equal(result.sourceProjectMatchesDestination, true)
  })
})

const getRepoPackageJson1 = () => ({
  name: 'package.json',
  path: 'package.json',
  sha: '307456741f75499a57fac1145ce2c75112ddbf57',
  size: 321,
  url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/contents/package.json?ref=dev',
  html_url: 'https://github.com/EtherealEngine/ee-ethereal-village/blob/dev/package.json',
  git_url:
    'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/blobs/307456741f75499a57fac1145ce2c75112ddbf57',
  download_url: 'https://raw.githubusercontent.com/EtherealEngine/ee-ethereal-village/dev/package.json',
  type: 'file',
  content:
    'ewogICJuYW1lIjogImVlLWV0aGVyZWFsLXZpbGxhZ2UiLAogICJ2ZXJzaW9u\nIjogIjAuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiJ0EgbWVkaWV2YWwgd29y\nbGQgc2hvd2Nhc2luZyBhZHZhbmNlZCBvcGVuIHdvcmxkIG11bHRpcGxheWVy\nIGZlYXR1cmVzIiwKICAibWFpbiI6ICIiLAogICJldGhlcmVhbEVuZ2luZSI6\nIHsKICAgICJ2ZXJzaW9uIjogIjEuMi4wIgogIH0sCiAgInNjcmlwdHMiOiB7\nfSwKICAicGVlckRlcGVuZGVuY2llcyI6IHt9LAogICJkZXBlbmRlbmNpZXMi\nOiB7fSwKICAiZGV2RGVwZW5kZW5jaWVzIjoge30sCiAgImxpY2Vuc2UiOiAi\nSVNDIgp9\n',
  encoding: 'base64',
  _links: {
    self: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/contents/package.json?ref=dev',
    git: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/blobs/307456741f75499a57fac1145ce2c75112ddbf57',
    html: 'https://github.com/EtherealEngine/ee-ethereal-village/blob/dev/package.json'
  }
})

const getRepoXrengineConfig1 = () => ({
  name: 'xrengine.config.ts',
  path: 'xrengine.config.ts',
  sha: '11782d0d23e1811e15608d4feb2d4bc075c231f7',
  size: 401,
  url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/contents/xrengine.config.ts?ref=dev',
  html_url: 'https://github.com/EtherealEngine/ee-ethereal-village/blob/dev/xrengine.config.ts',
  git_url:
    'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/blobs/11782d0d23e1811e15608d4feb2d4bc075c231f7',
  download_url: 'https://raw.githubusercontent.com/EtherealEngine/ee-ethereal-village/dev/xrengine.config.ts',
  type: 'file',
  content:
    'aW1wb3J0IHR5cGUgeyBQcm9qZWN0Q29uZmlnSW50ZXJmYWNlIH0gZnJvbSAn\nQGV0aGVyZWFsZW5naW5lL3Byb2plY3RzL1Byb2plY3RDb25maWdJbnRlcmZh\nY2UnCgppbXBvcnQgY29tbW9uQ29uZmlnIGZyb20gJ0BldGhlcmVhbGVuZ2lu\nZS9jb21tb24vc3JjL2NvbmZpZycKCmNvbnN0IGNvbmZpZzogUHJvamVjdENv\nbmZpZ0ludGVyZmFjZSA9IHsKICBvbkV2ZW50OiB1bmRlZmluZWQsCiAgdGh1\nbWJuYWlsOiBjb21tb25Db25maWcuY2xpZW50LmZpbGVTZXJ2ZXIgKyAnL3By\nb2plY3RzL2VlLWV0aGVyZWFsLXZpbGxhZ2UvdGh1bWJuYWlsLnBuZycsCiAg\ncm91dGVzOiB7fSwKICBzZXJ2aWNlczogdW5kZWZpbmVkLAogIGRhdGFiYXNl\nU2VlZDogdW5kZWZpbmVkCn0KCmV4cG9ydCBkZWZhdWx0IGNvbmZpZwo=\n',
  encoding: 'base64',
  _links: {
    self: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/contents/xrengine.config.ts?ref=dev',
    git: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/blobs/11782d0d23e1811e15608d4feb2d4bc075c231f7',
    html: 'https://github.com/EtherealEngine/ee-ethereal-village/blob/dev/xrengine.config.ts'
  }
})

const getRepoPackageJson2 = () => ({
  name: 'package.json',
  path: 'package.json',
  sha: '76f00e5fd3035ed32f21eecf87a6503547752767',
  size: 1163,
  url: 'https://api.github.com/repos/EtherealEngine/ee-bot/contents/package.json?ref=master',
  html_url: 'https://github.com/EtherealEngine/ee-bot/blob/master/package.json',
  git_url: 'https://api.github.com/repos/EtherealEngine/ee-bot/git/blobs/76f00e5fd3035ed32f21eecf87a6503547752767',
  download_url: 'https://raw.githubusercontent.com/EtherealEngine/ee-bot/master/package.json',
  type: 'file',
  content:
    'ewogICJuYW1lIjogImVlLWJvdCIsCiAgInZlcnNpb24iOiAiMC41LjgiLAog\nICJkZXNjcmlwdGlvbiI6ICJBIHRlc3QgYm90IHVzaW5nIHB1cHBldGVlciIs\nCiAgInJlcG9zaXRvcnkiOiB7CiAgICAidHlwZSI6ICJnaXQiLAogICAgInVy\nbCI6ICJnaXQ6Ly9naXRodWIuY29tL2V0aGVyZWFsZW5naW5lL2V0aGVyZWFs\nZW5naW5lLmdpdCIKICB9LAogICJldGhlcmVhbEVuZ2luZSI6IHsKICAgICJ2\nZXJzaW9uIjogIjEuMS4wIgogIH0sCiAgImVuZ2luZXMiOiB7CiAgICAibm9k\nZSI6ICI+PSAxNi4zLjAiCiAgfSwKICAicHVibGlzaENvbmZpZyI6IHsKICAg\nICJhY2Nlc3MiOiAicHVibGljIgogIH0sCiAgIm5wbUNsaWVudCI6ICJucG0i\nLAogICJtYWluIjogInNyYy9pbmRleC50cyIsCiAgInNjcmlwdHMiOiB7CiAg\nICAiZGV2IjogInRzLW5vZGUgLS1zd2MgLi9zcmMvaW5kZXgudHMiLAogICAg\nImRldi1rb2EiOiAidHMtbm9kZSAtLXN3YyAuL3NyYy9pbmRleF9rb2EudHMi\nLAogICAgImJ1aWxkIjogInRzYyIsCiAgICAiY2hlY2stZXJyb3JzIjogInRz\nYyAtLW5vZW1pdCIsCiAgICAidmFsaWRhdGUiOiAibnBtIHJ1biB0ZXN0IiwK\nICAgICJmb3JtYXQiOiAicHJldHRpZXIgLS13cml0ZSBcIioqLyoue3RzLHRz\neH1cIiIsCiAgICAicHJlY29tbWl0IjogIm5vLW1hc3Rlci1jb21taXRzIC1i\nIG1hc3RlciIKICB9LAogICJkZXBlbmRlbmNpZXMiOiB7CiAgICAiZ2wtbWF0\ncml4IjogIl4zLjQuMyIsCiAgICAia29hIjogIl4yLjE0LjIiLAogICAgImtv\nYS1ib2R5cGFyc2VyIjogIl40LjQuMCIsCiAgICAia29hLXJvdXRlciI6ICJe\nMTIuMC4wIiwKICAgICJwdXBwZXRlZXIiOiAiXjE5LjYuMyIsCiAgICAidHMt\nbm9kZSI6ICIxMC45LjEiLAogICAgIndlYnhyLWVtdWxhdG9yIjogImV0aGVy\nZWFsZW5naW5lL1dlYlhSLWVtdWxhdG9yLWV4dGVuc2lvbiIKICB9LAogICJs\naWNlbnNlIjogIklTQyIsCiAgImRldkRlcGVuZGVuY2llcyI6IHsKICAgICJA\nc3djL2NvcmUiOiAiMS4zLjQxIiwKICAgICJAdHlwZXMvZXhwZWN0LXB1cHBl\ndGVlciI6ICJeNS4wLjMiLAogICAgIkB0eXBlcy9rb2EtYm9keXBhcnNlciI6\nICJeNC4zLjEwIiwKICAgICJAdHlwZXMva29hLXJvdXRlciI6ICJeNy40LjQi\nLAogICAgIkB0eXBlcy9tb2NoYSI6ICJeMTAuMC4xIgogIH0KfQo=\n',
  encoding: 'base64',
  _links: {
    self: 'https://api.github.com/repos/EtherealEngine/ee-bot/contents/package.json?ref=master',
    git: 'https://api.github.com/repos/EtherealEngine/ee-bot/git/blobs/76f00e5fd3035ed32f21eecf87a6503547752767',
    html: 'https://github.com/EtherealEngine/ee-bot/blob/master/package.json'
  }
})
