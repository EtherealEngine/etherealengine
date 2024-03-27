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

import { projectCheckUnfetchedCommitPath } from '@etherealengine/common/src/schemas/projects/project-check-unfetched-commit.schema'
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

describe('project-check-unfetched-commit.test', () => {
  let app: Application
  let testUserApiKey: UserApiKeyType

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
    const name = ('test-project-check-unfetched-commit-user-name-' + uuidv4()) as UserName

    const avatar = await app.service(avatarPath).create({
      name: 'test-project-check-unfetched-commit-avatar-name-' + uuidv4()
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

  it('should get the commit data', async () => {
    nock('https://api.github.com')
      .get(/\/repos.*\/commits\/.*/)
      .reply(200, getRepoCommit())
      .get(/\/repos.*\/contents\/.*/)
      .reply(200, getRepoPackageJson())

    const selectedSHA = '9157dba017ede5585beacffe765260143c9d6212'

    const result = await app
      .service(projectCheckUnfetchedCommitPath)
      .get('https://github.com/EtherealEngine/ee-ethereal-village', {
        query: { selectedSHA },
        ...getParams()
      })

    assert.ok(result)
    assert.equal(result.commitSHA, '9157dba017ede5585beacffe765260143c9d6212')
    assert.ok(!result.error)
  })
})

const getRepoCommit = () => ({
  sha: '9157dba017ede5585beacffe765260143c9d6212',
  node_id: 'C_kwDOJOElGdoAKDkxNTdkYmEwMTdlZGU1NTg1YmVhY2ZmZTc2NTI2MDE0M2M5ZDYyMTI',
  commit: {
    author: {
      name: 'HexaField',
      email: 'joshfield999@gmail.com',
      date: '2023-10-13T02:23:53Z'
    },
    committer: {
      name: 'HexaField',
      email: 'joshfield999@gmail.com',
      date: '2023-10-13T02:23:53Z'
    },
    message: 'update camera far',
    tree: {
      sha: '5f6e43c2e7fa309acb18c5ad6809c68346fe119a',
      url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/trees/5f6e43c2e7fa309acb18c5ad6809c68346fe119a'
    },
    url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/commits/9157dba017ede5585beacffe765260143c9d6212',
    comment_count: 0,
    verification: {
      verified: false,
      reason: 'unsigned',
      signature: null,
      payload: null
    }
  },
  url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/9157dba017ede5585beacffe765260143c9d6212',
  html_url: 'https://github.com/EtherealEngine/ee-ethereal-village/commit/9157dba017ede5585beacffe765260143c9d6212',
  comments_url:
    'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/9157dba017ede5585beacffe765260143c9d6212/comments',
  author: {
    login: 'HexaField',
    id: 10372036,
    node_id: 'MDQ6VXNlcjEwMzcyMDM2',
    avatar_url: 'https://avatars.githubusercontent.com/u/10372036?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/HexaField',
    html_url: 'https://github.com/HexaField',
    followers_url: 'https://api.github.com/users/HexaField/followers',
    following_url: 'https://api.github.com/users/HexaField/following{/other_user}',
    gists_url: 'https://api.github.com/users/HexaField/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/HexaField/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/HexaField/subscriptions',
    organizations_url: 'https://api.github.com/users/HexaField/orgs',
    repos_url: 'https://api.github.com/users/HexaField/repos',
    events_url: 'https://api.github.com/users/HexaField/events{/privacy}',
    received_events_url: 'https://api.github.com/users/HexaField/received_events',
    type: 'User',
    site_admin: false
  },
  committer: {
    login: 'HexaField',
    id: 10372036,
    node_id: 'MDQ6VXNlcjEwMzcyMDM2',
    avatar_url: 'https://avatars.githubusercontent.com/u/10372036?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/HexaField',
    html_url: 'https://github.com/HexaField',
    followers_url: 'https://api.github.com/users/HexaField/followers',
    following_url: 'https://api.github.com/users/HexaField/following{/other_user}',
    gists_url: 'https://api.github.com/users/HexaField/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/HexaField/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/HexaField/subscriptions',
    organizations_url: 'https://api.github.com/users/HexaField/orgs',
    repos_url: 'https://api.github.com/users/HexaField/repos',
    events_url: 'https://api.github.com/users/HexaField/events{/privacy}',
    received_events_url: 'https://api.github.com/users/HexaField/received_events',
    type: 'User',
    site_admin: false
  },
  parents: [
    {
      sha: 'bd8e415420052222a7953d149b1d5ba9153bc84a',
      url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/bd8e415420052222a7953d149b1d5ba9153bc84a',
      html_url: 'https://github.com/EtherealEngine/ee-ethereal-village/commit/bd8e415420052222a7953d149b1d5ba9153bc84a'
    }
  ],
  stats: {
    total: 2,
    additions: 1,
    deletions: 1
  },
  files: [
    {
      sha: 'ee2f1886524e0041238dbb712f85a3301dd7265c',
      filename: 'village.scene.json',
      status: 'modified',
      additions: 1,
      deletions: 1,
      changes: 2,
      blob_url:
        'https://github.com/EtherealEngine/ee-ethereal-village/blob/9157dba017ede5585beacffe765260143c9d6212/village.scene.json',
      raw_url:
        'https://github.com/EtherealEngine/ee-ethereal-village/raw/9157dba017ede5585beacffe765260143c9d6212/village.scene.json',
      contents_url:
        'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/contents/village.scene.json?ref=9157dba017ede5585beacffe765260143c9d6212',
      patch:
        '@@ -381,7 +381,7 @@\n           "props": {\n             "color": 16777215,\n             "intensity": 1,\n-            "cameraFar": 2000,\n+            "cameraFar": 200,\n             "castShadow": true,\n             "shadowBias": -0.000005,\n             "shadowRadius": 1,'
    }
  ]
})

const getRepoPackageJson = () => ({
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
