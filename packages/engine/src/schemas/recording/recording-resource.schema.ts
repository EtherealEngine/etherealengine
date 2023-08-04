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
import { querySyntax, Type } from '@feathersjs/typebox'
import { TypedString } from '../../common/types/TypeboxUtils'
import { staticResourceSchema } from '../media/static-resource.schema'
import { RecordingID } from './recording.schema'

export const recordingResourcePath = 'recording-resource'

export const recordingResourceMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

// Main data model schema
export const recordingResourceSchema = Type.Object(
  {
    id: Type.String({
      format: 'uuid'
    }),
    recordingId: TypedString<RecordingID, 'uuid'>({
      format: 'uuid'
    }),
    staticResourceId: Type.String({
      format: 'uuid'
    }),
    staticResource: Type.Ref(staticResourceSchema),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
  },
  { $id: 'RecordingResource', additionalProperties: false }
)
export type RecordingResourceType = Static<typeof recordingResourceSchema>

// Schema for creating new entries
export const recordingResourceDataSchema = Type.Pick(recordingResourceSchema, ['recordingId', 'staticResourceId'], {
  $id: 'RecordingResourceData'
})
export type RecordingResourceData = Static<typeof recordingResourceDataSchema>

// Schema for updating existing entries
export const recordingResourcePatchSchema = Type.Partial(recordingResourceSchema, {
  $id: 'RecordingResourcePatch'
})
export type RecordingResourcePatch = Static<typeof recordingResourcePatchSchema>

// Schema for allowed query properties
export const recordingResourceQueryProperties = Type.Pick(recordingResourceSchema, [
  'id',
  'recordingId',
  'staticResourceId'
])
export const recordingResourceQuerySchema = Type.Intersect(
  [
    querySyntax(recordingResourceQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type RecordingResourceQuery = Static<typeof recordingResourceQuerySchema>
