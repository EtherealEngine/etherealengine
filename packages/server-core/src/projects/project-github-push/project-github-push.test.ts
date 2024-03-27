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

import { projectGithubPushPath } from '@etherealengine/common/src/schemas/projects/project-github-push.schema'
import { ProjectType, projectPath } from '@etherealengine/common/src/schemas/projects/project.schema'
import { ScopeType } from '@etherealengine/common/src/schemas/scope/scope.schema'
import { avatarPath } from '@etherealengine/common/src/schemas/user/avatar.schema'
import { identityProviderPath } from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { UserApiKeyType, userApiKeyPath } from '@etherealengine/common/src/schemas/user/user-api-key.schema'
import { UserName, userPath } from '@etherealengine/common/src/schemas/user/user.schema'
import { destroyEngine } from '@etherealengine/ecs/src/Engine'
import assert from 'assert'
import { createHash } from 'crypto'
import nock from 'nock'
import { v4 as uuidv4 } from 'uuid'
import { Application } from '../../../declarations'
import { createFeathersKoaApp } from '../../createApp'

describe('project-github-push.test', () => {
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
    const name = ('test-project-destination-check-user-name-' + uuidv4()) as UserName

    const avatar = await app.service(avatarPath).create({
      name: 'test-project-destination-check-avatar-name-' + uuidv4()
    })

    const testUser = await app.service(userPath).create({
      name,
      avatarId: avatar.id,
      isGuest: false,
      scopes: [{ type: 'projects:write' as ScopeType }]
    })

    testUserApiKey = await app.service(userApiKeyPath).create({ userId: testUser.id })

    await app.service(identityProviderPath).create(
      {
        type: 'github',
        token: `test-token-${Math.round(Math.random() * 1000)}`,
        userId: testUser.id,
        oauthToken: `test-oauthtoken-${Math.round(Math.random() * 1000)}`
      },
      getParams()
    )
  })

  before(async () => {
    const projectName = `test-project-github-push-${uuidv4()}`
    testProject = await app
      .service(projectPath)
      .create({ name: projectName, repositoryPath: `https://github.com/test-user/${projectName}` })
  })

  beforeEach(() => {
    nock('https://api.github.com')
      .post(/\/repos.*\/git\/blobs.*/)
      .reply(201, getGitBlob())
      .persist()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  after(async () => {
    await app.service(projectPath).remove(testProject.id)
  })

  after(() => destroyEngine())

  it('should check for accessible repo', async () => {
    nock('https://api.github.com')
      .get(/\/repos.*/)
      .reply(200, getRepoData(testProject.name))
      .get(/\/repos.*\/branches.*/)
      .reply(404, { message: 'Branch not found' })
      .get(/\/repos.*/)
      .reply(200, getRepoData(testProject.name))
      .get(/\/repos.*\/git\/ref.*/)
      .reply(200, getGitRef())
      .post(/\/repos.*\/git\/ref.*/)
      .reply(201)
      .get(/\/repos.*\/git\/ref.*/)
      .reply(200, getGitRef())
      .get(/\/repos.*\/git\/commits.*/)
      .reply(200, getGitCommitData())
      .get(/\/user.*/)
      .times(2)
      .reply(200, getAuthenticatedUser('test-user'))
      .get(/\/repos.*\/git\/trees.*/)
      .reply(200, getGitTree())
      .post(/\/repos.*\/git\/trees.*/)
      .reply(201, getGitTree())
      .post(/\/repos.*\/git\/commits.*/)
      .reply(200, getGitCommitData())

    const pushedToGithubMockedApi = nock('https://api.github.com')
      .patch(/\/repos.*\/git\/ref.*/)
      .reply(200, getGitRef())

    await app.service(projectGithubPushPath).patch(testProject.id, null, getParams())

    const updatedProject = await app.service(projectPath).get(testProject.id)
    assert.notEqual(updatedProject.commitSHA, testProject.commitSHA)
    assert.notEqual(updatedProject.commitDate, testProject.commitDate)

    assert.ok(pushedToGithubMockedApi.isDone())
  })
})

const getRepoData = (repoName: string) => ({
  id: 618734873,
  node_id: 'R_kgDOJOElGQ',
  name: repoName,
  full_name: `EtherealEngine/${repoName}`,
  private: false,
  owner: {
    login: 'EtherealEngine',
    id: 107153800,
    node_id: 'O_kgDOBmMJiA',
    avatar_url: 'https://avatars.githubusercontent.com/u/107153800?v=4',
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
    type: 'Organization',
    site_admin: false
  },
  html_url: `https://github.com/test-user/${repoName}`,
  description: null,
  fork: false,
  url: `https://api.github.com/repos/test-user/${repoName}`,
  forks_url: `https://api.github.com/repos/test-user/${repoName}/forks`,
  keys_url: `https://api.github.com/repos/test-user/${repoName}/keys{/key_id}`,
  collaborators_url: `https://api.github.com/repos/test-user/${repoName}/collaborators{/collaborator}`,
  teams_url: `https://api.github.com/repos/test-user/${repoName}/teams`,
  hooks_url: `https://api.github.com/repos/test-user/${repoName}/hooks`,
  issue_events_url: `https://api.github.com/repos/test-user/${repoName}/issues/events{/number}`,
  events_url: `https://api.github.com/repos/test-user/${repoName}/events`,
  assignees_url: `https://api.github.com/repos/test-user/${repoName}/assignees{/user}`,
  branches_url: `https://api.github.com/repos/test-user/${repoName}/branches{/branch}`,
  tags_url: `https://api.github.com/repos/test-user/${repoName}/tags`,
  blobs_url: `https://api.github.com/repos/test-user/${repoName}/git/blobs{/sha}`,
  git_tags_url: `https://api.github.com/repos/test-user/${repoName}/git/tags{/sha}`,
  git_refs_url: `https://api.github.com/repos/test-user/${repoName}/git/refs{/sha}`,
  trees_url: `https://api.github.com/repos/test-user/${repoName}/git/trees{/sha}`,
  statuses_url: `https://api.github.com/repos/test-user/${repoName}/statuses/{sha}`,
  languages_url: `https://api.github.com/repos/test-user/${repoName}/languages`,
  stargazers_url: `https://api.github.com/repos/test-user/${repoName}/stargazers`,
  contributors_url: `https://api.github.com/repos/test-user/${repoName}/contributors`,
  subscribers_url: `https://api.github.com/repos/test-user/${repoName}/subscribers`,
  subscription_url: `https://api.github.com/repos/test-user/${repoName}/subscription`,
  commits_url: `https://api.github.com/repos/test-user/${repoName}/commits{/sha}`,
  git_commits_url: `https://api.github.com/repos/test-user/${repoName}/git/commits{/sha}`,
  comments_url: `https://api.github.com/repos/test-user/${repoName}/comments{/number}`,
  issue_comment_url: `https://api.github.com/repos/test-user/${repoName}/issues/comments{/number}`,
  contents_url: `https://api.github.com/repos/test-user/${repoName}/contents/{+path}`,
  compare_url: `https://api.github.com/repos/test-user/${repoName}/compare/{base}...{head}`,
  merges_url: `https://api.github.com/repos/test-user/${repoName}/merges`,
  archive_url: `https://api.github.com/repos/test-user/${repoName}/{archive_format}{/ref}`,
  downloads_url: `https://api.github.com/repos/test-user/${repoName}/downloads`,
  issues_url: `https://api.github.com/repos/test-user/${repoName}/issues{/number}`,
  pulls_url: `https://api.github.com/repos/test-user/${repoName}/pulls{/number}`,
  milestones_url: `https://api.github.com/repos/test-user/${repoName}/milestones{/number}`,
  notifications_url: `https://api.github.com/repos/test-user/${repoName}/notifications{?since,all,participating}`,
  labels_url: `https://api.github.com/repos/test-user/${repoName}/labels{/name}`,
  releases_url: `https://api.github.com/repos/test-user/${repoName}/releases{/id}`,
  deployments_url: `https://api.github.com/repos/test-user/${repoName}/deployments`,
  created_at: '2023-03-25T07:31:50Z',
  updated_at: '2023-04-13T10:21:48Z',
  pushed_at: '2023-11-30T20:48:23Z',
  git_url: 'git://github.com/test-user/${repoName}.git',
  ssh_url: 'git@github.com:test-user/${repoName}.git',
  clone_url: 'https://github.com/test-user/${repoName}.git',
  svn_url: 'https://github.com/test-user/${repoName}',
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
    login: 'test-user',
    id: 107153800,
    node_id: 'O_kgDOBmMJiA',
    avatar_url: 'https://avatars.githubusercontent.com/u/107153800?v=4',
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
    type: 'Organization',
    site_admin: false
  },
  network_count: 4,
  subscribers_count: 4
})

const getGitRef = () => ({
  ref: 'refs/heads/featureA',
  node_id: 'MDM6UmVmcmVmcy9oZWFkcy9mZWF0dXJlQQ==',
  url: 'https://api.github.com/repos/octocat/Hello-World/git/refs/heads/featureA',
  object: {
    type: 'commit',
    sha: createHash('sha256').update(uuidv4()).digest('hex'),
    url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd'
  }
})

const getGitCommitData = () => ({
  sha: createHash('sha256').update(uuidv4()).digest('hex'),
  node_id: 'MDY6Q29tbWl0NmRjYjA5YjViNTc4NzVmMzM0ZjYxYWViZWQ2OTVlMmU0MTkzZGI1ZQ==',
  url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd',
  html_url: 'https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd',
  author: {
    date: '2014-11-07T22:01:45Z',
    name: 'Monalisa Octocat',
    email: 'octocat@github.com'
  },
  committer: {
    date: '2014-11-07T22:01:45Z',
    name: 'Monalisa Octocat',
    email: 'octocat@github.com'
  },
  message: 'added readme, because im a good github citizen',
  tree: {
    url: 'https://api.github.com/repos/octocat/Hello-World/git/trees/691272480426f78a0138979dd3ce63b77f706feb',
    sha: createHash('sha256').update(uuidv4()).digest('hex')
  },
  parents: [
    {
      url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/1acc419d4d6a9ce985db7be48c6349a0475975b5',
      sha: '1acc419d4d6a9ce985db7be48c6349a0475975b5',
      html_url: 'https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd'
    }
  ],
  verification: {
    verified: false,
    reason: 'unsigned',
    signature: null,
    payload: null
  }
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

const getGitBlob = () => {
  const createdHash = createHash('sha256').update(uuidv4()).digest('hex')
  return {
    url: `https://api.github.com/repos/test-user/example/git/blobs/${createdHash}`,
    sha: createdHash
  }
}

const getGitTree = () => {
  const sha1 = createHash('sha256').update(uuidv4()).digest('hex')
  const sha2 = createHash('sha256').update(uuidv4()).digest('hex')
  const sha3 = createHash('sha256').update(uuidv4()).digest('hex')
  const sha4 = createHash('sha256').update(uuidv4()).digest('hex')

  return {
    sha: sha1,
    url: `https://api.github.com/repos/octocat/Hello-World/trees/${sha1}`,
    tree: [
      {
        path: 'file.rb',
        mode: '100644',
        type: 'blob',
        size: 30,
        sha: sha2,
        url: `https://api.github.com/repos/octocat/Hello-World/git/blobs/${sha2}`
      }
    ],
    truncated: false
  }
}
