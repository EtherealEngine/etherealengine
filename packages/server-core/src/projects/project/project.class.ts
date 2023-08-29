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
import { Id, Paginated, Params } from '@feathersjs/feathers'
import appRootPath from 'app-root-path'
import { SequelizeServiceOptions, Service } from 'feathers-sequelize'
import fs from 'fs'
import path from 'path'
import { Op } from 'sequelize'

import { GITHUB_URL_REGEX } from '@etherealengine/common/src/constants/GitHubConstants'
import {
  DefaultUpdateSchedule,
  ProjectInterface,
  ProjectUpdateType
} from '@etherealengine/common/src/interfaces/ProjectInterface'
import { routePath } from '@etherealengine/engine/src/schemas/route/route.schema'
import { locationPath } from '@etherealengine/engine/src/schemas/social/location.schema'
import { AvatarType, avatarPath } from '@etherealengine/engine/src/schemas/user/avatar.schema'
import {
  GithubRepoAccessType,
  githubRepoAccessPath
} from '@etherealengine/engine/src/schemas/user/github-repo-access.schema'
import templateProjectJson from '@etherealengine/projects/template-project/package.json'

import { StaticResourceType, staticResourcePath } from '@etherealengine/engine/src/schemas/media/static-resource.schema'
import { projectPermissionPath } from '@etherealengine/engine/src/schemas/projects/project-permission.schema'
import {
  IdentityProviderType,
  identityProviderPath
} from '@etherealengine/engine/src/schemas/user/identity-provider.schema'
import { UserType } from '@etherealengine/engine/src/schemas/user/user.schema'
import { Knex } from 'knex'
import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import { UserParams } from '../../api/root-params'
import config from '../../appconfig'
import { cleanString } from '../../util/cleanString'
import { copyFolderRecursiveSync } from '../../util/fsHelperFunctions'
import { useGit } from '../../util/gitHelperFunctions'
import { checkAppOrgStatus, checkUserOrgWriteStatus, checkUserRepoWriteStatus } from './github-helper'
import {
  createExecutorJob,
  deleteProjectFilesInStorageProvider,
  getCommitSHADate,
  getEnginePackageJson,
  getGitProjectData,
  getProjectConfig,
  getProjectPackageJson,
  getProjectUpdateJobBody,
  onProjectEvent,
  removeProjectUpdateJob,
  updateProject,
  uploadLocalProjectToProvider
} from './project-helper'

const UPDATE_JOB_TIMEOUT = 60 * 5 //5 minute timeout on project update jobs completing or failing

const templateFolderDirectory = path.join(appRootPath.path, `packages/projects/template-project/`)

const projectsRootFolder = path.join(appRootPath.path, 'packages/projects/projects/')

export type ProjectQueryParams = {
  sourceURL?: string
  destinationURL?: string
  existingProject?: boolean
  inputProjectURL?: string
  branchName?: string
  selectedSHA?: string
}

export type ProjectUpdateParams = {
  user?: UserType
  isJob?: boolean
}

export type ProjectParams = {
  user: UserType
} & Params<ProjectQueryParams>

export type ProjectParamsClient = Omit<ProjectParams, 'user'>

export class Project extends Service {
  app: Application
  docs: any

  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app

    this.app.isSetup.then(() => this._callOnLoad())
  }

  async _callOnLoad() {
    const projects = (
      (await super.find({
        query: { $select: ['name'] }
      })) as any
    ).data as Array<{ name }>
    await Promise.all(
      projects.map(async ({ name }) => {
        if (!fs.existsSync(path.join(projectsRootFolder, name, 'xrengine.config.ts'))) return
        const config = getProjectConfig(name)
        if (config?.onEvent) return onProjectEvent(this.app, name, config.onEvent, 'onLoad')
      })
    )
  }

  async _seedProject(projectName: string): Promise<any> {
    logger.warn('[Projects]: Found new locally installed project: ' + projectName)
    const projectConfig = getProjectConfig(projectName) ?? {}

    const gitData = getGitProjectData(projectName)
    const { commitSHA, commitDate } = await getCommitSHADate(projectName)
    await super.create({
      thumbnail: projectConfig.thumbnail,
      name: projectName,
      repositoryPath: gitData.repositoryPath,
      sourceRepo: gitData.sourceRepo,
      sourceBranch: gitData.sourceBranch,
      commitSHA,
      commitDate,
      needsRebuild: true,
      updateType: 'none' as ProjectUpdateType,
      updateSchedule: DefaultUpdateSchedule
    })
    // run project install script
    if (projectConfig.onEvent) {
      return onProjectEvent(this.app, projectName, projectConfig.onEvent, 'onInstall')
    }

    return Promise.resolve()
  }

  /**
   * On dev, sync the db with any projects installed locally
   */
  async _fetchDevLocalProjects() {
    const data = (await this.Model.findAll({ paginate: false })) as ProjectInterface[]

    if (!fs.existsSync(projectsRootFolder)) {
      fs.mkdirSync(projectsRootFolder, { recursive: true })
    }

    const locallyInstalledProjects = fs
      .readdirSync(projectsRootFolder, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    const promises: Promise<any>[] = []

    for (const projectName of locallyInstalledProjects) {
      if (!data.find((e) => e.name === projectName)) {
        try {
          promises.push(this._seedProject(projectName))
        } catch (e) {
          logger.error(e)
        }
      }

      const { commitSHA, commitDate } = await getCommitSHADate(projectName)

      await this.Model.update(
        { commitSHA, commitDate },
        {
          where: {
            name: projectName
          }
        }
      )

      promises.push(uploadLocalProjectToProvider(this.app, projectName))
    }

    await Promise.all(promises)
    await this._callOnLoad()

    for (const { name, id } of data) {
      if (!locallyInstalledProjects.includes(name)) {
        await deleteProjectFilesInStorageProvider(name)
        logger.warn(`[Projects]: Project ${name} not found, assuming removed`)
        await super.remove(id)
      }
    }
  }

  async create(data: { name: string }, params?: Params) {
    const projectName = cleanString(data.name)
    const projectLocalDirectory = path.resolve(projectsRootFolder, projectName)

    if (await this.Model.count({ where: { name: projectName } }))
      throw new Error(`[Projects]: Project with name ${projectName} already exists`)

    if ((!config.db.forceRefresh && projectName === 'default-project') || projectName === 'template-project')
      throw new Error(`[Projects]: Project name ${projectName} not allowed`)

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
    packageData.name = projectName
    packageData.etherealEngine.version = getEnginePackageJson().version
    fs.writeFileSync(path.resolve(projectLocalDirectory, 'package.json'), JSON.stringify(packageData, null, 2))

    await uploadLocalProjectToProvider(this.app, projectName, false)

    return super.create(
      {
        thumbnail: packageData.thumbnail,
        name: projectName,
        repositoryPath: null,
        needsRebuild: true
      },
      params
    )
  }

  /**
   * 1. Clones the repo to the local FS
   * 2. If in production mode, uploads it to the storage provider
   * 3. Creates a database entry
   * @param data
   * @param placeholder This is where data normally goes, but we've put data as the first parameter
   * @param params
   * @returns
   */
  // @ts-ignore
  async update(
    data: {
      sourceURL: string
      destinationURL: string
      name: string
      needsRebuild?: boolean
      reset?: boolean
      commitSHA?: string
      sourceBranch: string
      updateType: ProjectUpdateType
      updateSchedule: string
    },
    placeholder?: null,
    params?: ProjectUpdateParams
  ) {
    if (!config.kubernetes.enabled || params?.isJob) return updateProject(this.app, data, params)
    else {
      const urlParts = data.sourceURL.split('/')
      let projectName = data.name || urlParts.pop()
      if (!projectName) throw new Error('Git repo must be plain URL')
      projectName = projectName.toLowerCase()
      if (projectName.substring(projectName.length - 4) === '.git') projectName = projectName.slice(0, -4)
      if (projectName.substring(projectName.length - 1) === '/') projectName = projectName.slice(0, -1)
      const jobBody = await getProjectUpdateJobBody(data, this.app, params!.user!.id)
      const jobLabelSelector = `etherealengine/projectField=${data.name},etherealengine/release=${process.env.RELEASE_NAME},etherealengine/autoUpdate=false`
      const jobFinishedPromise = createExecutorJob(this.app, jobBody, jobLabelSelector, 1000)
      try {
        await jobFinishedPromise
        const result = (await super._find({
          query: {
            name: {
              $like: `${projectName}%`
            }
          }
        })) as Paginated<ProjectInterface>
        let returned = {} as ProjectInterface
        if (result.total > 0) returned = result.data[0]
        else throw new BadRequest('Project did not exist after update')
        returned.needsRebuild = typeof data.needsRebuild === 'boolean' ? data.needsRebuild : true
        return returned
      } catch (err) {
        console.log('Error: project did not exist after completing update', projectName, err)
        throw err
      }
    }
  }

  async patch(id: Id, data: any, params?: UserParams) {
    if (data.repositoryPath) {
      const repoPath = data.repositoryPath
      const user = params!.user!

      const githubIdentityProvider = (await this.app.service(identityProviderPath).find({
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
    return super.patch(id, data, params)
  }

  async remove(id: Id, params?: Params) {
    if (!id) return
    const { name } = await super.get(id, params)

    const projectConfig = getProjectConfig(name)

    // run project uninstall script
    if (projectConfig?.onEvent) {
      await onProjectEvent(this.app, name, projectConfig.onEvent, 'onUninstall')
    }

    if (fs.existsSync(path.resolve(projectsRootFolder, name))) {
      fs.rmSync(path.resolve(projectsRootFolder, name), { recursive: true })
    }

    logger.info(`[Projects]: removing project id "${id}", name: "${name}".`)
    await deleteProjectFilesInStorageProvider(name)

    await this.app.service(locationPath).remove(null, {
      query: {
        sceneId: {
          $like: `${name}/%`
        }
      }
    })

    await this.app.service(routePath).remove(null, {
      query: {
        $and: [{ project: { $ne: null } }, { project: name }]
      }
    })

    const avatarItems = (await this.app.service(avatarPath).find({
      query: {
        $and: [
          {
            project: name
          },
          {
            project: {
              $ne: null
            }
          }
        ]
      },
      paginate: false
    })) as AvatarType[]

    await Promise.all(
      avatarItems.map(async (avatar) => {
        await this.app.service(avatarPath).remove(avatar.id)
      })
    )

    const staticResourceItems = (await this.app.service(staticResourcePath).find({
      query: {
        $and: [
          {
            project: name
          },
          {
            project: {
              $ne: null
            }
          }
        ]
      },
      paginate: false
    })) as StaticResourceType[]
    staticResourceItems.length &&
      staticResourceItems.forEach(async (staticResource) => {
        await this.app.service(staticResourcePath).remove(staticResource.id)
      })

    await removeProjectUpdateJob(this.app, name)

    return super.remove(id, params)
  }

  async get(name: string, params?: Params): Promise<{ data: ProjectInterface }> {
    if (!params) params = {}
    if (!params.query) params.query = {}
    if (!params.query.$limit) params.query.$limit = 1000
    const data: ProjectInterface[] = ((await super.find(params)) as any).data
    const project = data.find((e) => e.name === name)
    if (!project) return null!
    return {
      data: project
    }
  }

  async updateSettings(id: Id, data: { settings: string }) {
    return super.patch(id, data)
  }

  //@ts-ignore
  async find(params?: UserParams): Promise<{ data: ProjectInterface[]; errors: any[] }> {
    let projectPushIds: string[] = []
    let populateProjectPermissions = false
    const errors = [] as any
    if (params?.query?.allowed != null) {
      // See if the user has a GitHub identity-provider, and if they do, also determine which GitHub repos they personally
      // can push to.

      const githubIdentityProvider = (await this.app.service(identityProviderPath).find({
        query: {
          userId: params.user!.id,
          type: 'github',
          $limit: 1
        }
      })) as Paginated<IdentityProviderType>

      // Get all of the projects that this user has permissions for, then calculate push status by whether the user
      // can push to it. This will make sure no one tries to push to a repo that they do not have write access to.
      const knexClient: Knex = this.app.get('knexClient')
      const projectPermissions = await knexClient
        .from(projectPermissionPath)
        .join('project', 'project.id', `${projectPermissionPath}.projectId`)
        .where({ userId: params.user!.id })
        .select()
        .options({ nestTables: true })

      const allowedProjects = await projectPermissions.map((permission) => permission.project)
      const repoAccess =
        githubIdentityProvider.data.length > 0
          ? ((await this.app.service(githubRepoAccessPath).find({
              query: {
                identityProviderId: githubIdentityProvider.data[0].id
              },
              paginate: false
            })) as any as GithubRepoAccessType[])
          : []
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
      const pushableAllowedProjects = allowedProjectGithubRepos.filter(
        (project) => pushRepoPaths.indexOf(project.repositoryPath.toLowerCase().replace(/.git$/, '')) > -1
      )
      projectPushIds = projectPushIds.concat(pushableAllowedProjects.map((project) => project.id))

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

        const matchingAllowedRepos = await this.app.service('project').Model.findAll({
          where: {
            repositoryPath: {
              [Op.in]: repositoryPaths
            }
          }
        })

        projectPushIds = projectPushIds.concat(matchingAllowedRepos.map((repo) => repo.id))
      }

      if (!params.user!.scopes?.find((scope) => scope.type === 'admin:admin'))
        params.query.id = { $in: [...new Set(allowedProjects.map((project) => project.id))] }
      delete params.query.allowed

      populateProjectPermissions = true
    }

    params = {
      ...params,
      query: {
        ...params?.query,
        $limit: params?.query?.$limit || 1000,
        $select: params?.query?.$select || [
          'id',
          'name',
          'repositoryPath',
          'needsRebuild',
          'sourceRepo',
          'sourceBranch',
          'updateType',
          'updateSchedule',
          'commitSHA',
          'commitDate'
        ]
      }
    }

    const data: ProjectInterface[] = ((await super.find(params)) as any).data
    for (const item of data) {
      const values = (item as any).dataValues
        ? ((item as any).dataValues as ProjectInterface)
        : (item as ProjectInterface)

      try {
        const packageJson = getProjectPackageJson(values.name)
        const config = getProjectConfig(values.name)
        values.thumbnail = config.thumbnail!
        values.version = packageJson.version
        values.engineVersion = packageJson.etherealEngine?.version
        values.description = packageJson.description
        values.hasWriteAccess = projectPushIds.indexOf(item.id) > -1
      } catch (err) {
        //
      }
    }

    return {
      data,
      errors
    }
  }
}
