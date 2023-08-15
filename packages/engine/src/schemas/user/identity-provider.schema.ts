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
import { UserID } from '@etherealengine/engine/src/schemas/user/user.schema'
import type { Static } from '@feathersjs/typebox'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { TypedString } from '../../common/types/TypeboxUtils'
import { dataValidator, queryValidator } from '../validators'

export const identityProviderPath = 'identity-provider'

// Main data model schema
export const identityProviderSchema = Type.Object(
  {
    id: Type.String({
      format: 'uuid'
    }),
    token: Type.String({
      format: 'uuid'
    }),
    type: Type.String(),
    userId: TypedString<UserID>({
      format: 'uuid'
    }),
    accountIdentifier: Type.Optional(Type.String()),
    oauthToken: Type.Optional(Type.String()),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
  },
  { $id: 'IdentityProvider', additionalProperties: false }
)
export type IdentityProviderType = Static<typeof identityProviderSchema>

// Schema for creating new entries
export const identityProviderDataSchema = Type.Pick(
  identityProviderSchema,
  ['token', 'type', 'userId', 'accountIdentifier', 'oauthToken'],
  {
    $id: 'IdentityProviderData'
  }
)
export type IdentityProviderData = Static<typeof identityProviderDataSchema>

// Schema for updating existing entries
export const identityProviderPatchSchema = Type.Partial(identityProviderSchema, {
  $id: 'IdentityProviderPatch'
})
export type IdentityProviderPatch = Static<typeof identityProviderPatchSchema>

// Schema for allowed query properties
export const identityProviderQueryProperties = Type.Pick(identityProviderSchema, [
  'id',
  'token',
  'type',
  'userId',
  'accountIdentifier',
  'oauthToken'
])
export const identityProviderQuerySchema = Type.Intersect(
  [
    querySyntax(identityProviderQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type IdentityProviderQuery = Static<typeof identityProviderQuerySchema>

export const identityProviderValidator = getValidator(identityProviderSchema, dataValidator)
export const identityProviderDataValidator = getValidator(identityProviderDataSchema, dataValidator)
export const identityProviderPatchValidator = getValidator(identityProviderPatchSchema, dataValidator)
export const identityProviderQueryValidator = getValidator(identityProviderQuerySchema, queryValidator)
