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
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../validators'

export const profilingPath = 'profiling'

export const profilingMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

// Main data model schema
export const profilingSchema = Type.Object(
  {
    version: Type.String(),
    gpu: Type.String(),
    device: Type.String(),
    systemData: Type.String(),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
  },
  { $id: 'ProfilingSchema', additionalProperties: false }
)
export interface ProfilingType extends Static<typeof profilingSchema> {}

// Schema for creating new entries
export const profilingDataSchema = Type.Pick(profilingSchema, ['version', 'gpu', 'device', 'systemData'], {
  $id: 'ProfilingData'
})
export interface ProfilingData extends Static<typeof profilingDataSchema> {}

// Schema for updating existing entries
export const ProfilingPatchSchema = Type.Partial(profilingSchema, {
  $id: 'ProfilingPatch'
})
export interface ProfilingPatch extends Static<typeof ProfilingPatchSchema> {}

// Schema for allowed query properties
export const ProfilingQueryProperties = Type.Pick(profilingSchema, [
  'version',
  'gpu',
  'device'
  // 'systemData',
  // 'updatedAt'
])
export const ProfilingQuerySchema = Type.Intersect(
  [
    querySyntax(ProfilingQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export interface ProfilingQuery extends Static<typeof ProfilingQuerySchema> {}

export const ProfilingValidator = /* @__PURE__ */ getValidator(profilingSchema, dataValidator)
export const ProfilingDataValidator = /* @__PURE__ */ getValidator(profilingDataSchema, dataValidator)
export const ProfilingPatchValidator = /* @__PURE__ */ getValidator(ProfilingPatchSchema, dataValidator)
export const ProfilingQueryValidator = /* @__PURE__ */ getValidator(ProfilingQuerySchema, queryValidator)
