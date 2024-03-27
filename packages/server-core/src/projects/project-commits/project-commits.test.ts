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

import { projectCommitsPath } from '@etherealengine/common/src/schemas/projects/project-commits.schema'
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

describe('project-commits.test', () => {
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
    const name = ('test-project-commits-user-name-' + uuidv4()) as UserName

    const avatar = await app.service(avatarPath).create({
      name: 'test-project-commits-avatar-name-' + uuidv4()
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

  it('should get commits of the project', async () => {
    nock('https://api.github.com')
      .get(/\/repos.*/)
      .reply(200, getRepoData())
      .get(/\/repos.*\/commits.*/)
      .reply(200, getRepoCommits())
      .get(/\/repos.*\/contents\/.*/)
      .times(3)
      .reply(200, getRepoPackageJson())

    const result = await app
      .service(projectCommitsPath)
      .get('https://github.com/EtherealEngine/ee-ethereal-village', getParams())

    assert.ok(result)
    assert.notEqual(result.commits[0], result.commits[1])
    assert.notEqual(result.commits[1], result.commits[2])
    assert.notEqual(result.commits[2], result.commits[0])
  })
})

const getRepoData = () => ({
  id: 618734873,
  node_id: 'R_kgDOJOElGQ',
  name: 'ee-ethereal-village',
  full_name: 'EtherealEngine/ee-ethereal-village',
  private: false,
  owner: {
    login: 'EtherealEngine',
    id: 107153800,
    node_id: 'O_kgDOBmMJiA',
    avatar_url: 'https://avatars.githubusercontent.com/u/107153800?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/EtherealEngine',
    html_url: 'https://github.com/EtherealEngine',
    followers_url: 'https://api.github.com/users/EtherealEngine/followers',
    following_url: 'https://api.github.com/users/EtherealEngine/following{/other_user}',
    gists_url: 'https://api.github.com/users/EtherealEngine/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/EtherealEngine/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/EtherealEngine/subscriptions',
    organizations_url: 'https://api.github.com/users/EtherealEngine/orgs',
    repos_url: 'https://api.github.com/users/EtherealEngine/repos',
    events_url: 'https://api.github.com/users/EtherealEngine/events{/privacy}',
    received_events_url: 'https://api.github.com/users/EtherealEngine/received_events',
    type: 'Organization',
    site_admin: false
  },
  html_url: 'https://github.com/EtherealEngine/ee-ethereal-village',
  description: null,
  fork: false,
  url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village',
  forks_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/forks',
  keys_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/keys{/key_id}',
  collaborators_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/collaborators{/collaborator}',
  teams_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/teams',
  hooks_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/hooks',
  issue_events_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/issues/events{/number}',
  events_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/events',
  assignees_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/assignees{/user}',
  branches_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/branches{/branch}',
  tags_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/tags',
  blobs_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/blobs{/sha}',
  git_tags_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/tags{/sha}',
  git_refs_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/refs{/sha}',
  trees_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/trees{/sha}',
  statuses_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/statuses/{sha}',
  languages_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/languages',
  stargazers_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/stargazers',
  contributors_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/contributors',
  subscribers_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/subscribers',
  subscription_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/subscription',
  commits_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits{/sha}',
  git_commits_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/commits{/sha}',
  comments_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/comments{/number}',
  issue_comment_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/issues/comments{/number}',
  contents_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/contents/{+path}',
  compare_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/compare/{base}...{head}',
  merges_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/merges',
  archive_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/{archive_format}{/ref}',
  downloads_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/downloads',
  issues_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/issues{/number}',
  pulls_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/pulls{/number}',
  milestones_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/milestones{/number}',
  notifications_url:
    'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/notifications{?since,all,participating}',
  labels_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/labels{/name}',
  releases_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/releases{/id}',
  deployments_url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/deployments',
  created_at: '2023-03-25T07:31:50Z',
  updated_at: '2023-04-13T10:21:48Z',
  pushed_at: '2023-11-30T20:48:23Z',
  git_url: 'git://github.com/EtherealEngine/ee-ethereal-village.git',
  ssh_url: 'git@github.com:EtherealEngine/ee-ethereal-village.git',
  clone_url: 'https://github.com/EtherealEngine/ee-ethereal-village.git',
  svn_url: 'https://github.com/EtherealEngine/ee-ethereal-village',
  homepage: null,
  size: 352,
  stargazers_count: 1,
  watchers_count: 1,
  language: 'JavaScript',
  has_issues: true,
  has_projects: true,
  has_downloads: true,
  has_wiki: true,
  has_pages: false,
  has_discussions: false,
  forks_count: 4,
  mirror_url: null,
  archived: false,
  disabled: false,
  open_issues_count: 1,
  license: {
    key: 'other',
    name: 'Other',
    spdx_id: 'NOASSERTION',
    url: null,
    node_id: 'MDc6TGljZW5zZTA='
  },
  allow_forking: true,
  is_template: false,
  web_commit_signoff_required: false,
  topics: [],
  visibility: 'public',
  forks: 4,
  open_issues: 1,
  watchers: 1,
  default_branch: 'dev',
  temp_clone_token: null,
  organization: {
    login: 'EtherealEngine',
    id: 107153800,
    node_id: 'O_kgDOBmMJiA',
    avatar_url: 'https://avatars.githubusercontent.com/u/107153800?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/EtherealEngine',
    html_url: 'https://github.com/EtherealEngine',
    followers_url: 'https://api.github.com/users/EtherealEngine/followers',
    following_url: 'https://api.github.com/users/EtherealEngine/following{/other_user}',
    gists_url: 'https://api.github.com/users/EtherealEngine/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/EtherealEngine/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/EtherealEngine/subscriptions',
    organizations_url: 'https://api.github.com/users/EtherealEngine/orgs',
    repos_url: 'https://api.github.com/users/EtherealEngine/repos',
    events_url: 'https://api.github.com/users/EtherealEngine/events{/privacy}',
    received_events_url: 'https://api.github.com/users/EtherealEngine/received_events',
    type: 'Organization',
    site_admin: false
  },
  network_count: 4,
  subscribers_count: 4
})

const getRepoCommits = () => [
  {
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
        html_url:
          'https://github.com/EtherealEngine/ee-ethereal-village/commit/bd8e415420052222a7953d149b1d5ba9153bc84a'
      }
    ]
  },
  {
    sha: 'bd8e415420052222a7953d149b1d5ba9153bc84a',
    node_id: 'C_kwDOJOElGdoAKGJkOGU0MTU0MjAwNTIyMjJhNzk1M2QxNDliMWQ1YmE5MTUzYmM4NGE',
    commit: {
      author: {
        name: 'HexaField',
        email: 'joshfield999@gmail.com',
        date: '2023-10-03T10:40:09Z'
      },
      committer: {
        name: 'HexaField',
        email: 'joshfield999@gmail.com',
        date: '2023-10-03T10:40:09Z'
      },
      message: 'update thumbnail and envmap',
      tree: {
        sha: '36134179a75fea30bd3889ef669c7b7273daf713',
        url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/trees/36134179a75fea30bd3889ef669c7b7273daf713'
      },
      url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/commits/bd8e415420052222a7953d149b1d5ba9153bc84a',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null
      }
    },
    url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/bd8e415420052222a7953d149b1d5ba9153bc84a',
    html_url: 'https://github.com/EtherealEngine/ee-ethereal-village/commit/bd8e415420052222a7953d149b1d5ba9153bc84a',
    comments_url:
      'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/bd8e415420052222a7953d149b1d5ba9153bc84a/comments',
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
        sha: 'f5e0f7175f4332bfefd358488e6bc61868efd90a',
        url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/f5e0f7175f4332bfefd358488e6bc61868efd90a',
        html_url:
          'https://github.com/EtherealEngine/ee-ethereal-village/commit/f5e0f7175f4332bfefd358488e6bc61868efd90a'
      }
    ]
  },
  {
    sha: 'f5e0f7175f4332bfefd358488e6bc61868efd90a',
    node_id: 'C_kwDOJOElGdoAKGY1ZTBmNzE3NWY0MzMyYmZlZmQzNTg0ODhlNmJjNjE4NjhlZmQ5MGE',
    commit: {
      author: {
        name: 'HexaField',
        email: 'joshfield999@gmail.com',
        date: '2023-09-25T05:06:03Z'
      },
      committer: {
        name: 'HexaField',
        email: 'joshfield999@gmail.com',
        date: '2023-09-25T05:06:03Z'
      },
      message: 'resave and update village',
      tree: {
        sha: 'e1b3e3e016968998d9acc4f50db7c0344b8128b9',
        url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/trees/e1b3e3e016968998d9acc4f50db7c0344b8128b9'
      },
      url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/git/commits/f5e0f7175f4332bfefd358488e6bc61868efd90a',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null
      }
    },
    url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/f5e0f7175f4332bfefd358488e6bc61868efd90a',
    html_url: 'https://github.com/EtherealEngine/ee-ethereal-village/commit/f5e0f7175f4332bfefd358488e6bc61868efd90a',
    comments_url:
      'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/f5e0f7175f4332bfefd358488e6bc61868efd90a/comments',
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
        sha: 'df334f5fd49eb554add117840559838c968d5be7',
        url: 'https://api.github.com/repos/EtherealEngine/ee-ethereal-village/commits/df334f5fd49eb554add117840559838c968d5be7',
        html_url:
          'https://github.com/EtherealEngine/ee-ethereal-village/commit/df334f5fd49eb554add117840559838c968d5be7'
      }
    ]
  }
]

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
