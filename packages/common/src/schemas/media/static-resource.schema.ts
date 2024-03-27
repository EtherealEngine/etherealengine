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
import type { Static } from '@feathersjs/typebox'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { TypedString } from '../../types/TypeboxUtils'
import { UserID } from '../user/user.schema'
import { dataValidator, queryValidator } from '../validators'

export const staticResourcePath = 'static-resource'

export const staticResourceMethods = ['get', 'find', 'create', 'patch', 'remove'] as const

// Main data model schema
export const staticResourceSchema = Type.Object(
  {
    id: Type.String({
      format: 'uuid'
    }),
    sid: Type.String(),
    key: Type.String(),
    metadata: Type.Any(),
    mimeType: Type.String(),
    userId: TypedString<UserID>({
      format: 'uuid'
    }),
    hash: Type.String(),
    project: Type.String(),
    driver: Type.String(),
    attribution: Type.String(),
    licensing: Type.String(),
    tags: Type.Array(Type.String()),
    url: Type.String(),
    stats: Type.Record(Type.String(), Type.Any()),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    thumbnailURL: Type.String(),
    thumbnailType: Type.String()
  },
  { $id: 'StaticResource', additionalProperties: false }
)
export interface StaticResourceType extends Static<typeof staticResourceSchema> {}

export interface StaticResourceDatabaseType extends Omit<StaticResourceType, 'metadata' | 'tags' | 'stats'> {
  metadata: string
  tags: string
  stats: string
}

// Schema for creating new entries
export const staticResourceDataSchema = Type.Partial(staticResourceSchema, { $id: 'StaticResourceData' })
export interface StaticResourceData extends Static<typeof staticResourceDataSchema> {}

// Schema for updating existing entries
export const staticResourcePatchSchema = Type.Partial(staticResourceSchema, {
  $id: 'StaticResourcePatch'
})
export interface StaticResourcePatch extends Static<typeof staticResourcePatchSchema> {}

// Schema for allowed query properties
export const staticResourceQueryProperties = Type.Pick(staticResourceSchema, [
  'id',
  'sid',
  'key',
  // 'metadata', Commented out because: https://discord.com/channels/509848480760725514/1093914405546229840/1095101536121667694
  'mimeType',
  'userId',
  'hash',
  'project',
  'driver',
  'attribution',
  'licensing',
  'tags',
  'url'
  // 'stats'
])
export const staticResourceQuerySchema = Type.Intersect(
  [
    querySyntax(staticResourceQueryProperties, {
      key: {
        $like: Type.String()
      },
      mimeType: {
        $like: Type.String()
      },
      tags: {
        $like: Type.String()
      }
    }),
    // Add additional query properties here
    Type.Object(
      {
        action: Type.Optional(Type.String())
      },
      { additionalProperties: false }
    )
  ],
  { additionalProperties: false }
)
export interface StaticResourceQuery extends Static<typeof staticResourceQuerySchema> {}

export const staticResourceValidator = /* @__PURE__ */ getValidator(staticResourceSchema, dataValidator)
export const staticResourceDataValidator = /* @__PURE__ */ getValidator(staticResourceDataSchema, dataValidator)
export const staticResourcePatchValidator = /* @__PURE__ */ getValidator(staticResourcePatchSchema, dataValidator)
export const staticResourceQueryValidator = /* @__PURE__ */ getValidator(staticResourceQuerySchema, queryValidator)
