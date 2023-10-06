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
import { disallow, iff, isProvider } from 'feathers-hooks-common'

import authenticate from '../../hooks/authenticate'
import verifyProjectOwner from '../../hooks/verify-project-owner'

import { INVITE_CODE_REGEX, USER_ID_REGEX } from '@etherealengine/common/src/constants/IdConstants'
import {
  ProjectPermissionData,
  ProjectPermissionType,
  projectPermissionDataValidator,
  projectPermissionPatchValidator,
  projectPermissionPath,
  projectPermissionQueryValidator
} from '@etherealengine/engine/src/schemas/projects/project-permission.schema'
import { projectPath } from '@etherealengine/engine/src/schemas/projects/project.schema'
import { UserID, UserType, userPath } from '@etherealengine/engine/src/schemas/user/user.schema'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { Paginated } from '@feathersjs/feathers'
import { HookContext } from '../../../declarations'
import logger from '../../ServerLogger'
import { ProjectPermissionService } from './project-permission.class'
import {
  projectPermissionDataResolver,
  projectPermissionExternalResolver,
  projectPermissionPatchResolver,
  projectPermissionQueryResolver,
  projectPermissionResolver
} from './project-permission.resolvers'

const ensureInviteCode = async (context: HookContext<ProjectPermissionService>) => {
  if (!context.data || context.method !== 'create') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }

  const data: ProjectPermissionData[] = Array.isArray(context.data) ? context.data : [context.data]

  if (data[0].inviteCode && USER_ID_REGEX.test(data[0].inviteCode)) {
    context.data[0].userId = data[0].inviteCode as UserID
    delete context.data[0].inviteCode
  }
  if (data[0].userId && INVITE_CODE_REGEX.test(data[0].userId)) {
    context.data[0].inviteCode = data[0].userId
    delete context.data[0].userId
  }
}

const checkExistingPermissions = async (context: HookContext<ProjectPermissionService>) => {
  if (!context.data || context.method !== 'create') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }

  const data: ProjectPermissionData[] = Array.isArray(context.data) ? context.data : [context.data]

  const selfUser = context.params!.user!
  //
  try {
    const searchParam = data[0].inviteCode
      ? {
          inviteCode: data[0].inviteCode
        }
      : {
          id: data[0].userId
        }
    const users = (await context.app.service(userPath).find({
      query: searchParam
    })) as Paginated<UserType>
    if (users.data.length === 0) throw new BadRequest('Invalid user ID and/or user invite code')
    const existing = (await context.app.service(projectPermissionPath).find({
      query: {
        projectId: data[0].projectId,
        userId: users.data[0].id
      }
    })) as Paginated<ProjectPermissionType>
    if (existing.total > 0) context.result = existing.data[0]
    const project = await context.app.service(projectPath).get(data[0].projectId!)

    if (!project) throw new BadRequest('Invalid project ID')
    const existingPermissionsCount = (await context.app.service(projectPermissionPath).find({
      query: {
        projectId: data[0].projectId
      },
      paginate: false
    })) as any as ProjectPermissionType[]
    delete data[0].inviteCode

    context.data = {
      ...context.data,
      userId: users.data[0].id,
      type:
        data[0].type === 'owner' ||
        existingPermissionsCount.length === 0 ||
        (selfUser.scopes?.find((scope) => scope.type === 'admin:admin') && selfUser.id === users.data[0].id)
          ? 'owner'
          : 'user'
    }
  } catch (err) {
    logger.error(err)
    throw err
  }
}

const checkUserScopes = async (context: HookContext<ProjectPermissionService>) => {
  if (!context.params.user) return false
  if (context.params.user.scopes.find((scope) => scope.type === 'admin:admin')) return false
  return true
}

const checkPermissionStatus = async (context: HookContext<ProjectPermissionService>) => {
  if (context.params.query?.projectId) {
    const permissionStatus = (await context.service._find({
      query: {
        projectId: context.params.query.projectId,
        userId: context.params.user!.id,
        $limit: 1
      }
    })) as Paginated<ProjectPermissionType>
    if (permissionStatus.data.length === 0)
      context.params.query = { ...context.params.query, userId: context.params.user!.id }
  }
}

const ensureOwnership = async (context: HookContext<ProjectPermissionService>) => {
  const loggedInUser = context.params!.user!
  if (loggedInUser.scopes?.find((scope) => scope.type === 'admin:admin')) return context
  const result = (Array.isArray(context.result) ? context.result : [context.result]) as ProjectPermissionType[]
  if (result[0].userId !== loggedInUser.id) throw new Forbidden('You do not own this project-permission')
}

const ensureTypeInPatch = async (context: HookContext<ProjectPermissionService>) => {
  if (!context.data || context.method !== 'patch') {
    throw new BadRequest(`${context.path} service only works for data in ${context.method}`)
  }

  const data: ProjectPermissionData[] = Array.isArray(context.data) ? context.data : [context.data]
  context.data = { type: data[0].type === 'owner' ? 'owner' : 'user' }
}

const makeRandomProjectOwner = async (context: HookContext<ProjectPermissionService>) => {
  const result = (Array.isArray(context.result) ? context.result : [context.result]) as ProjectPermissionType[]
  if (context.id && context.result) await context.service.makeRandomProjectOwnerIfNone(result[0].projectId)
}

export default {
  around: {
    all: [
      schemaHooks.resolveExternal(projectPermissionExternalResolver),
      schemaHooks.resolveResult(projectPermissionResolver)
    ]
  },

  before: {
    all: [
      authenticate(),
      () => schemaHooks.validateQuery(projectPermissionQueryValidator),
      schemaHooks.resolveQuery(projectPermissionQueryResolver)
    ],
    find: [iff(checkUserScopes, checkPermissionStatus)],
    get: [],
    create: [
      iff(isProvider('external'), verifyProjectOwner()),
      () => schemaHooks.validateData(projectPermissionDataValidator),
      schemaHooks.resolveData(projectPermissionDataResolver),
      ensureInviteCode,
      checkExistingPermissions
    ],
    update: [disallow()],
    patch: [
      iff(isProvider('external'), verifyProjectOwner()),
      () => schemaHooks.validateData(projectPermissionPatchValidator),
      schemaHooks.resolveData(projectPermissionPatchResolver),
      ensureTypeInPatch
    ],
    remove: [iff(isProvider('external'), verifyProjectOwner())]
  },

  after: {
    all: [],
    find: [],
    get: [ensureOwnership],
    create: [],
    update: [],
    patch: [makeRandomProjectOwner],
    remove: [makeRandomProjectOwner]
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
} as any
