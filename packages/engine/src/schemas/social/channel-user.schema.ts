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
import { UserID, userSchema } from '@etherealengine/engine/src/schemas/user/user.schema'
import type { Static } from '@feathersjs/typebox'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { TypedString } from '../../common/types/TypeboxUtils'
import { dataValidator, queryValidator } from '../validators'
import { ChannelID } from './channel.schema'

export const channelUserPath = 'channel-user'

export const channelUserMethods = ['get', 'find', 'create', 'patch', 'remove'] as const

// Main data model schema
export const channelUserSchema = Type.Object(
  {
    id: Type.String({
      format: 'uuid'
    }),
    isOwner: Type.Boolean(),
    channelId: TypedString<ChannelID>({
      format: 'uuid'
    }),
    userId: TypedString<UserID>({
      format: 'uuid'
    }),
    user: Type.Optional(Type.Ref(userSchema)),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
  },
  { $id: 'ChannelUser', additionalProperties: false }
)
export type ChannelUserType = Static<typeof channelUserSchema>

// Schema for creating new entries
export const channelUserDataSchema = Type.Partial(channelUserSchema, {
  $id: 'ChannelUserData'
})
export type ChannelUserData = Static<typeof channelUserDataSchema>

// Schema for updating existing entries
export const channelUserPatchSchema = Type.Partial(channelUserSchema, {
  $id: 'ChannelUserPatch'
})
export type ChannelUserPatch = Static<typeof channelUserPatchSchema>

// Schema for allowed query properties
export const channelUserQueryProperties = Type.Pick(channelUserSchema, ['id', 'userId', 'isOwner', 'channelId'])
export const channelUserQuerySchema = Type.Intersect(
  [
    querySyntax(channelUserQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ChannelUserQuery = Static<typeof channelUserQuerySchema>

export const channelUserValidator = getValidator(channelUserSchema, dataValidator)
export const channelUserDataValidator = getValidator(channelUserDataSchema, dataValidator)
export const channelUserPatchValidator = getValidator(channelUserPatchSchema, dataValidator)
export const channelUserQueryValidator = getValidator(channelUserQuerySchema, queryValidator)
