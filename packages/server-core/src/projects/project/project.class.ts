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

import { Params } from '@feathersjs/feathers'
import appRootPath from 'app-root-path'
import fs from 'fs'
import path from 'path'

import { DefaultUpdateSchedule } from '@etherealengine/common/src/interfaces/ProjectPackageJsonType'

import { ProjectBuildUpdateItemType } from '@etherealengine/common/src/schemas/projects/project-build.schema'
import {
  ProjectData,
  ProjectPatch,
  ProjectQuery,
  ProjectType,
  ProjectUpdateParams
} from '@etherealengine/common/src/schemas/projects/project.schema'
import { getDateTimeSql, toDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import { getState } from '@etherealengine/hyperflux'
import { KnexAdapterOptions, KnexAdapterParams, KnexService } from '@feathersjs/knex'
import { v4 as uuidv4 } from 'uuid'
import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import { ServerMode, ServerState } from '../../ServerState'
import config from '../../appconfig'
import {
  deleteProjectFilesInStorageProvider,
  getCommitSHADate,
  getEnginePackageJson,
  getGitProjectData,
  getProjectConfig,
  getProjectEnabled,
  getProjectPackageJson,
  onProjectEvent,
  uploadLocalProjectToProvider
} from './project-helper'

const UPDATE_JOB_TIMEOUT = 60 * 5 //5 minute timeout on project update jobs completing or failing

const projectsRootFolder = path.join(appRootPath.path, 'packages/projects/projects/')

export interface ProjectParams extends KnexAdapterParams<ProjectQuery>, ProjectUpdateParams {}

export type ProjectParamsClient = Omit<ProjectParams, 'user'>

export class ProjectService<T = ProjectType, ServiceParams extends Params = ProjectParams> extends KnexService<
  ProjectType,
  ProjectData | ProjectBuildUpdateItemType,
  ProjectParams,
  ProjectPatch
> {
  app: Application

  constructor(options: KnexAdapterOptions, app: Application) {
    super(options)
    this.app = app

    this.app.isSetup.then(() => this._callOnLoad())
  }

  async _callOnLoad() {
    try {
      const projects = (await super._find({
        query: { $select: ['name'] },
        paginate: false
      })) as Array<{ name }>
      await Promise.all(
        projects.map(async ({ name }) => {
          if (!fs.existsSync(path.join(projectsRootFolder, name, 'xrengine.config.ts'))) return
          const config = getProjectConfig(name)
          if (config?.onEvent) return onProjectEvent(this.app, name, config.onEvent, 'onLoad')
        })
      )
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async _seedProject(projectName: string): Promise<any> {
    logger.warn('[Projects]: Found new locally installed project: ' + projectName)
    const projectConfig = getProjectConfig(projectName) ?? {}
    const enabled = getProjectEnabled(projectName)

    const gitData = getGitProjectData(projectName)
    const { commitSHA, commitDate } = await getCommitSHADate(projectName)

    await super._create({
      id: uuidv4(),
      name: projectName,
      enabled,
      repositoryPath: gitData.repositoryPath,
      sourceRepo: gitData.sourceRepo,
      sourceBranch: gitData.sourceBranch,
      commitSHA,
      commitDate: toDateTimeSql(commitDate),
      needsRebuild: true,
      hasLocalChanges: false,
      updateType: 'none' as ProjectType['updateType'],
      updateSchedule: DefaultUpdateSchedule,
      createdAt: await getDateTimeSql(),
      updatedAt: await getDateTimeSql()
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
    if (getState(ServerState).serverMode !== ServerMode.API) return

    const data = (await super._find({ paginate: false })) as ProjectType[]

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
      } else {
        /**@todo call onUpdate for project */
      }

      const { commitSHA, commitDate } = await getCommitSHADate(projectName)

      const engineVersion = getProjectPackageJson(projectName).etherealEngine?.version
      const version = getEnginePackageJson().version
      const enabled = config.allowOutOfDateProjects ? true : engineVersion === version

      await super._patch(
        null,
        { enabled, commitSHA, commitDate: toDateTimeSql(commitDate) },
        { query: { name: projectName } }
      )

      promises.push(uploadLocalProjectToProvider(this.app, projectName))
    }

    await Promise.all(promises)

    await this._callOnLoad()

    for (const { name, id } of data) {
      if (!locallyInstalledProjects.includes(name)) {
        await deleteProjectFilesInStorageProvider(name)
        logger.warn(`[Projects]: Project ${name} not found, assuming removed`)
        await super._remove(id)
      }
    }
  }
}
