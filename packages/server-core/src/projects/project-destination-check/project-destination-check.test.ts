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

import { projectDestinationCheckPath } from '@etherealengine/common/src/schemas/projects/project-destination-check.schema'
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

describe('project-destination-check.test', () => {
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
    const name = ('test-project-destination-check-user-name-' + uuidv4()) as UserName

    const avatar = await app.service(avatarPath).create({
      name: 'test-project-destination-check-avatar-name-' + uuidv4()
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

  it('should check for accessible repo', async () => {
    nock('https://api.github.com')
      .get(/\/user.*/)
      .reply(200, getAuthenticatedUser('test-non-owner'))
      .get(/\/user.*\/repos.*/)
      .reply(200, [])

    const result = await app
      .service(projectDestinationCheckPath)
      .get('https://github.com/EtherealEngine/ee-ethereal-village', getParams())

    assert.ok(result)
    assert.ok(result.error)
  })

  it('should check for empty project repository', async () => {
    nock('https://api.github.com')
      .get(/\/user.*/)
      .reply(200, getAuthenticatedUser('EtherealEngine'))
      .get(/\/user.*\/repos.*/)
      .reply(200, getUserRepos())
      .get(/\/repos.*\/contents\/*/)
      .reply(404)

    const result = await app
      .service(projectDestinationCheckPath)
      .get('https://github.com/EtherealEngine/ee-ethereal-village', getParams())

    assert.ok(result)
    assert.equal(result.destinationValid, true)
    assert.equal(result.repoEmpty, true)
  })

  it('should check if the destination project and existing project are same', async () => {
    nock('https://api.github.com')
      .get(/\/user.*/)
      .reply(200, getAuthenticatedUser('EtherealEngine'))
      .get(/\/user.*\/repos.*/)
      .reply(200, getUserRepos())
      .get(/\/repos.*\/contents\/*/)
      .reply(200, getRepoPackageJson1())
      .get(/\/repos.*\/contents\/*/)
      .reply(200, getRepoPackageJson2())

    const result = await app
      .service(projectDestinationCheckPath)
      .get('https://github.com/EtherealEngine/ee-ethereal-village', {
        query: {
          inputProjectURL: 'https://github.com/EtherealEngine/ee-bot'
        },
        ...getParams()
      })

    assert.ok(result)
    assert.ok(result.error)
  })

  it('should check destination match', async () => {
    nock('https://api.github.com')
      .get(/\/user.*/)
      .reply(200, getAuthenticatedUser('EtherealEngine'))
      .get(/\/user.*\/repos.*/)
      .reply(200, getUserRepos())
      .get(/\/repos.*\/contents\/*/)
      .reply(200, getRepoPackageJson1())
      .get(/\/repos.*\/contents\/*/)
      .reply(200, getRepoPackageJson1())

    const result = await app
      .service(projectDestinationCheckPath)
      .get('https://github.com/EtherealEngine/ee-ethereal-village', {
        query: {
          inputProjectURL: 'https://github.com/EtherealEngine/ee-ethereal-village'
        },
        ...getParams()
      })

    assert.ok(result)
    assert.equal(result.destinationValid, true)
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

const getUserRepos = () => [
  {
    id: 501798315,
    node_id: 'R_kgDOHejVqw',
    name: '.github',
    full_name: 'EtherealEngine/.github',
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
    html_url: 'https://github.com/EtherealEngine/.github',
    description: null,
    fork: false,
    url: 'https://api.github.com/repos/EtherealEngine/.github',
    forks_url: 'https://api.github.com/repos/EtherealEngine/.github/forks',
    keys_url: 'https://api.github.com/repos/EtherealEngine/.github/keys{/key_id}',
    collaborators_url: 'https://api.github.com/repos/EtherealEngine/.github/collaborators{/collaborator}',
    teams_url: 'https://api.github.com/repos/EtherealEngine/.github/teams',
    hooks_url: 'https://api.github.com/repos/EtherealEngine/.github/hooks',
    issue_events_url: 'https://api.github.com/repos/EtherealEngine/.github/issues/events{/number}',
    events_url: 'https://api.github.com/repos/EtherealEngine/.github/events',
    assignees_url: 'https://api.github.com/repos/EtherealEngine/.github/assignees{/user}',
    branches_url: 'https://api.github.com/repos/EtherealEngine/.github/branches{/branch}',
    tags_url: 'https://api.github.com/repos/EtherealEngine/.github/tags',
    blobs_url: 'https://api.github.com/repos/EtherealEngine/.github/git/blobs{/sha}',
    git_tags_url: 'https://api.github.com/repos/EtherealEngine/.github/git/tags{/sha}',
    git_refs_url: 'https://api.github.com/repos/EtherealEngine/.github/git/refs{/sha}',
    trees_url: 'https://api.github.com/repos/EtherealEngine/.github/git/trees{/sha}',
    statuses_url: 'https://api.github.com/repos/EtherealEngine/.github/statuses/{sha}',
    languages_url: 'https://api.github.com/repos/EtherealEngine/.github/languages',
    stargazers_url: 'https://api.github.com/repos/EtherealEngine/.github/stargazers',
    contributors_url: 'https://api.github.com/repos/EtherealEngine/.github/contributors',
    subscribers_url: 'https://api.github.com/repos/EtherealEngine/.github/subscribers',
    subscription_url: 'https://api.github.com/repos/EtherealEngine/.github/subscription',
    commits_url: 'https://api.github.com/repos/EtherealEngine/.github/commits{/sha}',
    git_commits_url: 'https://api.github.com/repos/EtherealEngine/.github/git/commits{/sha}',
    comments_url: 'https://api.github.com/repos/EtherealEngine/.github/comments{/number}',
    issue_comment_url: 'https://api.github.com/repos/EtherealEngine/.github/issues/comments{/number}',
    contents_url: 'https://api.github.com/repos/EtherealEngine/.github/contents/{+path}',
    compare_url: 'https://api.github.com/repos/EtherealEngine/.github/compare/{base}...{head}',
    merges_url: 'https://api.github.com/repos/EtherealEngine/.github/merges',
    archive_url: 'https://api.github.com/repos/EtherealEngine/.github/{archive_format}{/ref}',
    downloads_url: 'https://api.github.com/repos/EtherealEngine/.github/downloads',
    issues_url: 'https://api.github.com/repos/EtherealEngine/.github/issues{/number}',
    pulls_url: 'https://api.github.com/repos/EtherealEngine/.github/pulls{/number}',
    milestones_url: 'https://api.github.com/repos/EtherealEngine/.github/milestones{/number}',
    notifications_url: 'https://api.github.com/repos/EtherealEngine/.github/notifications{?since,all,participating}',
    labels_url: 'https://api.github.com/repos/EtherealEngine/.github/labels{/name}',
    releases_url: 'https://api.github.com/repos/EtherealEngine/.github/releases{/id}',
    deployments_url: 'https://api.github.com/repos/EtherealEngine/.github/deployments',
    created_at: '2022-06-09T20:24:08Z',
    updated_at: '2022-06-09T20:24:08Z',
    pushed_at: '2023-11-01T07:08:18Z',
    git_url: 'git://github.com/EtherealEngine/.github.git',
    ssh_url: 'git@github.com:EtherealEngine/.github.git',
    clone_url: 'https://github.com/EtherealEngine/.github.git',
    svn_url: 'https://github.com/EtherealEngine/.github',
    homepage: null,
    size: 12,
    stargazers_count: 0,
    watchers_count: 0,
    language: null,
    has_issues: true,
    has_projects: true,
    has_downloads: true,
    has_wiki: true,
    has_pages: false,
    has_discussions: false,
    forks_count: 0,
    mirror_url: null,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
    allow_forking: true,
    is_template: false,
    web_commit_signoff_required: false,
    topics: ['engine'],
    visibility: 'public',
    forks: 0,
    open_issues: 0,
    watchers: 0,
    default_branch: 'main',
    permissions: {
      admin: true
    }
  },
  {
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
    subscribers_count: 4,
    permissions: {
      push: true,
      admin: false,
      maintain: true
    }
  }
]

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
