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
import { hooks as schemaHooks } from '@feathersjs/schema'
import { discardQuery, iff, iffElse, isProvider } from 'feathers-hooks-common'

import { projectPermissionPath } from '@etherealengine/common/src/schemas/projects/project-permission.schema'
import {
  ProjectData,
  ProjectPatch,
  ProjectType,
  projectDataValidator,
  projectPatchValidator,
  projectPath,
  projectQueryValidator
} from '@etherealengine/common/src/schemas/projects/project.schema'
import fs from 'fs'
import path from 'path'
import projectPermissionAuthenticate from '../../hooks/project-permission-authenticate'
import verifyScope from '../../hooks/verify-scope'
import { projectPermissionDataResolver } from '../project-permission/project-permission.resolvers'

import { GITHUB_URL_REGEX } from '@etherealengine/common/src/constants/GitHubConstants'
import { apiJobPath } from '@etherealengine/common/src/schemas/cluster/api-job.schema'
import { StaticResourceType, staticResourcePath } from '@etherealengine/common/src/schemas/media/static-resource.schema'
import { ProjectBuildUpdateItemType } from '@etherealengine/common/src/schemas/projects/project-build.schema'
import { SceneID } from '@etherealengine/common/src/schemas/projects/scene.schema'
import { routePath } from '@etherealengine/common/src/schemas/route/route.schema'
import { locationPath } from '@etherealengine/common/src/schemas/social/location.schema'
import { AvatarType, avatarPath } from '@etherealengine/common/src/schemas/user/avatar.schema'
import {
  GithubRepoAccessType,
  githubRepoAccessPath
} from '@etherealengine/common/src/schemas/user/github-repo-access.schema'
import {
  IdentityProviderType,
  identityProviderPath
} from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import { copyFolderRecursiveSync } from '@etherealengine/common/src/utils/fsHelperFunctions'
import templateProjectJson from '@etherealengine/projects/template-project/package.json'
import { checkScope } from '@etherealengine/spatial/src/common/functions/checkScope'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { Paginated } from '@feathersjs/feathers'
import appRootPath from 'app-root-path'
import { Knex } from 'knex'
import { HookContext } from '../../../declarations'
import logger from '../../ServerLogger'
import config from '../../appconfig'
import { createSkippableHooks } from '../../hooks/createSkippableHooks'
import enableClientPagination from '../../hooks/enable-client-pagination'
import isAction from '../../hooks/is-action'
import { cleanString } from '../../util/cleanString'
import { useGit } from '../../util/gitHelperFunctions'
import { checkAppOrgStatus, checkUserOrgWriteStatus, checkUserRepoWriteStatus } from './github-helper'
import {
  createExecutorJob,
  deleteProjectFilesInStorageProvider,
  getEnginePackageJson,
  getProjectConfig,
  getProjectPackageJson,
  getProjectUpdateJobBody,
  onProjectEvent,
  removeProjectUpdateJob,
  updateProject,
  uploadLocalProjectToProvider
} from './project-helper'
import { ProjectService } from './project.class'
import {
  projectDataResolver,
  projectExternalResolver,
  projectPatchResolver,
  projectQueryResolver,
  projectResolver
} from './project.resolvers'

const templateFolderDirectory = path.join(appRootPath.path, `packages/projects/template-project/`)

const projectsRootFolder = path.join(appRootPath.path, 'packages/projects/projects/')

const filterDisabledProjects = (context: HookContext<ProjectService>) => {
  if (config.allowOutOfDateProjects) return
  if (context.params.query) context.params.query.enabled = true
  else context.params.query = { enabled: true }
}

/**
 * Hook used to check if request data only has enabled.
 * @param context
 */
export const checkEnabled = async (context: HookContext) => {
  if (!context.data || context.method !== 'patch') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }
  const data: ProjectPatch = context.data as ProjectPatch

  if (data.enabled !== undefined && Object.keys(data).length === 2) return true

  return false
}

/**
 * Checks whether the user has push access to the project
 * @param context
 * @returns
 */
const ensurePushStatus = async (context: HookContext<ProjectService>) => {
  if (context.params.query.skipProjectPermissions)
    context.params.skipProjectPermissions = context.params.query.skipProjectPermissions
  console.log('started ensurePushStatus at', new Date().toJSON(), context.params.user?.id)
  context.projectPushIds = []
  if (context.params?.query?.allowed) {
    console.log('checking which projects user', context.params.user?.id, 'has push access to', new Date().toJSON())
    // See if the user has a GitHub identity-provider, and if they do, also determine which GitHub repos they personally
    // can push to.

    const githubIdentityProvider = (await context.app.service(identityProviderPath).find({
      query: {
        userId: context.params.user!.id,
        type: 'github',
        $limit: 1
      }
    })) as Paginated<IdentityProviderType>

    console.log('got github identity provider at', new Date().toJSON())

    // Get all of the projects that this user has permissions for, then calculate push status by whether the user
    // can push to it. This will make sure no one tries to push to a repo that they do not have write access to.
    const knexClient: Knex = context.app.get('knexClient')
    const projectPermissions = await knexClient
      .from(projectPermissionPath)
      .join(projectPath, `${projectPath}.id`, `${projectPermissionPath}.projectId`)
      .where(`${projectPermissionPath}.userId`, context.params.user!.id)
      .select()
      .options({ nestTables: true })

    console.log('got projectPermissions', new Date().toJSON())

    const allowedProjects = projectPermissions.map((permission) => permission.project)
    const repoAccess =
      githubIdentityProvider.data.length > 0
        ? ((await context.app.service(githubRepoAccessPath).find({
            query: {
              identityProviderId: githubIdentityProvider.data[0].id
            },
            paginate: false
          })) as GithubRepoAccessType[])
        : []
    console.log('got repoAccess', new Date().toJSON())
    const pushRepoPaths = repoAccess.filter((repo) => repo.hasWriteAccess).map((item) => item.repo.toLowerCase())
    let allowedProjectGithubRepos = allowedProjects.filter((project) => project.repositoryPath != null)
    allowedProjectGithubRepos = await Promise.all(
      allowedProjectGithubRepos.map(async (project) => {
        const regexExec = GITHUB_URL_REGEX.exec(project.repositoryPath)
        if (!regexExec) return { repositoryPath: '', name: '' }
        const split = regexExec[2].split('/')
        project.repositoryPath = `https://github.com/${split[0]}/${split[1]}`
        return project
      })
    )
    console.log('got allowedProjectGithubRepos', new Date().toJSON())
    const pushableAllowedProjects = allowedProjectGithubRepos.filter(
      (project) => pushRepoPaths.indexOf(project.repositoryPath.toLowerCase().replace(/.git$/, '')) > -1
    )
    context.projectPushIds = context.projectPushIds.concat(pushableAllowedProjects.map((project) => project.id))

    if (githubIdentityProvider) {
      const repositoryPaths: string[] = []
      repoAccess.forEach((item) => {
        if (item.hasWriteAccess) {
          const url = item.repo.toLowerCase()
          repositoryPaths.push(url)
          repositoryPaths.push(`${url}.git`)
          const regexExec = GITHUB_URL_REGEX.exec(url)
          if (regexExec) {
            const split = regexExec[2].split('/')
            repositoryPaths.push(`git@github.com:${split[0]}/${split[1]}`)
            repositoryPaths.push(`git@github.com:${split[0]}/${split[1]}.git`)
          }
        }
      })

      const matchingAllowedRepos = (await context.app.service(projectPath).find({
        query: {
          action: 'admin',
          repositoryPath: { $in: repositoryPaths }
        },
        skipProjectPermissions: true,
        paginate: false
      })) as ProjectType[]

      console.log('got matchingAllowedRepos at', new Date().toJSON())

      context.projectPushIds = context.projectPushIds.concat(matchingAllowedRepos.map((repo) => repo.id))
    }

    if (!(await checkScope(context.params.user!, 'projects', 'read')))
      context.params.query.id = { $in: [...new Set(allowedProjects.map((project) => project.id))] }
  }
  console.log('finished ensurePushStatus at', new Date().toJSON())
}

/**
 * Adds limit and sort to the query if one is not already present
 * @param context
 * @returns
 */
const addLimitToParams = async (context: HookContext<ProjectService>) => {
  console.log('started addLimitToParams at', new Date().toJSON())
  context.params.query = {
    ...context.params.query,
    $limit: context.params?.query?.$limit || 1000,
    $sort: context.params?.query?.$sort || { name: 1 }
  }
  if (context.params?.query?.allowed) delete context.params.query.allowed
  console.log('finished addLimitToParams at', new Date().toJSON())
}

/**
 * Adds data to the result
 * @param context
 * @returns
 */
const addDataToProjectResult = async (context: HookContext<ProjectService>) => {
  console.log('started addDataToProjectResult at', new Date().toJSON())
  const data: ProjectType[] = context.result!['data'] ? context.result!['data'] : context.result
  for (const item of data) {
    try {
      const packageJson = getProjectPackageJson(item.name)
      const config = getProjectConfig(item.name)
      item.thumbnail = config.thumbnail!
      item.version = packageJson.version
      item.engineVersion = packageJson.etherealEngine?.version
      item.description = packageJson.description
      item.hasWriteAccess = context.projectPushIds.indexOf(item.id) > -1
    } catch (err) {
      //
    }
  }

  context.result =
    context.params.paginate === false
      ? data
      : {
          data: data,
          total: data.length,
          limit: context.params?.query?.$limit || 1000,
          skip: context.params?.query?.$skip || 0
        }
  console.log('finished addDataToProjectResult at', new Date().toJSON())
}

/**
 * Checks whether the project already exists
 * @param context
 * @returns
 */
const checkIfProjectExists = async (context: HookContext<ProjectService>) => {
  if (!context.data || context.method !== 'create') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }

  const data: ProjectData[] = Array.isArray(context.data) ? context.data : [context.data]

  context.projectName = cleanString(data[0].name!).toLowerCase()

  const projectExists = (await context.service._find({
    query: { name: context.projectName, $limit: 1 }
  })) as Paginated<ProjectType>

  if (projectExists.total > 0) throw new Error(`[Projects]: Project with name ${context.projectName} already exists`)
}

/**
 * Checks whether the project name is valid
 * @param context
 * @returns
 */
const checkIfNameIsValid = async (context: HookContext<ProjectService>) => {
  if (
    (!config.db.forceRefresh && context.projectName === 'default-project') ||
    context.projectName === 'template-project'
  )
    throw new Error(`[Projects]: Project name ${context.projectName} not allowed`)
}

/**
 * Uploads the local project to the storage provider
 * @param context
 * @returns
 */
const uploadLocalProject = async (context: HookContext<ProjectService>) => {
  const projectLocalDirectory = path.resolve(projectsRootFolder, context.projectName)
  if (!fs.existsSync(projectLocalDirectory)) {
    copyFolderRecursiveSync(templateFolderDirectory, projectsRootFolder)
    fs.renameSync(path.resolve(projectsRootFolder, 'template-project'), projectLocalDirectory)

    fs.mkdirSync(path.resolve(projectLocalDirectory, '.git'), { recursive: true })

    const git = useGit(path.resolve(projectLocalDirectory, '.git'))
    try {
      await git.init(true)
    } catch (e) {
      logger.warn(e)
    }

    const packageData = Object.assign({}, templateProjectJson) as any
    packageData.name = context.projectName
    packageData.etherealEngine.version = getEnginePackageJson().version
    fs.writeFileSync(path.resolve(projectLocalDirectory, 'package.json'), JSON.stringify(packageData, null, 2))

    await uploadLocalProjectToProvider(context.app, context.projectName, false)
  }
}

/**
 * Updates the data to be created
 * @param context
 * @returns
 */
const updateCreateData = async (context: HookContext<ProjectService>) => {
  if (!context.data || context.method !== 'create') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }

  const data: ProjectData[] = Array.isArray(context.data) ? context.data : [context.data]
  context.data = { ...data[0], name: context.projectName, needsRebuild: true }
}

/**
 * Links the project to a GitHub repo
 * @param context
 * @returns
 */
const linkGithubToProject = async (context: HookContext) => {
  if (!context.data || context.method !== 'patch') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }
  const data: ProjectPatch = context.data as ProjectPatch

  if (data.repositoryPath) {
    const repoPath = data.repositoryPath
    const user = context.params!.user!

    const githubIdentityProvider = (await context.app.service(identityProviderPath).find({
      query: {
        userId: user.id,
        type: 'github',
        $limit: 1
      }
    })) as Paginated<IdentityProviderType>

    const githubPathRegexExec = GITHUB_URL_REGEX.exec(repoPath)
    if (!githubPathRegexExec) throw new BadRequest('Invalid Github URL')
    if (githubIdentityProvider.data.length === 0)
      throw new Error('Must be logged in with GitHub to link a project to a GitHub repo')
    const split = githubPathRegexExec[2].split('/')
    const org = split[0]
    const repo = split[1].replace('.git', '')
    const appOrgAccess = await checkAppOrgStatus(org, githubIdentityProvider.data[0].oauthToken)
    if (!appOrgAccess)
      throw new Forbidden(
        `The organization ${org} needs to install the GitHub OAuth app ${config.authentication.oauth.github.key} in order to push code to its repositories`
      )
    const repoWriteStatus = await checkUserRepoWriteStatus(org, repo, githubIdentityProvider.data[0].oauthToken)
    if (repoWriteStatus !== 200) {
      if (repoWriteStatus === 404) {
        const orgWriteStatus = await checkUserOrgWriteStatus(org, githubIdentityProvider.data[0].oauthToken)
        if (orgWriteStatus !== 200) throw new Forbidden('You do not have write access to that organization')
      } else {
        throw new Forbidden('You do not have write access to that repo')
      }
    }
  }
}

/**
 * Gets the name of a project
 * @param context
 * @returns
 */
const getProjectName = async (context: HookContext<ProjectService>) => {
  if (!context.id) throw new BadRequest('You need to pass project id')
  context.name = ((await context.app.service(projectPath).get(context.id, context.params)) as ProjectType).name
}

/**
 * Runs the project uninstall script
 * @param context
 * @returns
 */
const runProjectUninstallScript = async (context: HookContext<ProjectService>) => {
  const projectConfig = getProjectConfig(context.name)

  if (projectConfig?.onEvent) {
    await onProjectEvent(context.app, context.name, projectConfig.onEvent, 'onUninstall')
  }
}

/**
 * Removes the project files
 * @param context
 * @returns
 */
const removeProjectFiles = async (context: HookContext<ProjectService>) => {
  if (fs.existsSync(path.resolve(projectsRootFolder, context.name))) {
    fs.rmSync(path.resolve(projectsRootFolder, context.name), { recursive: true })
  }

  logger.info(`[Projects]: removing project id "${context.id}", name: "${context.name}".`)
  await deleteProjectFilesInStorageProvider(context.name)
}

/**
 * Creates project permissions
 * @param context
 * @returns
 */
const createProjectPermission = async (context: HookContext<ProjectService>) => {
  const result = (Array.isArray(context.result) ? context.result : [context.result]) as ProjectType[]

  if (context.params?.user?.id) {
    const projectPermissionData = await projectPermissionDataResolver.resolve(
      {
        userId: context.params.user.id,
        projectId: result[0].id,
        type: 'owner'
      },
      context as any
    )
    return context.app.service(projectPermissionPath).create(projectPermissionData)
  }
  return context
}

/**
 * Removes location from a project
 * @param context
 * @returns
 */
const removeLocationFromProject = async (context: HookContext<ProjectService>) => {
  const removingLocations = await context.app.service(locationPath).find({
    query: {
      sceneId: {
        $like: `${context.name}/%` as SceneID
      }
    }
  })
  await Promise.all(
    removingLocations.data.map((removingLocation) => context.app.service(locationPath).remove(removingLocation.id))
  )
}

/**
 * Removes route from a project
 * @param context
 * @returns
 */
const removeRouteFromProject = async (context: HookContext<ProjectService>) => {
  await context.app.service(routePath).remove(null, {
    query: {
      project: context.name
    }
  })
}

/**
 * Removes avatars from a project
 * @param context
 * @returns
 */
const removeAvatarsFromProject = async (context: HookContext<ProjectService>) => {
  const avatarItems = (await context.app.service(avatarPath).find({
    query: {
      project: context.name
    },
    paginate: false
  })) as any as AvatarType[]

  await Promise.all(
    avatarItems.map(async (avatar) => {
      await context.app.service(avatarPath).remove(avatar.id)
    })
  )
}

/**
 * Removes static resources from a project
 * @param context
 * @returns
 */
const removeStaticResourcesFromProject = async (context: HookContext<ProjectService>) => {
  const staticResourceItems = (await context.app.service(staticResourcePath).find({
    query: {
      project: context.name
    },
    paginate: false
  })) as any as StaticResourceType[]
  staticResourceItems.length &&
    staticResourceItems.forEach(async (staticResource) => {
      await context.app.service(staticResourcePath).remove(staticResource.id)
    })
}

/**
 * Removes the project update job
 * @param context
 * @returns
 */
const removeProjectUpdate = async (context: HookContext<ProjectService>) => {
  await removeProjectUpdateJob(context.app, context.name)
}

/**
 * 1. Clones the repo to the local FS
 * 2. If in production mode, uploads it to the storage provider
 * 3. Creates a database entry
 * @param context Hook context
 * @returns
 */
const updateProjectJob = async (context: HookContext) => {
  if (!context.data || context.method !== 'update') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }

  const data: ProjectBuildUpdateItemType = context.data as ProjectBuildUpdateItemType
  if (!config.kubernetes.enabled || context.params?.isJob)
    context.result = await updateProject(context.app, context.data, context.params)
  else {
    const urlParts = data.sourceURL.split('/')
    let projectName = data.name || urlParts.pop()
    if (!projectName) throw new Error('Git repo must be plain URL')
    projectName = projectName.toLowerCase()
    if (projectName.substring(projectName.length - 4) === '.git') projectName = projectName.slice(0, -4)
    if (projectName.substring(projectName.length - 1) === '/') projectName = projectName.slice(0, -1)
    const date = await getDateTimeSql()
    const newJob = await context.app.service(apiJobPath).create({
      name: '',
      startTime: date,
      endTime: date,
      returnData: '',
      status: 'pending'
    })
    const jobBody = await getProjectUpdateJobBody(data, context.app, context.params!.user!.id, newJob.id)
    await context.app.service(apiJobPath).patch(newJob.id, {
      name: jobBody.metadata!.name
    })
    const jobLabelSelector = `etherealengine/projectField=${data.name},etherealengine/release=${process.env.RELEASE_NAME},etherealengine/autoUpdate=false`
    const jobFinishedPromise = createExecutorJob(context.app, jobBody, jobLabelSelector, 1000, newJob.id)
    try {
      await jobFinishedPromise
      const result = (await context.app.service(projectPath).find({
        query: {
          action: 'admin',
          name: {
            $like: projectName
          }
        }
      })) as Paginated<ProjectType>
      let returned = {} as ProjectType
      if (result.total > 0) returned = result.data[0]
      else throw new BadRequest('Project did not exist after update')
      returned.needsRebuild = typeof data.needsRebuild === 'boolean' ? data.needsRebuild : true
      returned.hasLocalChanges = false
      context.result = returned
    } catch (err) {
      console.log('Error: project did not exist after completing update', projectName, err)
      throw err
    }
  }
}

export default createSkippableHooks(
  {
    around: {
      all: [schemaHooks.resolveExternal(projectExternalResolver), schemaHooks.resolveResult(projectResolver)]
    },

    before: {
      all: [() => schemaHooks.validateQuery(projectQueryValidator), schemaHooks.resolveQuery(projectQueryResolver)],
      find: [
        enableClientPagination(),
        iffElse(isAction('admin'), [], filterDisabledProjects),
        discardQuery('action'),
        ensurePushStatus,
        discardQuery('skipProjectPermissions'),
        addLimitToParams
      ],
      get: [],
      create: [
        iff(isProvider('external'), verifyScope('editor', 'write')),
        () => schemaHooks.validateData(projectDataValidator),
        schemaHooks.resolveData(projectDataResolver),
        discardQuery('studio'),
        checkIfProjectExists,
        checkIfNameIsValid,
        uploadLocalProject,
        updateCreateData
      ],
      update: [
        iff(isProvider('external'), verifyScope('editor', 'write'), projectPermissionAuthenticate(false)),
        updateProjectJob
      ],
      patch: [
        iff(isProvider('external'), verifyScope('editor', 'write'), projectPermissionAuthenticate(false)),
        () => schemaHooks.validateData(projectPatchValidator),
        schemaHooks.resolveData(projectPatchResolver),
        iff(isProvider('external'), iffElse(checkEnabled, [], linkGithubToProject))
      ],
      remove: [
        iff(isProvider('external'), verifyScope('editor', 'write'), projectPermissionAuthenticate(false)),
        discardQuery('studio'),
        getProjectName,
        runProjectUninstallScript,
        removeProjectFiles,
        removeLocationFromProject,
        removeRouteFromProject,
        removeAvatarsFromProject,
        removeStaticResourcesFromProject,
        removeProjectUpdate
      ]
    },

    after: {
      all: [],
      find: [addDataToProjectResult],
      get: [],
      create: [createProjectPermission],
      update: [],
      patch: [],
      remove: []
    },

    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  },
  ['find']
)
