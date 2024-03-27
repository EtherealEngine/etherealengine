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

import { projectBranchesPath } from '@etherealengine/common/src/schemas/projects/project-branches.schema'
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

describe('project-branches.test', () => {
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
    const name = ('test-project-branches-user-name-' + uuidv4()) as UserName

    const avatar = await app.service(avatarPath).create({
      name: 'test-project-branches-avatar-name-' + uuidv4()
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

  it('should get the project branches', async () => {
    nock('https://api.github.com')
      .get(/\/repos.*/)
      .reply(200, getGithubRepositories())

    nock('https://api.github.com')
      .get(/\/branches.*/)
      .reply(200, getGithubListBranches())

    const result = await app.service(projectBranchesPath).get('https://github.com/test-user/test-repo', getParams())

    assert.ok(result.branches)
    assert.equal(result.branches[0].name, 'test-branch-name')
  })
})

const getGithubRepositories = () => ({
  id: 1296269,
  node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
  name: 'test-repo',
  full_name: 'test-user/test-repo',
  owner: {
    login: 'test-user',
    id: 1,
    node_id: 'MDQ6VXNlcjE=',
    avatar_url: 'https://github.com/images/error/octocat_happy.gif',
    gravatar_id: '',
    url: 'https://api.github.com/users/test-user',
    html_url: 'https://github.com/test-user',
    followers_url: 'https://api.github.com/users/test-user/followers',
    following_url: 'https://api.github.com/users/test-user/following{/other_user}',
    gists_url: 'https://api.github.com/users/test-user/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/test-user/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/test-user/subscriptions',
    organizations_url: 'https://api.github.com/users/test-user/orgs',
    repos_url: 'https://api.github.com/users/test-user/repos',
    events_url: 'https://api.github.com/users/test-user/events{/privacy}',
    received_events_url: 'https://api.github.com/users/test-user/received_events',
    type: 'User',
    site_admin: false
  },
  private: false,
  html_url: 'https://github.com/test-user/test-repo',
  description: 'This your first repo!',
  fork: false,
  url: 'https://api.github.com/repos/test-user/test-repo',
  archive_url: 'https://api.github.com/repos/test-user/test-repo/{archive_format}{/ref}',
  assignees_url: 'https://api.github.com/repos/test-user/test-repo/assignees{/user}',
  blobs_url: 'https://api.github.com/repos/test-user/test-repo/git/blobs{/sha}',
  branches_url: 'https://api.github.com/repos/test-user/test-repo/branches{/branch}',
  collaborators_url: 'https://api.github.com/repos/test-user/test-repo/collaborators{/collaborator}',
  comments_url: 'https://api.github.com/repos/test-user/test-repo/comments{/number}',
  commits_url: 'https://api.github.com/repos/test-user/test-repo/commits{/sha}',
  compare_url: 'https://api.github.com/repos/test-user/test-repo/compare/{base}...{head}',
  contents_url: 'https://api.github.com/repos/test-user/test-repo/contents/{+path}',
  contributors_url: 'https://api.github.com/repos/test-user/test-repo/contributors',
  deployments_url: 'https://api.github.com/repos/test-user/test-repo/deployments',
  downloads_url: 'https://api.github.com/repos/test-user/test-repo/downloads',
  events_url: 'https://api.github.com/repos/test-user/test-repo/events',
  forks_url: 'https://api.github.com/repos/test-user/test-repo/forks',
  git_commits_url: 'https://api.github.com/repos/test-user/test-repo/git/commits{/sha}',
  git_refs_url: 'https://api.github.com/repos/test-user/test-repo/git/refs{/sha}',
  git_tags_url: 'https://api.github.com/repos/test-user/test-repo/git/tags{/sha}',
  git_url: 'git:github.com/test-user/test-repo.git',
  issue_comment_url: 'https://api.github.com/repos/test-user/test-repo/issues/comments{/number}',
  issue_events_url: 'https://api.github.com/repos/test-user/test-repo/issues/events{/number}',
  issues_url: 'https://api.github.com/repos/test-user/test-repo/issues{/number}',
  keys_url: 'https://api.github.com/repos/test-user/test-repo/keys{/key_id}',
  labels_url: 'https://api.github.com/repos/test-user/test-repo/labels{/name}',
  languages_url: 'https://api.github.com/repos/test-user/test-repo/languages',
  merges_url: 'https://api.github.com/repos/test-user/test-repo/merges',
  milestones_url: 'https://api.github.com/repos/test-user/test-repo/milestones{/number}',
  notifications_url: 'https://api.github.com/repos/test-user/test-repo/notifications{?since,all,participating}',
  pulls_url: 'https://api.github.com/repos/test-user/test-repo/pulls{/number}',
  releases_url: 'https://api.github.com/repos/test-user/test-repo/releases{/id}',
  ssh_url: 'git@github.com:test-user/test-repo.git',
  stargazers_url: 'https://api.github.com/repos/test-user/test-repo/stargazers',
  statuses_url: 'https://api.github.com/repos/test-user/test-repo/statuses/{sha}',
  subscribers_url: 'https://api.github.com/repos/test-user/test-repo/subscribers',
  subscription_url: 'https://api.github.com/repos/test-user/test-repo/subscription',
  tags_url: 'https://api.github.com/repos/test-user/test-repo/tags',
  teams_url: 'https://api.github.com/repos/test-user/test-repo/teams',
  trees_url: 'https://api.github.com/repos/test-user/test-repo/git/trees{/sha}',
  clone_url: 'https://github.com/test-user/test-repo.git',
  mirror_url: 'git:git.example.com/test-user/test-repo',
  hooks_url: 'https://api.github.com/repos/test-user/test-repo/hooks',
  svn_url: 'https://svn.github.com/test-user/test-repo',
  homepage: 'https://github.com',
  language: null,
  forks_count: 9,
  stargazers_count: 80,
  watchers_count: 80,
  size: 108,
  default_branch: 'master',
  open_issues_count: 0,
  is_template: false,
  topics: ['test-user', 'atom', 'electron', 'api'],
  has_issues: true,
  has_projects: true,
  has_wiki: true,
  has_pages: false,
  has_downloads: true,
  has_discussions: false,
  archived: false,
  disabled: false,
  visibility: 'public',
  pushed_at: '2011-01-26T19:06:43Z',
  created_at: '2011-01-26T19:01:12Z',
  updated_at: '2011-01-26T19:14:43Z',
  permissions: {
    admin: false,
    push: false,
    pull: true
  },
  security_and_analysis: {
    advanced_security: {
      status: 'enabled'
    },
    secret_scanning: {
      status: 'enabled'
    },
    secret_scanning_push_protection: {
      status: 'disabled'
    }
  }
})

const getGithubListBranches = () => [
  {
    name: 'test-branch-name',
    commit: {
      sha: 'c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc',
      url: 'https://api.github.com/repos/test-user/test-repo/commits/c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc'
    },
    protected: true,
    protection: {
      required_status_checks: {
        enforcement_level: 'non_admins',
        contexts: ['ci-test', 'linter']
      }
    },
    protection_url: 'https://api.github.com/repos/test-user/test-repo/branches/master/protection'
  }
]
