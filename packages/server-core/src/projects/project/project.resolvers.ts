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

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, virtual } from '@feathersjs/schema'
import { v4 } from 'uuid'

import {
  ProjectPermissionType,
  projectPermissionPath
} from '@etherealengine/common/src/schemas/projects/project-permission.schema'
import {
  ProjectDatabaseType,
  ProjectQuery,
  ProjectSettingType,
  ProjectType
} from '@etherealengine/common/src/schemas/projects/project.schema'
import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import type { HookContext } from '@etherealengine/server-core/declarations'

export const projectDbToSchema = (rawData: ProjectDatabaseType): ProjectType => {
  let settings: ProjectSettingType[]

  if (typeof rawData.settings === 'string') {
    settings = JSON.parse(rawData.settings) as ProjectSettingType[]

    // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
    // was serialized multiple times, therefore we need to parse it twice.
    if (typeof settings === 'string') {
      settings = JSON.parse(settings)

      // There are some old records in our database that requires further parsing.
      if (typeof settings === 'string') {
        settings = JSON.parse(settings)
      }
    }
  } else {
    settings = rawData.settings
  }

  return {
    ...rawData,
    settings
  } as ProjectType
}

export const projectResolver = resolve<ProjectType, HookContext>(
  {
    projectPermissions: virtual(async (project, context) => {
      console.log('resolving projectPermissions in projectResolver at', new Date().toJSON())
      const returned = (await context.app.service(projectPermissionPath).find({
        query: {
          projectId: project.id
        },
        paginate: false
      })) as any as ProjectPermissionType[]
      console.log('finished resolving projectPermissions in projectResolver at', new Date().toJSON())
      return returned
    }),

    commitDate: virtual(async (project) => {
      if (project.commitDate) return fromDateTimeSql(project.commitDate)
    }),
    createdAt: virtual(async (project) => fromDateTimeSql(project.createdAt)),
    updatedAt: virtual(async (project) => fromDateTimeSql(project.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return projectDbToSchema(rawData)
    }
  }
)

export const projectExternalResolver = resolve<ProjectType, HookContext>({})

export const projectDataResolver = resolve<ProjectDatabaseType, HookContext>(
  {
    id: async () => {
      return v4()
    },
    createdAt: getDateTimeSql,
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        settings: JSON.stringify(rawData.settings)
      }
    }
  }
)

export const projectPatchResolver = resolve<ProjectType, HookContext>(
  {
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        settings: JSON.stringify(rawData.settings)
      }
    }
  }
)

export const projectQueryResolver = resolve<ProjectQuery, HookContext>({})
