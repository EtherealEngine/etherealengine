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
import { v4 as uuidv4 } from 'uuid'

import {
  UserRelationshipID,
  UserRelationshipQuery,
  UserRelationshipType
} from '@etherealengine/common/src/schemas/user/user-relationship.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { userPath } from '@etherealengine/common/src/schemas/user/user.schema'
import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export const userRelationshipResolver = resolve<UserRelationshipType, HookContext>({
  createdAt: virtual(async (userRelationship) => fromDateTimeSql(userRelationship.createdAt)),
  updatedAt: virtual(async (userRelationship) => fromDateTimeSql(userRelationship.updatedAt))
})

export const userRelationshipExternalResolver = resolve<UserRelationshipType, HookContext>({
  user: virtual(async (userRelationship, context) => {
    if (userRelationship.userId) return await context.app.service(userPath).get(userRelationship.userId)
  }),
  relatedUser: virtual(async (userRelationship, context) => {
    if (userRelationship.relatedUserId) return await context.app.service(userPath).get(userRelationship.relatedUserId)
  })
})

export const userRelationshipDataResolver = resolve<UserRelationshipType, HookContext>({
  id: async () => {
    return uuidv4() as UserRelationshipID
  },
  createdAt: getDateTimeSql,
  updatedAt: getDateTimeSql
})

export const userRelationshipPatchResolver = resolve<UserRelationshipType, HookContext>({
  updatedAt: getDateTimeSql
})

export const userRelationshipQueryResolver = resolve<UserRelationshipQuery, HookContext>({})
