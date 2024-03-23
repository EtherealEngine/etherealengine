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

import { BadRequest, Forbidden } from '@feathersjs/errors'
import { Octokit } from '@octokit/rest'
import appRootPath from 'app-root-path'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'

import { GITHUB_PER_PAGE, GITHUB_URL_REGEX } from '@etherealengine/common/src/constants/GitHubConstants'
import {
  AudioFileTypes,
  BinaryFileTypes,
  ImageFileTypes,
  ModelFileTypes,
  VideoFileTypes,
  VolumetricFileTypes
} from '@etherealengine/engine/src/assets/constants/fileTypes'

import { apiJobPath } from '@etherealengine/common/src/schemas/cluster/api-job.schema'
import { ProjectType, projectPath } from '@etherealengine/common/src/schemas/projects/project.schema'
import {
  IdentityProviderType,
  identityProviderPath
} from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { UserType } from '@etherealengine/common/src/schemas/user/user.schema'
import { getDateTimeSql, toDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import { deleteFolderRecursive, writeFileSyncRecursive } from '@etherealengine/common/src/utils/fsHelperFunctions'
import { Paginated } from '@feathersjs/feathers'
import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import config from '../../appconfig'
import { getFileKeysRecursive } from '../../media/storageprovider/storageProviderUtils'
import { getStorageProvider } from '../../media/storageprovider/storageprovider'
import { useGit } from '../../util/gitHelperFunctions'
import { createExecutorJob, getProjectPushJobBody } from './project-helper'
import { ProjectParams } from './project.class'

// 30 MB. GitHub's documentation says that the blob upload cutoff is 50MB, but in testing some files that were around
// 40 MB were throwing server errors when uploaded as blobs, so this was made well below that to avoid issues.
const GITHUB_LFS_FLOOR = 30 * 1000 * 1000
const TOKEN_REGEX = /"RemoteAuth ([0-9a-zA-Z-_]+)"/
const OID_REGEX = /oid sha256:([0-9a-fA-F]{64})/
const PUSH_TIMEOUT = 60 * 10 //10 minute timeout on GitHub push jobs completing or failing

export const getAuthenticatedRepo = async (token: string, repositoryPath: string) => {
  try {
    if (!/.git$/.test(repositoryPath)) repositoryPath = repositoryPath + '.git'
    const user = await getUser(token)
    return repositoryPath.replace('https://', `https://${user.data.login}:${token}@`)
  } catch (error) {
    logger.error(error)
    return undefined
  }
}

export const getUser = async (token: string) => {
  const octoKit = new Octokit({ auth: token })
  return octoKit.rest.users.getAuthenticated() as any
}

export const checkUserRepoWriteStatus = async (owner, repo, token): Promise<number> => {
  const userApp = new Octokit({ auth: token })
  try {
    const { data } = await userApp.rest.repos.get({
      owner,
      repo
    })
    if (!data.permissions) return 403
    return data.permissions.push || data.permissions.admin ? 200 : 403
  } catch (err) {
    logger.error(err, 'Error getting repo')
    return err.status
  }
}

export const checkUserOrgWriteStatus = async (org, token) => {
  const octo = new Octokit({ auth: token })
  try {
    const authUser = await octo.rest.users.getAuthenticated()
    if (org === authUser.data.login) return 200
    const { data } = await octo.rest.orgs.getMembershipForAuthenticatedUser({
      org
    })
    return data.role === 'admin' || data.role === 'member' ? 200 : 403
  } catch (err) {
    logger.error(err, 'Org does not exist')
    return err.status
  }
}

export const checkAppOrgStatus = async (organization, token) => {
  const octo = new Octokit({ auth: token })
  const authUser = await octo.rest.users.getAuthenticated()
  if (organization === authUser.data.login) return 200
  const orgs = await getUserOrgs(token)
  return orgs.find((org) => org.login.toLowerCase() === organization.toLowerCase())
}

export const getUserRepos = async (token?: string): Promise<any[]> => {
  let page = 1
  let end = false
  let repos = []
  const octoKit = new Octokit({ auth: token })
  while (!end) {
    const repoResponse = (await octoKit.rest.repos.listForAuthenticatedUser({
      per_page: GITHUB_PER_PAGE,
      page
    })) as any
    repos = repos.concat(repoResponse.data)
    page++
    if (repoResponse.data.length < GITHUB_PER_PAGE) end = true
  }
  return repos
}

export const getUserOrgs = async (token: string): Promise<any[]> => {
  let page = 1
  let end = false
  let orgs = []
  const octoKit = new Octokit({ auth: token })
  while (!end) {
    const repoResponse = (await octoKit.rest.orgs.listForAuthenticatedUser({
      per_page: GITHUB_PER_PAGE,
      page
    })) as any
    orgs = orgs.concat(repoResponse.data)
    page++
    if (repoResponse.data.length < GITHUB_PER_PAGE) end = true
  }
  return orgs
}

export const getRepo = async (owner: string, repo: string, token: string): Promise<any> => {
  const octoKit = new Octokit({ auth: token })
  const repoResponse = await octoKit.rest.repos.get({ owner, repo })
  return repoResponse.data.html_url
}

export const pushProject = async (
  app: Application,
  project: ProjectType,
  user: UserType,
  reset = false,
  commitSHA?: string,
  jobId?: string,
  storageProviderName?: string
) => {
  const storageProvider = getStorageProvider(storageProviderName)
  try {
    logger.info(`[ProjectPush]: Getting files for project "${project.name}"...`)
    let files = await getFileKeysRecursive(`projects/${project.name}/`)
    files = files.filter((file) => /\.\w+$/.test(file))
    logger.info('[ProjectPush]: Found files:' + files)

    const localProjectDirectory = path.join(appRootPath.path, 'packages/projects/projects', project.name)
    if (fs.existsSync(localProjectDirectory)) {
      logger.info('[Project temp debug]: fs exists, deleting')
      deleteFolderRecursive(localProjectDirectory)
    }

    await Promise.all(
      files.map(async (filePath) => {
        logger.info(`[ProjectLoader]: - downloading "${filePath}"`)
        const fileResult = await storageProvider.getObject(filePath)
        if (fileResult.Body.length === 0) logger.info(`[ProjectLoader]: WARNING file "${filePath}" is empty`)
        writeFileSyncRecursive(path.join(appRootPath.path, 'packages/projects', filePath), fileResult.Body)
      })
    )
    const repoPath = project.repositoryPath.toLowerCase()

    const githubIdentityProvider = (await app.service(identityProviderPath).find({
      query: {
        userId: user.id,
        type: 'github',
        $limit: 1
      }
    })) as Paginated<IdentityProviderType>

    const githubPathRegexExec = GITHUB_URL_REGEX.exec(repoPath)
    if (!githubPathRegexExec) throw new BadRequest('Invalid Github URL')
    const split = githubPathRegexExec[2].split('/')
    const owner = split[0]
    const repo = split[1].replace('.git', '')

    if (githubIdentityProvider.data.length === 0 || !githubIdentityProvider.data[0].oauthToken)
      throw new Forbidden('You must log out and log back in with Github to refresh the token, and then try again.')

    const octoKit = new Octokit({ auth: githubIdentityProvider.data[0].oauthToken })
    if (!octoKit) return
    try {
      await octoKit.rest.repos.get({
        owner,
        repo
      })
    } catch (err) {
      if (err.status === 404) {
        const authUser = await octoKit.rest.users.getAuthenticated()
        if (authUser.data.login === owner)
          await octoKit.repos.createForAuthenticatedUser({
            name: repo,
            auto_init: true
          })
        else await octoKit.repos.createInOrg({ org: owner, name: repo, auto_init: true })
      } else throw err
    }
    const deploymentBranch = `${config.server.releaseName}-deployment`
    if (reset) {
      const projectDirectory = path.resolve(appRootPath.path, `packages/projects/projects/${project.name}/`)
      const git = useGit(projectDirectory)
      try {
        await git.init(true)
      } catch (e) {
        logger.warn(e)
      }
      if (commitSHA) git.checkout(commitSHA)
      await git.checkoutLocalBranch(deploymentBranch)
      await git.push('origin', deploymentBranch, ['-f'])
    } else
      await uploadToRepo(
        octoKit,
        files,
        owner,
        repo,
        deploymentBranch,
        project,
        githubIdentityProvider.data[0].oauthToken,
        app
      )
    if (jobId) {
      const date = await getDateTimeSql()
      await app.service(apiJobPath).patch(jobId, {
        status: 'succeeded',
        endTime: date
      })
    }
  } catch (err) {
    if (jobId) {
      const date = await getDateTimeSql()
      await app.service(apiJobPath).patch(jobId, {
        status: 'failed',
        returnData: err.toString(),
        endTime: date
      })
    }
    logger.error(err)
    throw err
  }
}

export const pushProjectToGithub = async (
  app: Application,
  project: ProjectType,
  user: UserType,
  reset = false,
  commitSHA?: string,
  storageProviderName?: string,
  isJob = false,
  jobId = undefined
) => {
  if (!config.kubernetes.enabled || isJob)
    return pushProject(app, project, user, reset, commitSHA, jobId, storageProviderName)
  else {
    const projectName = project.name.toLowerCase()

    const date = await getDateTimeSql()
    const newJob = await app.service(apiJobPath).create({
      name: '',
      startTime: date,
      endTime: date,
      returnData: '',
      status: 'pending'
    })
    const jobBody = await getProjectPushJobBody(app, project, user, reset, newJob.id, commitSHA)
    await app.service(apiJobPath).patch(newJob.id, {
      name: jobBody.metadata!.name
    })
    const jobLabelSelector = `etherealengine/projectField=${project.name},etherealengine/release=${process.env.RELEASE_NAME},etherealengine/projectPusher=true`
    const jobFinishedPromise = createExecutorJob(app, jobBody, jobLabelSelector, PUSH_TIMEOUT, newJob.id)
    try {
      await jobFinishedPromise
      return
    } catch (err) {
      console.log('Error: project did not exist after completing update', projectName, err)
      throw new BadRequest('Project did not exist after completing update')
    }
  }
}

// Credit to https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0
// for much of the following code.
const uploadToRepo = async (
  octo: Octokit,
  filePaths: string[],
  org: string,
  repo: string,
  branch = `main`,
  project: ProjectType,
  token: string,
  app: Application
) => {
  const projectDirectory = path.resolve(appRootPath.path, `packages/projects/projects/${project.name}/`)
  const git = useGit(projectDirectory)
  let currentCommit
  try {
    currentCommit = await getCurrentCommit(octo, org, repo, branch)
  } catch (err) {
    if (err.status === 409 && err.message === 'Git Repository is empty.') {
      await octo.repos.createOrUpdateFileContents({
        owner: org,
        repo,
        path: 'README.md',
        message: 'Initial commit',
        content: 'ZHVtbXk=',
        branch: 'main'
      })
      currentCommit = await getCurrentCommit(octo, org, repo, branch)
    } else throw err
  }
  //Get the GH user for use in commit message
  const user = (await octo.users.getAuthenticated()).data
  //Create blobs from all the files
  const fileBlobs = [] as { url: string; sha: string }[]
  const repoPath = `https://github.com/${org}/${repo}`
  const authenticatedRepo = await getAuthenticatedRepo(token, repoPath)
  const lfsFiles = [] as string[]
  const gitattributesIndex = filePaths.indexOf('.gitattributes')
  if (gitattributesIndex > -1) filePaths = filePaths.splice(gitattributesIndex, 1)
  for (let path of filePaths) {
    const blob = await createBlobForFile(octo, org, repo, git, branch, lfsFiles, authenticatedRepo)(path, project.name)
    fileBlobs.push(blob)
  }
  //LFS files need to be included in a .gitattributes file at the top of the repo in order to be populated properly.
  //If the file exists because there's at least one file now in LFS, but it's not already in the list of files in
  //the repo, then make the blob for it and add to the tree.
  const gitattributesPath = path.join(projectDirectory, '.gitattributes')
  const gitAttributesFilePath = `projects/${project.name}/.gitattributes`
  let gitattributesContent = ''
  if (lfsFiles.length > 0) {
    for (let lfsFile of lfsFiles)
      gitattributesContent += `${lfsFile.replace(/ /g, '[[:space:]]')} filter=lfs diff=lfs merge=lfs -text\n`
    await fs.writeFileSync(gitattributesPath, gitattributesContent)
  }
  if (lfsFiles.length > 0) {
    const blob = await createBlobForFile(
      octo,
      org,
      repo,
      git,
      branch,
      lfsFiles,
      authenticatedRepo
    )(gitAttributesFilePath, project.name)
    fileBlobs.push(blob)
    filePaths.push(gitAttributesFilePath)
  }
  // Create a new tree from all of the files, so that a new commit can be made from it
  const newTree = await createNewTree(
    octo,
    org,
    repo,
    fileBlobs,
    filePaths.map((path) => path.replace(`projects/${project.name}/`, '')),
    currentCommit.treeSha
  )
  const date = Date.now()
  const commitMessage = `Update by ${user.login} at ${new Date(date).toJSON()}`
  //Create the new commit with all of the file changes
  const newCommit = await createNewCommit(octo, org, repo, commitMessage, newTree.sha, currentCommit.commitSha)

  await app
    .service(projectPath)
    .patch(project.id, { commitSHA: newCommit.sha, commitDate: toDateTimeSql(new Date()), hasLocalChanges: false })

  try {
    //This pushes the commit to the main branch in GitHub
    await setBranchToCommit(octo, org, repo, branch, newCommit.sha)
  } catch (err) {
    // Couldn't push directly to branch for some reason, so making a new branch and opening a PR instead
    await octo.git.createRef({
      owner: org,
      repo,
      ref: `refs/heads/${user.login}-${date}`,
      sha: newCommit.sha
    })
    await octo.pulls.create({
      owner: org,
      repo,
      head: `refs/heads/${user.login}-${date}`,
      base: `refs/heads/${branch}`,
      title: commitMessage
    })
  }
}
export const getCurrentCommit = async (octo: Octokit, org: string, repo: string, branch = 'main') => {
  try {
    await octo.repos.getBranch({ owner: org, repo, branch })
  } catch (err) {
    // If the branch for this deployment somehow doesn't exist, push the default branch to it so it exists
    if (err.status === 404 && err.message === 'Branch not found') {
      const repoResult = await octo.repos.get({ owner: org, repo })
      const baseBranchRef = await octo.git.getRef({
        owner: org,
        repo,
        ref: `heads/${repoResult.data.default_branch}`
      })
      await octo.git.createRef({
        owner: org,
        repo,
        ref: `refs/heads/${branch}`,
        sha: baseBranchRef.data.object.sha
      })
    } else throw err
  }
  const { data: refData } = await octo.git.getRef({
    owner: org,
    repo,
    ref: `heads/${branch}`
  })
  const commitSha = refData.object.sha
  const { data: commitData } = await octo.git.getCommit({
    owner: org,
    repo,
    commit_sha: commitSha
  })
  return {
    commitSha,
    treeSha: commitData.tree.sha
  }
}

export const getGithubOwnerRepo = (url: string) => {
  url = url.toLowerCase()

  const githubPathRegexExec = GITHUB_URL_REGEX.exec(url)
  if (!githubPathRegexExec)
    return {
      error: 'invalidUrl',
      text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
    }
  const split = githubPathRegexExec[2].split('/')
  if (!split[0] || !split[1])
    return {
      error: 'invalidUrl',
      text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
    }
  const owner = split[0]
  const repo = split[1].replace('.git', '')
  return {
    owner,
    repo
  }
}

export const getOctokitForChecking = async (app: Application, url: string, params: ProjectParams) => {
  url = url.toLowerCase()

  const githubIdentityProvider = (await app.service(identityProviderPath).find({
    query: {
      userId: params!.user!.id,
      type: 'github',
      $limit: 1
    }
  })) as Paginated<IdentityProviderType>

  if (githubIdentityProvider.data.length === 0)
    throw new Forbidden('You must have a connected GitHub account to access public repos')
  const { owner, repo } = getGithubOwnerRepo(url)
  const octoKit = new Octokit({ auth: githubIdentityProvider.data[0].oauthToken })
  return {
    owner,
    repo,
    octoKit,
    token: githubIdentityProvider.data[0].oauthToken
  }
}

const createBlobForFile =
  (octo: Octokit, org: string, repo: string, git: any, branch: string, lfsFiles = [] as string[], repoPath?: string) =>
  async (filePath: string, projectName: string) => {
    let encoding = (isBase64Encoded(filePath) ? 'base64' : 'utf-8') as BufferEncoding
    const rootPath = path.join(appRootPath.path, 'packages/projects', filePath)
    const bytes = fs.readFileSync(rootPath, 'binary')
    const buffer = Buffer.from(bytes, 'binary')
    let content
    if (buffer.length > GITHUB_LFS_FLOOR) {
      const lfsEndpoint = `${repoPath}/info/lfs`
      const trimPath = filePath.replace(`projects/${projectName}/`, '')
      lfsFiles.push(trimPath)
      const lfsPointer = await git.raw(['lfs', 'pointer', `--file=${rootPath}`])
      const oidRegexExec = OID_REGEX.exec(lfsPointer)
      const oid = oidRegexExec![1]
      const body = {
        operation: 'upload',
        transfers: ['basic'],
        ref: {
          name: `refs/heads/${branch}`
        },
        objects: [
          {
            oid,
            size: buffer.length
          }
        ],
        hash_algo: 'sha256'
      }
      const batchResponse = await fetch(`${lfsEndpoint}/objects/batch`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Accept: 'application/vnd.git-lfs+json',
          'Content-Type': 'application/vnd.git-lfs+json'
        }
      })
      const resData = JSON.parse(Buffer.from(await batchResponse.arrayBuffer()).toString())
      const actions = resData.objects[0].actions
      //If the exact object already exists in LFS, the response will not have any actions field, to indicate that
      //it does not need to be uploaded again.
      if (actions) {
        const uploadActions = actions.upload
        const verifyActions = actions.verify
        await fetch(uploadActions.href, {
          method: 'PUT',
          headers: uploadActions.header,
          body: buffer
        })
        //If a verify action is returned, it is seemingly required to hit it in order to complete the LFS upload
        if (verifyActions)
          await fetch(verifyActions.href, {
            method: 'POST',
            headers: verifyActions.header
          })
      }
      encoding = 'utf-8'
      content = Buffer.from(lfsPointer).toString(encoding)
    } else {
      content = buffer.toString(encoding)
    }
    const blobData = await octo.git.createBlob({
      owner: org,
      repo,
      content,
      encoding
    })
    return blobData.data
  }

const createNewTree = async (
  octo: Octokit,
  owner: string,
  repo: string,
  blobs: any[],
  paths: string[],
  parentTreeSha: string
) => {
  const oldTree = await octo.git.getTree({
    owner,
    repo,
    tree_sha: parentTreeSha,
    recursive: 'true'
  })
  const committableFiles = oldTree.data.tree.filter((file) => file.type === 'blob')
  const committableFilesMap = committableFiles.map((file) => file.path)
  // My custom config. Could be taken as parameters
  const tree = blobs.map(({ sha }, index) => ({
    path: paths[index],
    mode: `100644`,
    type: `blob`,
    sha
  })) as any[]
  committableFilesMap.forEach((fileName) => {
    if (fileName && paths.indexOf(fileName) < 0) {
      tree.push({
        path: fileName,
        mode: `100644`,
        type: 'blob',
        sha: null
      })
    }
  })
  const { data } = await octo.git.createTree({
    owner,
    repo,
    tree,
    base_tree: parentTreeSha
  })
  return data
}

const createNewCommit = async (
  octo: Octokit,
  org: string,
  repo: string,
  message: string,
  currentTreeSha: string,
  currentCommitSha: string
) =>
  (
    await octo.git.createCommit({
      owner: org,
      repo,
      message,
      tree: currentTreeSha,
      parents: [currentCommitSha]
    })
  ).data

const setBranchToCommit = (octo: Octokit, org: string, repo: string, branch = `main`, commitSha: string) =>
  octo.git.updateRef({
    owner: org,
    repo,
    ref: `heads/${branch}`,
    sha: commitSha
  })

const isBase64Encoded = (filePath: string) => {
  const extension = `.${filePath.split('.').pop()!}`
  return (
    ImageFileTypes.indexOf(extension) > -1 ||
    AudioFileTypes.indexOf(extension) > -1 ||
    VolumetricFileTypes.indexOf(extension) > -1 ||
    VideoFileTypes.indexOf(extension) > -1 ||
    ModelFileTypes.indexOf(extension) > -1 ||
    BinaryFileTypes.indexOf(extension) > -1
  )
}
