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

import { ECRClient } from '@aws-sdk/client-ecr'
import { DescribeImagesCommand, ECRPUBLICClient } from '@aws-sdk/client-ecr-public'
import * as k8s from '@kubernetes/client-node'
import appRootPath from 'app-root-path'
import { exec } from 'child_process'
import { compareVersions } from 'compare-versions'
import fetch from 'node-fetch'
import path from 'path'
import semver from 'semver'
import { promisify } from 'util'

import { helmSettingPath } from '@etherealengine/common/src/schemas/setting/helm-setting.schema'
import { getState } from '@etherealengine/hyperflux'
import { ProjectConfigInterface, ProjectEventHooks } from '@etherealengine/projects/ProjectConfigInterface'
import fs from 'fs'

import { PUBLIC_SIGNED_REGEX } from '@etherealengine/common/src/constants/GitHubConstants'
import { ProjectPackageJsonType } from '@etherealengine/common/src/interfaces/ProjectPackageJsonType'
import { apiJobPath } from '@etherealengine/common/src/schemas/cluster/api-job.schema'
import { projectResourcesPath } from '@etherealengine/common/src/schemas/media/project-resource.schema'
import { staticResourcePath, StaticResourceType } from '@etherealengine/common/src/schemas/media/static-resource.schema'
import { ProjectBuilderTagsType } from '@etherealengine/common/src/schemas/projects/project-builder-tags.schema'
import { ProjectCheckSourceDestinationMatchType } from '@etherealengine/common/src/schemas/projects/project-check-source-destination-match.schema'
import { ProjectCheckUnfetchedCommitType } from '@etherealengine/common/src/schemas/projects/project-check-unfetched-commit.schema'
import { ProjectCommitType } from '@etherealengine/common/src/schemas/projects/project-commits.schema'
import { ProjectDestinationCheckType } from '@etherealengine/common/src/schemas/projects/project-destination-check.schema'
import {
  projectPath,
  ProjectSettingType,
  ProjectType
} from '@etherealengine/common/src/schemas/projects/project.schema'
import {
  identityProviderPath,
  IdentityProviderType
} from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { userPath, UserType } from '@etherealengine/common/src/schemas/user/user.schema'
import { getDateTimeSql, toDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import {
  copyFolderRecursiveSync,
  deleteFolderRecursive,
  getFilesRecursive
} from '@etherealengine/common/src/utils/fsHelperFunctions'
import { processFileName } from '@etherealengine/common/src/utils/processFileName'
import { AssetLoader } from '@etherealengine/engine/src/assets/classes/AssetLoader'
import { AssetClass } from '@etherealengine/engine/src/assets/enum/AssetClass'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { Paginated } from '@feathersjs/feathers'
import { RestEndpointMethodTypes } from '@octokit/rest'
import { v4 as uuidv4 } from 'uuid'
import { Application } from '../../../declarations'
import config from '../../appconfig'
import { getPodsData } from '../../cluster/pods/pods-helper'
import { getCacheDomain } from '../../media/storageprovider/getCacheDomain'
import { getCachedURL } from '../../media/storageprovider/getCachedURL'
import { getStorageProvider } from '../../media/storageprovider/storageprovider'
import { getFileKeysRecursive } from '../../media/storageprovider/storageProviderUtils'
import { createStaticResourceHash } from '../../media/upload-asset/upload-asset.service'
import logger from '../../ServerLogger'
import { ServerState } from '../../ServerState'
import { BUILDER_CHART_REGEX } from '../../setting/helm-setting/helm-setting'
import { getContentType } from '../../util/fileUtils'
import { getGitConfigData, getGitHeadData, getGitOrigHeadData } from '../../util/getGitData'
import { useGit } from '../../util/gitHelperFunctions'
import { getAuthenticatedRepo, getOctokitForChecking, getUserRepos } from './github-helper'
import { ProjectParams } from './project.class'

export const dockerHubRegex = /^[\w\d\s\-_]+\/[\w\d\s\-_]+:([\w\d\s\-_.]+)$/
export const publicECRRepoRegex = /^public.ecr.aws\/[a-zA-Z0-9]+\/([a-z0-9\-_\\]+)$/
export const publicECRTagRegex = /^public.ecr.aws\/[a-zA-Z0-9]+\/[a-z0-9\-_\\]+:([\w\d\s\-_.]+?)$/
export const privateECRRepoRegex = /^[a-zA-Z0-9]+.dkr.ecr.([\w\d\s\-_]+).amazonaws.com\/([a-z0-9\-_\\]+)$/
export const privateECRTagRegex = /^[a-zA-Z0-9]+.dkr.ecr.([\w\d\s\-_]+).amazonaws.com\/[a-z0-9\-_\\]+:([\w\d\s\-_.]+)$/

const BRANCH_PER_PAGE = 100
const COMMIT_PER_PAGE = 10

const execAsync = promisify(exec)

interface GitHubFile {
  status: number
  url: string
  data: {
    name: string
    path: string
    sha: string
    size: number
    url: string
    html_url: string
    ssh_url: string
    git_url: string
    download_url: string
    type: string
    content: string
    encoding: string
    _links: {
      self: string
      git: string
      html: string
    }
  }
}

export const updateBuilder = async (
  app: Application,
  tag: string,
  data,
  params: ProjectParams,
  storageProviderName?: string
) => {
  try {
    // invalidate cache for all installed projects
    await getStorageProvider(storageProviderName).createInvalidation(['projects*'])
  } catch (e) {
    logger.error(e, `[Project Rebuild]: Failed to invalidate cache with error: ${e.message}`)
  }

  if (data.updateProjects) {
    await Promise.all(data.projectsToUpdate.map((project) => app.service(projectPath).update('', project, params)))
  }

  const helmSettingsResult = await app.service(helmSettingPath).find()
  const helmSettings = helmSettingsResult.total > 0 ? helmSettingsResult.data[0] : null
  const builderDeploymentName = `${config.server.releaseName}-builder`
  const k8sAppsClient = getState(ServerState).k8AppsClient
  const k8BatchClient = getState(ServerState).k8BatchClient

  if (k8BatchClient && config.server.releaseName !== 'local') {
    try {
      const builderLabelSelector = `app.kubernetes.io/instance=${config.server.releaseName}-builder`

      const builderJob = await k8BatchClient.listNamespacedJob(
        'default',
        undefined,
        false,
        undefined,
        undefined,
        builderLabelSelector
      )

      const builderDeployments = await k8sAppsClient.listNamespacedDeployment(
        'default',
        undefined,
        false,
        undefined,
        undefined,
        builderLabelSelector
      )

      const isJob = builderJob && builderJob.body.items.length > 0
      const isDeployment = builderDeployments && builderDeployments.body.items.length > 0

      if (isJob)
        await execAsync(`kubectl delete job --ignore-not-found=true ${builderJob.body.items[0].metadata!.name}`)
      else if (isDeployment)
        await execAsync(
          `kubectl delete deployment --ignore-not-found=true ${builderDeployments.body.items[0].metadata!.name}`
        )

      if (helmSettings && helmSettings.builder && helmSettings.builder.length > 0)
        await execAsync(
          `helm repo update && helm upgrade --reuse-values --version ${helmSettings.builder} --set builder.image.tag=${tag} ${builderDeploymentName} etherealengine/etherealengine-builder`
        )
      else {
        const { stdout } = await execAsync(`helm history ${builderDeploymentName} | grep deployed`)
        const builderChartVersion = BUILDER_CHART_REGEX.exec(stdout)![1]
        if (builderChartVersion)
          await execAsync(
            `helm repo update && helm upgrade --reuse-values --version ${builderChartVersion} --set builder.image.tag=${tag} ${builderDeploymentName} etherealengine/etherealengine-builder`
          )
      }
    } catch (err) {
      logger.error(err)
      throw err
    }
  }
}

export const checkBuilderService = async (app: Application): Promise<{ failed: boolean; succeeded: boolean }> => {
  const jobStatus = {
    failed: false,
    succeeded: !config.kubernetes.enabled // if no k8s, assume success
  }
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  const k8BatchClient = getState(ServerState).k8BatchClient

  // check k8s to find the status of builder service
  if (k8DefaultClient && k8BatchClient && config.server.releaseName !== 'local') {
    try {
      logger.info('Attempting to check k8s build status')

      const builderLabelSelector = `app.kubernetes.io/instance=${config.server.releaseName}-builder`

      const builderJob = await k8BatchClient.listNamespacedJob(
        'default',
        undefined,
        false,
        undefined,
        undefined,
        builderLabelSelector
      )

      if (builderJob && builderJob.body.items.length > 0) {
        const succeeded = builderJob.body.items.filter((item) => item.status && item.status.succeeded === 1)
        const failed = builderJob.body.items.filter((item) => item.status && item.status.failed === 1)
        jobStatus.succeeded = succeeded.length > 0
        jobStatus.failed = failed.length > 0

        return jobStatus
      } else {
        const containerName = 'etherealengine-builder'

        const builderPods = await k8DefaultClient.listNamespacedPod(
          'default',
          undefined,
          false,
          undefined,
          undefined,
          builderLabelSelector
        )

        const runningBuilderPods = builderPods.body.items.filter(
          (item) => item.status && item.status.phase === 'Running'
        )

        if (runningBuilderPods.length > 0) {
          const podName = runningBuilderPods[0].metadata?.name

          const builderLogs = await k8DefaultClient.readNamespacedPodLog(
            podName!,
            'default',
            containerName,
            undefined,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
          )

          jobStatus.succeeded = builderLogs.body.includes('sleep infinity')

          return jobStatus
        }
      }
    } catch (e) {
      logger.error(e)
      return e
    }
  }

  return jobStatus
}

const projectsRootFolder = path.join(appRootPath.path, 'packages/projects/projects/')

export const onProjectEvent = async (
  app: Application,
  projectName: string,
  hookPath: string,
  eventType: keyof ProjectEventHooks,
  ...args
) => {
  const hooks = require(path.resolve(projectsRootFolder, projectName, hookPath)).default
  if (typeof hooks[eventType] === 'function') {
    if (args && args.length > 0) {
      return await hooks[eventType](app, ...args)
    }
    return await hooks[eventType](app)
  }
}

export const getProjectConfig = (projectName: string): ProjectConfigInterface => {
  try {
    return require(path.resolve(projectsRootFolder, projectName, 'xrengine.config.ts')).default
  } catch (e) {
    logger.error(
      e,
      '[Projects]: WARNING project with ' +
        `name ${projectName} has no xrengine.config.ts file - this is not recommended.`
    )
    return null!
  }
}

export const getProjectPackageJson = (projectName: string): ProjectPackageJsonType => {
  return require(path.resolve(projectsRootFolder, projectName, 'package.json'))
}

export const getEnginePackageJson = (): ProjectPackageJsonType => {
  return require(path.resolve(appRootPath.path, 'packages/server-core/package.json'))
}

export const getProjectEnabled = (projectName: string) => {
  const matchesVersion = getProjectPackageJson(projectName).etherealEngine?.version === getEnginePackageJson().version
  return config.allowOutOfDateProjects ? true : matchesVersion
}

//DO NOT REMOVE!
//Even though an IDE may say that it's not used in the codebase, projects may use this.
export const getProjectEnv = async (app: Application, projectName: string) => {
  const project = (await app.service(projectPath).find({
    query: {
      $limit: 1,
      action: 'admin',
      name: projectName
    }
  })) as Paginated<ProjectType>

  let projectSetting = project.data[0].settings || []

  const settings: ProjectSettingType[] = []
  Object.values(projectSetting).map(({ key, value }) => (settings[key] = value))
  return settings
}

export const checkUnfetchedSourceCommit = async (app: Application, sourceURL: string, params: ProjectParams) => {
  const { selectedSHA } = params.query!

  const { owner, repo, octoKit: sourceOctoKit } = await getOctokitForChecking(app, sourceURL!, params)

  if (!sourceOctoKit)
    return {
      error: 'invalidSourceOctokit',
      text: 'You do not have access to the source GitHub repo'
    }
  if (!owner || !repo)
    return {
      error: 'invalidSourceURL',
      text: 'The source URL is not valid, or you do not have access to it'
    }
  let commit: RestEndpointMethodTypes['repos']['getCommit']['response']
  try {
    commit = await sourceOctoKit.rest.repos.getCommit({
      owner,
      repo,
      ref: selectedSHA || '',
      per_page: 1
    })
  } catch (err) {
    logger.error(err)
    if (err.status === 422) {
      return {
        error: 'commitInvalid',
        text: 'That commit does not appear to exist'
      }
    } else return Promise.reject(err)
  }

  try {
    const blobResponse = await sourceOctoKit.rest.repos.getContent({
      owner,
      repo,
      path: 'package.json',
      ref: commit.data.sha
    })
    const content = JSON.parse(Buffer.from((blobResponse.data as { content: string }).content, 'base64').toString())
    const enginePackageJson = getEnginePackageJson()
    return {
      projectName: content.name,
      projectVersion: content.version,
      engineVersion: content.etherealEngine?.version,
      commitSHA: commit.data.sha,
      error: '',
      text: '',
      datetime: commit.data.commit.committer?.date,
      matchesEngineVersion: content.etherealEngine?.version
        ? compareVersions(content.etherealEngine?.version, enginePackageJson.version || '0.0.0') === 0
        : false
    } as ProjectCheckUnfetchedCommitType
  } catch (err) {
    logger.error("Error getting commit's package.json %s/%s %s", owner, repo, err.toString())
    return Promise.reject(err)
  }
}

export const checkProjectDestinationMatch = async (
  app: Application,
  params: ProjectParams
): Promise<ProjectCheckSourceDestinationMatchType> => {
  const { sourceURL, selectedSHA, destinationURL, existingProject } = params.query!
  const {
    owner: destinationOwner,
    repo: destinationRepo,
    octoKit: destinationOctoKit
  } = await getOctokitForChecking(app, destinationURL!, params)
  const {
    owner: sourceOwner,
    repo: sourceRepo,
    octoKit: sourceOctoKit
  } = await getOctokitForChecking(app, sourceURL!, params)

  if (!sourceOctoKit)
    return {
      error: 'invalidSourceOctokit',
      text: 'You do not have access to the source GitHub repo'
    }
  if (!destinationOctoKit)
    return {
      error: 'invalidDestinationOctokit',
      text: 'You do not have access to the destination GitHub repo'
    }
  if (!sourceOwner || !sourceRepo)
    return {
      error: 'invalidSourceURL',
      text: 'The source URL is not valid, or you do not have access to it'
    }
  if (!destinationOwner || !destinationRepo)
    return {
      error: 'invalidDestinationURL',
      text: 'The destination URL is not valid, or you do not have access to it'
    }
  const [sourceBlobResponse, sourceConfigResponse, destinationBlobResponse]: [
    sourceBlobResponse: any,
    sourceConfigResponse: any,
    destinationBlobResponse: any
  ] = await Promise.all([
    new Promise(async (resolve, reject) => {
      try {
        const sourcePackage = await sourceOctoKit.rest.repos.getContent({
          owner: sourceOwner,
          repo: sourceRepo,
          path: 'package.json',
          ref: selectedSHA
        })
        resolve(sourcePackage)
      } catch (err) {
        logger.error(err)
        if (err.status === 404) {
          resolve({
            error: 'sourcePackageMissing',
            text: 'There is no package.json in the source repo'
          })
        } else reject(err)
      }
    }),
    new Promise(async (resolve, reject) => {
      try {
        const sourceConfig = await sourceOctoKit.rest.repos.getContent({
          owner: sourceOwner,
          repo: sourceRepo,
          path: 'xrengine.config.ts',
          ref: selectedSHA
        })
        resolve(sourceConfig)
      } catch (err) {
        logger.error(err)
        if (err.status === 404) {
          resolve({
            error: 'sourceConfigMissing',
            text: 'There is no xrengine.config.ts in the source repo'
          })
        } else reject(err)
      }
    }),
    new Promise(async (resolve, reject) => {
      try {
        const destinationPackage = await destinationOctoKit.rest.repos.getContent({
          owner: destinationOwner,
          repo: destinationRepo,
          path: 'package.json'
        })
        resolve(destinationPackage)
      } catch (err) {
        logger.error('destination package fetch error %o', err)
        if (err.status === 404) {
          resolve({
            error: 'destinationPackageMissing',
            text: 'There is no package.json in the source repo'
          })
        } else reject(err)
      }
    })
  ])
  if (sourceBlobResponse.error) return sourceBlobResponse
  if (sourceConfigResponse.error) return sourceConfigResponse
  const sourceContent = JSON.parse(
    Buffer.from(sourceBlobResponse.data.content, sourceBlobResponse.data.encoding).toString()
  )
  if (!existingProject) {
    const projectExists = (await app.service(projectPath).find({
      query: {
        action: 'admin',
        name: {
          $like: sourceContent.name
        },
        $limit: 1
      }
    })) as Paginated<ProjectType>

    if (projectExists.data.length > 0)
      return {
        sourceProjectMatchesDestination: false,
        error: 'projectExists',
        text: `The source project, ${sourceContent.name}, is already installed`
      }
  }
  if (destinationBlobResponse.error && destinationBlobResponse.error !== 'destinationPackageMissing')
    return destinationBlobResponse
  if (destinationBlobResponse.error === 'destinationPackageMissing')
    return { sourceProjectMatchesDestination: true, projectName: sourceContent.name }
  const destinationContent = JSON.parse(Buffer.from(destinationBlobResponse.data.content, 'base64').toString())
  if (sourceContent.name.toLowerCase() !== destinationContent.name.toLowerCase())
    return {
      error: 'invalidRepoProjectName',
      text: 'The repository you are attempting to update from contains a different project than the one you are updating'
    }
  else return { sourceProjectMatchesDestination: true, projectName: sourceContent.name }
}

export const checkDestination = async (app: Application, url: string, params?: ProjectParams) => {
  const inputProjectURL = params!.query!.inputProjectURL!
  const octokitResponse = await getOctokitForChecking(app, url, params!)
  const { owner, repo, octoKit, token } = octokitResponse

  const returned = {} as ProjectDestinationCheckType
  if (!owner || !repo)
    return {
      error: 'invalidUrl',
      text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
    }

  if (!octoKit)
    return {
      error: 'invalidDestinationOctokit',
      text: 'You do not have access to the destination GitHub repo'
    }

  try {
    const [authUser, repos] = await Promise.all([octoKit.rest.users.getAuthenticated(), getUserRepos(token)])
    const matchingRepo = repos.find(
      (repo) =>
        repo.html_url.toLowerCase() === url.toLowerCase() ||
        `${repo.html_url.toLowerCase()}.git` === url.toLowerCase() ||
        repo.ssh_url.toLowerCase() === url.toLowerCase() ||
        `${repo.ssh_url.toLowerCase()}.git` === url.toLowerCase()
    )
    if (!matchingRepo)
      return {
        error: 'invalidDestinationURL',
        text: 'The destination URL is not valid, or you do not have access to it'
      }
    const repoAccessible = owner === authUser.data.login || matchingRepo

    if (!repoAccessible) {
      returned.error = 'invalidDestinationURL'
      returned.text = `You do not appear to have access to this repository. If this seems wrong, click the button 
      "Refresh GitHub Repo Access" and try again. If you are only in the organization that owns this repo, make sure that the
      organization has installed the OAuth app associated with this installation, and that your personal GitHub account
      has granted access to the organization: https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-your-membership-in-organizations/requesting-organization-approval-for-oauth-apps`
    }
    returned.destinationValid =
      matchingRepo.permissions?.push || matchingRepo.permissions?.admin || matchingRepo.permissions?.maintain || false
    if (!returned.destinationValid)
      return {
        error: 'invalidPermission',
        text: 'You do not have personal push, maintain, or admin access to this repo.'
      }
    let destinationPackage
    try {
      destinationPackage = await octoKit.rest.repos.getContent({ owner, repo, path: 'package.json' })
    } catch (err) {
      logger.error('destination package fetch error %o', err)
      if (err.status !== 404) throw err
    }
    if (destinationPackage)
      returned.projectName = JSON.parse(Buffer.from(destinationPackage.data.content, 'base64').toString()).name
    else returned.repoEmpty = true

    if (inputProjectURL?.length > 0) {
      const projectOctokitResponse = await getOctokitForChecking(app, inputProjectURL, params!)
      const { owner: existingOwner, repo: existingRepo, octoKit: projectOctoKit } = projectOctokitResponse
      if (!projectOctoKit)
        return {
          error: 'invalidDestinationOctokit',
          text: 'You do not have access to the new GitHub repo'
        }
      if (!existingOwner || !existingRepo)
        return {
          error: 'invalidDestinationURL',
          text: 'The destination URL is not valid, or you do not have access to it'
        }
      let existingProjectPackage
      try {
        existingProjectPackage = await projectOctoKit.rest.repos.getContent({
          owner: existingOwner,
          repo: existingRepo,
          path: 'package.json'
        })
        const existingProjectName = JSON.parse(
          Buffer.from(existingProjectPackage.data.content, 'base64').toString()
        ).name
        if (!returned.repoEmpty && existingProjectName.toLowerCase() !== returned.projectName?.toLowerCase()) {
          returned.error = 'mismatchedProjects'
          returned.text = `The new destination repo contains project '${returned.projectName}', which is different than the current project '${existingProjectName}'`
        }
      } catch (err) {
        logger.error('destination package fetch error %o', err)
        if (err.status !== 404) throw err
      }
    }
    return returned
  } catch (err) {
    logger.error('error checking destination URL %o', err)
    if (err.status === 404)
      return {
        error: 'invalidUrl',
        text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
      }
    throw err
  }
}

export const getBranches = async (app: Application, url: string, params?: ProjectParams) => {
  const octokitResponse = await getOctokitForChecking(app, url, params!)
  const { owner, repo, octoKit } = octokitResponse

  if (!owner || !repo)
    return {
      error: 'invalidUrl',
      text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
    }

  if (!octoKit)
    return {
      error: 'invalidSourceOctokit',
      text: 'You do not have access to the source GitHub repo'
    }

  try {
    const repoResponse = await octoKit.rest.repos.get({ owner, repo })
    let returnedBranches = [] as { name: string; branchType: string }[]
    let endPagination = false
    let page = 1
    while (!endPagination) {
      const branches = (
        await octoKit.rest.repos.listBranches({
          owner,
          repo,
          per_page: BRANCH_PER_PAGE,
          page
        })
      ).data
      page++
      if (branches.length < BRANCH_PER_PAGE || branches.length === 0) endPagination = true
      returnedBranches = returnedBranches.concat(
        branches.map((branch) => {
          return {
            name: branch.name,
            branchType:
              branch.name === repoResponse.data.default_branch
                ? 'main'
                : branch.name === `${config.server.releaseName}-deployment`
                ? 'deployment'
                : 'generic'
          }
        })
      )
    }
    return returnedBranches
  } catch (err) {
    logger.error('error getting branches for project %o', err)
    if (err.status === 404)
      return {
        error: 'invalidUrl',
        text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
      }
    throw err
  }
}

export const getProjectCommits = async (
  app: Application,
  url: string,
  params?: ProjectParams
): Promise<ProjectCommitType[] | { error: string; text: string }> => {
  try {
    const octokitResponse = await getOctokitForChecking(app, url, params!)
    const { owner, repo, octoKit } = octokitResponse

    if (!owner || !repo)
      return {
        error: 'invalidUrl',
        text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
      }

    if (!octoKit)
      return {
        error: 'invalidDestinationOctokit',
        text: 'You does not have access to the destination GitHub repo'
      }

    const enginePackageJson = getEnginePackageJson()
    const repoResponse = await octoKit.rest.repos.get({ owner, repo })
    const branchName = params!.query!.sourceBranch || (repoResponse as any).default_branch
    const headResponse = await octoKit.rest.repos.listCommits({
      owner,
      repo,
      sha: branchName,
      per_page: COMMIT_PER_PAGE
    })
    const commits = headResponse.data
    return (await Promise.all(
      commits.map(
        (commit) =>
          new Promise(async (resolve, reject) => {
            try {
              const blobResponse = await octoKit.rest.repos.getContent({
                owner,
                repo,
                path: 'package.json',
                ref: commit.sha
              })
              const content = JSON.parse(
                Buffer.from((blobResponse.data as { content: string }).content, 'base64').toString()
              )
              resolve({
                projectName: content.name,
                projectVersion: content.version,
                engineVersion: content.etherealEngine?.version,
                commitSHA: commit.sha,
                datetime: commit?.commit?.committer?.date || new Date().toString(),
                matchesEngineVersion: content.etherealEngine?.version
                  ? compareVersions(content.etherealEngine?.version, enginePackageJson.version || '0.0.0') === 0
                  : false
              })
            } catch (err) {
              logger.error("Error getting commit's package.json %s/%s:%s %s", owner, repo, branchName, err.toString())
              resolve({
                projectName: undefined,
                projectVersion: undefined,
                engineVersion: undefined,
                commitSHA: commit.sha,
                datetime: commit?.commit?.committer?.date || new Date().toString(),
                matchesEngineVersion: false
              })
            }
          })
      )
    )) as ProjectCommitType[]
  } catch (err) {
    logger.error('error getting repo commits %o', err)
    if (err.status === 404)
      return {
        error: 'invalidUrl',
        text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
      }
    else if (err.status === 409)
      return {
        error: 'repoEmpty',
        text: 'This repo is empty'
      }
    throw err
  }
}

export const findBuilderTags = async (): Promise<Array<ProjectBuilderTagsType>> => {
  const builderRepo = `${process.env.SOURCE_REPO_URL}/${process.env.SOURCE_REPO_NAME_STEM}-builder` || ''
  const publicECRExec = publicECRRepoRegex.exec(builderRepo)
  const privateECRExec = privateECRRepoRegex.exec(builderRepo)
  if (publicECRExec) {
    const ecr = new ECRPUBLICClient({
      credentials: {
        accessKeyId: config.aws.eks.accessKeyId,
        secretAccessKey: config.aws.eks.secretAccessKey
      },
      region: 'us-east-1'
    })
    const command = {
      repositoryName: publicECRExec[1]
    }
    const result = new DescribeImagesCommand(command)
    const response = await ecr.send(result)
    if (!response || !response.imageDetails) return []
    return response.imageDetails
      .filter(
        (imageDetails) => imageDetails.imageTags && imageDetails.imageTags.length > 0 && imageDetails.imagePushedAt
      )
      .sort((a, b) => b.imagePushedAt!.getTime() - a!.imagePushedAt!.getTime())
      .map((imageDetails) => {
        const tag = imageDetails.imageTags!.find((tag) => !/latest/.test(tag))!
        const tagSplit = tag ? tag.split('_') : ''
        return {
          tag,
          commitSHA: tagSplit.length === 1 ? tagSplit[0] : tagSplit[1],
          engineVersion: tagSplit.length === 1 ? 'unknown' : tagSplit[0],
          pushedAt: imageDetails.imagePushedAt!.toJSON()
        }
      })
  } else if (privateECRExec) {
    const ecr = new ECRClient({
      credentials: {
        accessKeyId: config.aws.eks.accessKeyId,
        secretAccessKey: config.aws.eks.secretAccessKey
      },
      region: privateECRExec[1]
    })
    const command = {
      repositoryName: privateECRExec[2]
    }
    const result = new DescribeImagesCommand(command)
    const response = await ecr.send(result)
    if (!response || !response.imageDetails) return []
    return response.imageDetails
      .filter(
        (imageDetails) => imageDetails.imageTags && imageDetails.imageTags.length > 0 && imageDetails.imagePushedAt
      )
      .sort((a, b) => b.imagePushedAt!.getTime() - a.imagePushedAt!.getTime())
      .map((imageDetails) => {
        const tag = imageDetails.imageTags!.find((tag) => !/latest/.test(tag))!
        const tagSplit = tag ? tag.split('_') : ''
        return {
          tag,
          commitSHA: tagSplit.length === 1 ? tagSplit[0] : tagSplit[1],
          engineVersion: tagSplit.length === 1 ? 'unknown' : tagSplit[0],
          pushedAt: imageDetails.imagePushedAt!.toJSON()
        }
      })
  } else {
    const registry = /docker.io\//.test(process.env.SOURCE_REPO_URL!)
      ? process.env.SOURCE_REPO_URL!.split('/')[1]
      : process.env.SOURCE_REPO_URL
    try {
      const result = await fetch(
        `https://registry.hub.docker.com/v2/repositories/${registry}/${process.env.SOURCE_REPO_NAME_STEM}-builder/tags?page_size=100`
      )
      const body = JSON.parse(Buffer.from(await result.arrayBuffer()).toString())
      return body.results.map((imageDetails) => {
        const tag = imageDetails.name
        const tagSplit = tag.split('_')
        return {
          tag,
          commitSHA: tagSplit.length === 1 ? tagSplit[0] : tagSplit[1],
          engineVersion: tagSplit.length === 1 ? 'unknown' : tagSplit[0],
          pushedAt: new Date(imageDetails.tag_last_pushed).toJSON()
        }
      })
    } catch (e) {
      console.error(e)
      return []
    }
  }
}

export const getLatestProjectTaggedCommitInBranch = async (
  app: Application,
  url: string,
  branchName: string,
  params: ProjectParams
): Promise<string | { error: string; text: string }> => {
  const octokitResponse = await getOctokitForChecking(app, url, params!)
  const { owner, repo, octoKit } = octokitResponse

  if (!owner || !repo)
    return {
      error: 'invalidUrl',
      text: 'Project URL is not a valid GitHub URL, or the GitHub repo is private'
    }

  if (!octoKit)
    return {
      error: 'invalidDestinationOctokit',
      text: 'You does not have access to the destination GitHub repo'
    }

  const tagResponse = await octoKit.rest.repos.listTags({
    owner,
    repo,
    per_page: BRANCH_PER_PAGE
  })

  const commitResponse = await octoKit.rest.repos.listCommits({
    owner,
    repo,
    sha: branchName,
    per_page: COMMIT_PER_PAGE
  })

  let latestTaggedCommitInBranch = ''
  const sortedTags = semver.rsort(tagResponse.data.map((item) => item.name))
  const taggedCommits = [] as string[]
  sortedTags.forEach((tag) => taggedCommits.push(tagResponse.data.find((item) => item.name === tag)!.commit.sha))
  const branchCommits = commitResponse.data.map((response) => response.sha)
  for (const commit of taggedCommits) {
    if (branchCommits.indexOf(commit) > -1) {
      latestTaggedCommitInBranch = commit
      break
    }
  }

  return latestTaggedCommitInBranch
}

export async function getProjectUpdateJobBody(
  data: {
    sourceURL: string
    destinationURL: string
    name: string
    needsRebuild?: boolean
    reset?: boolean
    commitSHA?: string
    sourceBranch: string
    updateType: ProjectType['updateType']
    updateSchedule: string
  },
  app: Application,
  userId: string,
  jobId: string
): Promise<k8s.V1Job> {
  const apiPods = await getPodsData(
    `app.kubernetes.io/instance=${config.server.releaseName},app.kubernetes.io/component=api`,
    'api',
    'Api',
    app
  )

  const image = apiPods.pods[0].containers.find((container) => container.name === 'etherealengine')!.image

  const command = [
    'npx',
    'cross-env',
    'ts-node',
    '--swc',
    'scripts/update-project.ts',
    `--userId`,
    userId,
    '--sourceURL',
    data.sourceURL,
    '--destinationURL',
    data.destinationURL,
    '--name',
    data.name,
    '--sourceBranch',
    data.sourceBranch,
    '--updateType',
    data.updateType,
    '--updateSchedule',
    data.updateSchedule,
    '--jobId',
    jobId
  ]
  if (data.commitSHA) {
    command.push('--commitSHA')
    command.push(data.commitSHA)
  }
  if (data.needsRebuild) {
    command.push('--needsRebuild')
    command.push(data.needsRebuild.toString())
  }
  if (data.reset) {
    command.push('--reset')
    command.push(data.reset.toString())
  }
  return {
    metadata: {
      name: `${process.env.RELEASE_NAME}-${data.name}-update`,
      labels: {
        'etherealengine/projectUpdater': 'true',
        'etherealengine/autoUpdate': 'false',
        'etherealengine/projectField': data.name,
        'etherealengine/release': process.env.RELEASE_NAME!
      }
    },
    spec: {
      template: {
        metadata: {
          labels: {
            'etherealengine/projectUpdater': 'true',
            'etherealengine/autoUpdate': 'false',
            'etherealengine/projectField': data.name,
            'etherealengine/release': process.env.RELEASE_NAME!
          }
        },
        spec: {
          serviceAccountName: `${process.env.RELEASE_NAME}-etherealengine-api`,
          containers: [
            {
              name: `${process.env.RELEASE_NAME}-${data.name}-update`,
              image,
              imagePullPolicy: 'IfNotPresent',
              command,
              env: Object.entries(process.env).map(([key, value]) => {
                return { name: key, value: value }
              })
            }
          ],
          restartPolicy: 'Never'
        }
      }
    }
  }
}
export async function getProjectPushJobBody(
  app: Application,
  project: ProjectType,
  user: UserType,
  reset = false,
  jobId: string,
  commitSHA?: string,
  storageProviderName?: string
): Promise<k8s.V1Job> {
  const apiPods = await getPodsData(
    `app.kubernetes.io/instance=${config.server.releaseName},app.kubernetes.io/component=api`,
    'api',
    'Api',
    app
  )

  const image = apiPods.pods[0].containers.find((container) => container.name === 'etherealengine')!.image

  const command = [
    'npx',
    'cross-env',
    'ts-node',
    '--swc',
    'scripts/push-project.ts',
    `--userId`,
    user.id,
    '--projectId',
    project.id,
    '--jobId',
    jobId
  ]
  if (commitSHA) {
    command.push('--commitSHA')
    command.push(commitSHA)
  }
  if (reset) {
    command.push('--reset')
    command.push(reset.toString())
  }
  if (storageProviderName) {
    command.push('--storageProviderName')
    command.push(storageProviderName)
  }
  return {
    metadata: {
      name: `${process.env.RELEASE_NAME}-${project.name.toLowerCase()}-gh-push`,
      labels: {
        'etherealengine/projectPusher': 'true',
        'etherealengine/projectField': project.name,
        'etherealengine/release': process.env.RELEASE_NAME!
      }
    },
    spec: {
      template: {
        metadata: {
          labels: {
            'etherealengine/projectPusher': 'true',
            'etherealengine/projectField': project.name,
            'etherealengine/release': process.env.RELEASE_NAME!
          }
        },
        spec: {
          serviceAccountName: `${process.env.RELEASE_NAME}-etherealengine-api`,
          containers: [
            {
              name: `${process.env.RELEASE_NAME}-${project.name.toLowerCase()}-push`,
              image,
              imagePullPolicy: 'IfNotPresent',
              command,
              env: Object.entries(process.env).map(([key, value]) => {
                return { name: key, value: value }
              })
            }
          ],
          restartPolicy: 'Never'
        }
      }
    }
  }
}

export const getCronJobBody = (project: ProjectType, image: string): object => {
  return {
    metadata: {
      name: `${process.env.RELEASE_NAME}-${project.name.toLowerCase()}-auto-update`,
      labels: {
        'etherealengine/projectUpdater': 'true',
        'etherealengine/autoUpdate': 'true',
        'etherealengine/projectField': project.name,
        'etherealengine/projectId': project.id,
        'etherealengine/release': process.env.RELEASE_NAME
      }
    },
    spec: {
      schedule: project.updateSchedule,
      concurrencyPolicy: 'Replace',
      successfulJobsHistoryLimit: 1,
      failedJobsHistoryLimit: 2,
      jobTemplate: {
        spec: {
          template: {
            metadata: {
              labels: {
                'etherealengine/projectUpdater': 'true',
                'etherealengine/autoUpdate': 'true',
                'etherealengine/projectField': project.name,
                'etherealengine/projectId': project.id,
                'etherealengine/release': process.env.RELEASE_NAME
              }
            },
            spec: {
              serviceAccountName: `${process.env.RELEASE_NAME}-etherealengine-api`,
              containers: [
                {
                  name: `${process.env.RELEASE_NAME}-${project.name.toLowerCase()}-auto-update`,
                  image,
                  imagePullPolicy: 'IfNotPresent',
                  command: [
                    'npx',
                    'cross-env',
                    'ts-node',
                    '--swc',
                    'scripts/auto-update-project.ts',
                    '--projectName',
                    project.name
                  ],
                  env: Object.entries(process.env).map(([key, value]) => {
                    return { name: key, value: value }
                  })
                }
              ],
              restartPolicy: 'OnFailure'
            }
          }
        }
      }
    }
  }
}

export async function getDirectoryArchiveJobBody(
  app: Application,
  directory: string,
  projectName: string,
  jobId: string,
  storageProviderName?: string
): Promise<k8s.V1Job> {
  const apiPods = await getPodsData(
    `app.kubernetes.io/instance=${config.server.releaseName},app.kubernetes.io/component=api`,
    'api',
    'Api',
    app
  )

  const image = apiPods.pods[0].containers.find((container) => container.name === 'etherealengine')!.image

  const command = [
    'npx',
    'cross-env',
    'ts-node',
    '--swc',
    'scripts/archive-directory.ts',
    `--directory`,
    directory,
    '--jobId',
    jobId
  ]
  if (storageProviderName) {
    command.push('--storageProviderName')
    command.push(storageProviderName)
  }
  return {
    metadata: {
      name: `${process.env.RELEASE_NAME}-${projectName}-archive`,
      labels: {
        'etherealengine/directoryArchiver': 'true',
        'etherealengine/directoryField': projectName,
        'etherealengine/release': process.env.RELEASE_NAME || ''
      }
    },
    spec: {
      template: {
        metadata: {
          labels: {
            'etherealengine/directoryArchiver': 'true',
            'etherealengine/directoryField': projectName,
            'etherealengine/release': process.env.RELEASE_NAME || ''
          }
        },
        spec: {
          serviceAccountName: `${process.env.RELEASE_NAME}-etherealengine-api`,
          containers: [
            {
              name: `${process.env.RELEASE_NAME}-${projectName}-archive`,
              image,
              imagePullPolicy: 'IfNotPresent',
              command,
              env: Object.entries(process.env).map(([key, value]) => {
                return { name: key, value: value }
              })
            }
          ],
          restartPolicy: 'Never'
        }
      }
    }
  }
}

export const createOrUpdateProjectUpdateJob = async (app: Application, projectName: string): Promise<void> => {
  const projectData = (await app.service(projectPath).find({
    query: {
      action: 'admin',
      name: projectName,
      $limit: 1
    }
  })) as Paginated<ProjectType>

  const project = projectData.data[0]

  const apiPods = await getPodsData(
    `app.kubernetes.io/instance=${config.server.releaseName},app.kubernetes.io/component=api`,
    'api',
    'Api',
    app
  )

  const image = apiPods.pods[0].containers.find((container) => container.name === 'etherealengine')!.image

  const k8BatchClient = getState(ServerState).k8BatchClient

  if (k8BatchClient) {
    try {
      await k8BatchClient.patchNamespacedCronJob(
        `${process.env.RELEASE_NAME}-${projectName}-auto-update`,
        'default',
        getCronJobBody(project, image),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            'content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH
          }
        }
      )
    } catch (err) {
      logger.error('Could not find cronjob %o', err)
      await k8BatchClient.createNamespacedCronJob('default', getCronJobBody(project, image))
    }
  }
}

export const removeProjectUpdateJob = async (app: Application, projectName: string): Promise<void> => {
  try {
    const k8BatchClient = getState(ServerState).k8BatchClient
    if (k8BatchClient)
      await k8BatchClient.deleteNamespacedCronJob(`${process.env.RELEASE_NAME}-${projectName}-auto-update`, 'default')
  } catch (err) {
    logger.error('Failed to remove project update cronjob %o', err)
  }
}

export const checkProjectAutoUpdate = async (app: Application, projectName: string): Promise<void> => {
  let commitSHA
  const projectData = (await app.service(projectPath).find({
    query: {
      action: 'admin',
      name: projectName,
      $limit: 1
    }
  })) as Paginated<ProjectType>

  const project = projectData.data[0]

  const user = await app.service(userPath)._get(project.updateUserId!)
  if (project.updateType === 'tag') {
    const latestTaggedCommit = await getLatestProjectTaggedCommitInBranch(
      app,
      project.sourceRepo!,
      project.sourceBranch!,
      { user }
    )

    if (typeof latestTaggedCommit === 'string' && latestTaggedCommit !== project.commitSHA!)
      commitSHA = latestTaggedCommit
  } else if (project.updateType === 'commit') {
    const commits = await getProjectCommits(app, project.sourceRepo!, {
      user,
      query: { sourceBranch: project.sourceBranch! }
    })
    if (commits && commits[0].commitSHA !== project.commitSHA) commitSHA = commits[0].commitSHA
  }
  if (commitSHA && !project.hasLocalChanges)
    await app.service(projectPath).update(
      '',
      {
        sourceURL: project.sourceRepo!,
        destinationURL: project.repositoryPath,
        name: projectName,
        reset: true,
        commitSHA,
        sourceBranch: project.sourceBranch!,
        updateType: project.updateType,
        updateSchedule: project.updateSchedule!
      },
      { user: user }
    )
}

export const createExecutorJob = async (
  app: Application,
  jobBody: k8s.V1Job,
  jobLabelSelector: string,
  timeout: number,
  jobId: string
) => {
  const k8BatchClient = getState(ServerState).k8BatchClient

  const name = jobBody.metadata!.name!
  try {
    await k8BatchClient.deleteNamespacedJob(name, 'default', undefined, undefined, 0, undefined, 'Background')
  } catch (err) {
    console.log('Old job did not exist, continuing...')
  }

  await k8BatchClient.createNamespacedJob('default', jobBody)
  let counter = 0
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      counter++

      const job = await app.service(apiJobPath).get(jobId)
      console.log('job to be checked on', job, job.status)
      if (job.status !== 'pending') clearInterval(interval)
      if (job.status === 'succeeded') resolve(job.returnData)
      if (job.status === 'failed') reject()
      if (counter >= timeout) {
        clearInterval(interval)
        const date = await getDateTimeSql()
        await app.service(apiJobPath).patch(jobId, {
          status: 'failed',
          endTime: date
        })
        reject('Job timed out; try again later or check error logs of job')
      }
    }, 1000)
  })
}

export const copyDefaultProject = () => {
  deleteFolderRecursive(path.join(projectsRootFolder, `default-project`))
  copyFolderRecursiveSync(path.join(appRootPath.path, 'packages/projects/default-project'), projectsRootFolder)
}

export const getGitProjectData = (project) => {
  const response = {
    repositoryPath: '',
    sourceRepo: '',
    sourceBranch: '',
    commitSHA: ''
  }

  //TODO: We can use simpleGit instead of manually accessing files.
  const projectGitDir = path.resolve(__dirname, `../../../../projects/projects/${project}/.git`)

  const config = getGitConfigData(projectGitDir)
  if (config?.remote?.origin?.url) {
    response.repositoryPath = config?.remote?.origin?.url
    response.sourceRepo = config?.remote?.origin?.url
  }

  const branch = getGitHeadData(projectGitDir)
  if (branch) {
    response.sourceBranch = branch
  }

  const sha = getGitOrigHeadData(projectGitDir, branch)
  if (sha) {
    response.commitSHA = sha
  }

  return response
}

export const updateProject = async (
  app: Application,
  data: {
    sourceURL: string
    destinationURL: string
    name?: string
    needsRebuild?: boolean
    reset?: boolean
    commitSHA?: string
    sourceBranch: string
    updateType: ProjectType['updateType']
    updateSchedule: string
  },
  params?: ProjectParams
) => {
  if (data.sourceURL === 'default-project') {
    copyDefaultProject()
    await uploadLocalProjectToProvider(app, 'default-project')
    if (params?.jobId) {
      const date = await getDateTimeSql()
      await app.service(apiJobPath).patch(params.jobId as string, {
        status: 'succeeded',
        endTime: date
      })
    }
    return (
      (await app.service(projectPath).find({
        query: {
          action: 'admin',
          name: 'default-project',
          $limit: 1
        }
      })) as Paginated<ProjectType>
    ).data[0]
  }

  const urlParts = data.sourceURL.split('/')
  let projectName = data.name || urlParts.pop()
  if (!projectName) throw new Error('Git repo must be plain URL')
  projectName = projectName.toLowerCase()
  if (projectName.substring(projectName.length - 4) === '.git') projectName = projectName.slice(0, -4)
  if (projectName.substring(projectName.length - 1) === '/') projectName = projectName.slice(0, -1)

  const projectLocalDirectory = path.resolve(appRootPath.path, `packages/projects/projects/`)
  const projectDirectory = path.resolve(appRootPath.path, `packages/projects/projects/${projectName}/`)

  // if project exists already, remove it and re-clone it
  if (fs.existsSync(projectDirectory)) {
    // if (isDev) throw new Error('Cannot create project - already exists')
    deleteFolderRecursive(projectDirectory)
  }

  const projectResult = (await app.service(projectPath).find({
    query: {
      action: 'admin',
      name: projectName
    }
  })) as Paginated<ProjectType>

  let project
  if (projectResult.data.length > 0) project = projectResult.data[0]

  const userId = params!.user?.id || project?.updateUserId
  if (!userId) throw new BadRequest('No user ID from call or existing project owner')

  const githubIdentityProvider = (await app.service(identityProviderPath).find({
    query: {
      userId: userId,
      type: 'github',
      $limit: 1
    }
  })) as Paginated<IdentityProviderType>

  if (githubIdentityProvider.data.length === 0) throw new Forbidden('You are not authorized to access this project')

  let repoPath = await getAuthenticatedRepo(githubIdentityProvider.data[0].oauthToken!, data.sourceURL)
  if (!repoPath) repoPath = data.sourceURL //public repo

  const gitCloner = useGit(projectLocalDirectory)
  await gitCloner.clone(repoPath, projectDirectory)
  const git = useGit(projectDirectory)
  const branchName = `${config.server.releaseName}-deployment`
  try {
    const branchExists = await git.raw(['ls-remote', '--heads', repoPath, `${branchName}`])
    if (data.commitSHA) await git.checkout(data.commitSHA)
    if (branchExists.length === 0 || data.reset) {
      try {
        await git.deleteLocalBranch(branchName)
      } catch (err) {
        //
      }
      await git.checkoutLocalBranch(branchName)
    } else await git.checkout(branchName)
  } catch (err) {
    if (params?.jobId) {
      const date = await getDateTimeSql()
      await app.service(apiJobPath).patch(params.jobId as string, {
        status: 'failed',
        returnData: err.toString(),
        endTime: date
      })
    }
    logger.error(err)
    throw err
  }

  await uploadLocalProjectToProvider(app, projectName)

  const projectConfig = getProjectConfig(projectName) ?? {}

  const enabled = getProjectEnabled(projectName)

  // when we have successfully re-installed the project, remove the database entry if it already exists
  const existingProjectResult = (await app.service(projectPath).find({
    query: {
      action: 'admin',
      name: {
        $like: projectName
      }
    }
  })) as Paginated<ProjectType>
  const existingProject = existingProjectResult.total > 0 ? existingProjectResult.data[0] : null
  let repositoryPath = data.destinationURL || data.sourceURL
  const publicSignedExec = PUBLIC_SIGNED_REGEX.exec(repositoryPath)
  //In testing, intermittently the signed URL was being entered into the database, which made matching impossible.
  //Stripping the signed portion out if it's about to be inserted.
  if (publicSignedExec) repositoryPath = `https://github.com/${publicSignedExec[1]}/${publicSignedExec[2]}`
  const { commitSHA, commitDate } = await getCommitSHADate(projectName)

  const returned = !existingProject
    ? // Add to DB
      await app.service(projectPath).create(
        {
          id: uuidv4(),
          name: projectName,
          enabled,
          repositoryPath,
          needsRebuild: data.needsRebuild ? data.needsRebuild : true,
          hasLocalChanges: false,
          sourceRepo: data.sourceURL,
          sourceBranch: data.sourceBranch,
          updateType: data.updateType,
          updateSchedule: data.updateSchedule,
          updateUserId: userId,
          commitSHA,
          commitDate: toDateTimeSql(commitDate),
          createdAt: await getDateTimeSql(),
          updatedAt: await getDateTimeSql()
        },
        params || {}
      )
    : await app.service(projectPath).patch(
        existingProject.id,
        {
          enabled,
          commitSHA,
          hasLocalChanges: false,
          commitDate: toDateTimeSql(commitDate),
          sourceRepo: data.sourceURL,
          sourceBranch: data.sourceBranch,
          updateType: data.updateType,
          updateSchedule: data.updateSchedule,
          updateUserId: userId
        },
        params
      )

  returned.needsRebuild = typeof data.needsRebuild === 'boolean' ? data.needsRebuild : true

  if (returned.name !== projectName)
    await app.service(projectPath).patch(existingProject!.id, {
      name: projectName
    })

  if (data.reset) {
    let repoPath = await getAuthenticatedRepo(githubIdentityProvider.data[0].oauthToken!, data.destinationURL)
    if (!repoPath) repoPath = data.destinationURL //public repo
    await git.addRemote('destination', repoPath)
    await git.raw(['lfs', 'fetch', '--all'])
    await git.push('destination', branchName, ['-f', '--tags'])
    const { commitSHA, commitDate } = await getCommitSHADate(projectName)
    await app.service(projectPath).patch(
      returned.id,
      {
        commitSHA,
        commitDate: toDateTimeSql(commitDate)
      },
      params
    )
  }
  // run project install script
  if (projectConfig.onEvent) {
    await onProjectEvent(app, projectName, projectConfig.onEvent, existingProject ? 'onUpdate' : 'onInstall')
  }

  const k8BatchClient = getState(ServerState).k8BatchClient

  if (k8BatchClient && (data.updateType === 'tag' || data.updateType === 'commit'))
    await createOrUpdateProjectUpdateJob(app, projectName)
  else if (k8BatchClient && (data.updateType === 'none' || data.updateType == null))
    await removeProjectUpdateJob(app, projectName)

  if (params?.jobId) {
    const date = await getDateTimeSql()
    await app.service(apiJobPath).patch(params.jobId as string, {
      status: 'succeeded',
      endTime: date
    })
  }

  return returned
}

export const getCommitSHADate = async (projectName: string): Promise<{ commitSHA: string; commitDate: Date }> => {
  const projectDirectory = path.resolve(appRootPath.path, `packages/projects/projects/${projectName}/`)
  const git = useGit(projectDirectory)
  let commitSHA = ''
  let commitDate = new Date()
  try {
    commitSHA = await git.revparse(['HEAD'])
    const commit = await git.log(['-1'])
    commitDate = commit?.latest?.date ? new Date(commit.latest.date) : new Date()
  } catch (err) {
    console.error('Error in getCommitSHADate', err)
  }
  return {
    commitSHA,
    commitDate
  }
}

export const deleteProjectFilesInStorageProvider = async (projectName: string, storageProviderName?: string) => {
  const storageProvider = getStorageProvider(storageProviderName)
  try {
    const existingFiles = await getFileKeysRecursive(`projects/${projectName}`)
    if (existingFiles.length) {
      await Promise.all([
        storageProvider.deleteResources(existingFiles),
        storageProvider.createInvalidation([`projects/${projectName}*`])
      ])
    }
  } catch (e) {
    logger.error(e, '[ERROR deleteProjectFilesInStorageProvider]:')
  }
}

/**
 * Updates the local storage provider with the project's current files
 * @param app Application object
 * @param projectName
 * @param storageProviderName
 * @param remove
 */
export const uploadLocalProjectToProvider = async (
  app: Application,
  projectName: string,
  remove = true,
  storageProviderName?: string
) => {
  const storageProvider = getStorageProvider(storageProviderName)
  const cacheDomain = getCacheDomain(storageProvider, true)

  // remove exiting storage provider files
  logger.info(`uploadLocalProjectToProvider for project "${projectName}" started at "${new Date()}".`)
  if (remove) {
    await deleteProjectFilesInStorageProvider(projectName)
  }

  // upload new files to storage provider
  const projectRootPath = path.resolve(projectsRootFolder, projectName)
  const resourceDBPath = path.join(projectRootPath, 'resources.json')
  const hasResourceDB = fs.existsSync(resourceDBPath)

  const files = getFilesRecursive(projectRootPath)
  const filtered = files.filter((file) => !file.includes(`projects/${projectName}/.git/`))
  const results = [] as (string | null)[]
  const resourceKey = (key, hash) => `${key}#${hash}`
  const existingResources = await app.service(staticResourcePath).find({
    query: {
      project: projectName
    },
    paginate: false
  })
  const existingContentSet = new Set<string>()
  const existingKeySet = new Set<string>()
  for (const item of existingResources) {
    existingContentSet.add(resourceKey(item.key, item.hash))
    existingKeySet.add(item.key)
  }
  if (hasResourceDB) {
    //if we have a resources.sql file, use it to populate static-resource table
    const manifest: StaticResourceType[] = JSON.parse(fs.readFileSync(resourceDBPath).toString())

    for (const item of manifest) {
      if (existingKeySet.has(item.key)) {
        // logger.info(`Skipping upload of static resource: "${item.key}"`)
        continue
      }
      const url = getCachedURL(item.key, cacheDomain)
      //remove userId if exists
      if (item.userId) delete (item as any).userId

      const newResource: Partial<StaticResourceType> = {}

      const validFields: (keyof StaticResourceType)[] = [
        'attribution',
        'createdAt',
        'hash',
        'key',
        'licensing',
        'metadata',
        'mimeType',
        'project',
        'sid',
        'stats',
        'tags',
        'updatedAt'
      ]

      for (const field of validFields) {
        if (item[field]) newResource[field] = item[field]
      }

      await app.service(staticResourcePath).create({
        ...newResource,
        url
      })
      // logger.info(`Uploaded static resource ${item.key} from resources.json`)
    }
  }

  for (const file of filtered) {
    try {
      const fileResult = fs.readFileSync(file)
      const filePathRelative = processFileName(file.slice(projectRootPath.length))
      const contentType = getContentType(file)
      const key = `projects/${projectName}${filePathRelative}`
      const url = getCachedURL(key, getCacheDomain(storageProvider))
      await storageProvider.putObject(
        {
          Body: fileResult,
          ContentType: contentType,
          Key: key
        },
        { isDirectory: false }
      )
      if (!hasResourceDB) {
        //otherwise, upload the files into static resources individually
        const staticResourceClasses = [
          AssetClass.Audio,
          AssetClass.Image,
          AssetClass.Model,
          AssetClass.Video,
          AssetClass.Volumetric
        ]
        const thisFileClass = AssetLoader.getAssetClass(file)
        if (filePathRelative.startsWith('/assets/') && staticResourceClasses.includes(thisFileClass)) {
          const hash = createStaticResourceHash(fileResult)
          if (existingContentSet.has(resourceKey(key, hash))) {
            // logger.info(`Skipping upload of static resource of class ${thisFileClass}: "${key}"`)
          } else {
            if (existingKeySet.has(key)) {
              logger.info(`Updating static resource of class ${thisFileClass}: "${key}"`)
              await app.service(staticResourcePath).patch(
                null,
                {
                  hash,
                  url,
                  mimeType: contentType,
                  tags: [thisFileClass]
                },
                {
                  query: {
                    key,
                    project: projectName
                  }
                }
              )
            } else {
              logger.info(`Creating static resource of class ${thisFileClass}: "${key}"`)
              await app.service(staticResourcePath).create({
                key: `projects/${projectName}${filePathRelative}`,
                project: projectName,
                hash,
                url,
                mimeType: contentType,
                tags: [thisFileClass]
              })
            }
            // logger.info(`Uploaded static resource of class ${thisFileClass}: "${key}"`)
          }
        }
      }
      results.push(getCachedURL(`projects/${projectName}${filePathRelative}`, cacheDomain))
    } catch (e) {
      logger.error(e)
      results.push(null)
    }
  }
  if (!hasResourceDB) {
    await app.service(projectResourcesPath).create({ project: projectName })
  }
  logger.info(`uploadLocalProjectToProvider for project "${projectName}" ended at "${new Date()}".`)
  return results.filter((success) => !!success) as string[]
}
