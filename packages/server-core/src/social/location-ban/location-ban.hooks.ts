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
import { getValidator } from '@feathersjs/typebox'
import { disallow, iff, isProvider } from 'feathers-hooks-common'

import {
  locationBanDataSchema,
  locationBanPatchSchema,
  locationBanQuerySchema,
  locationBanSchema
} from '@etherealengine/engine/src/schemas/social/location-ban.schema'
import { dataValidator, queryValidator } from '@etherealengine/server-core/validators'

import authenticate from '../../hooks/authenticate'
import verifyLocationAdmin from '../../hooks/verify-location-admin'
import {
  locationBanDataResolver,
  locationBanExternalResolver,
  locationBanPatchResolver,
  locationBanQueryResolver,
  locationBanResolver
} from './location-ban.resolvers'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const locationBanValidator = getValidator(locationBanSchema, dataValidator)
const locationBanDataValidator = getValidator(locationBanDataSchema, dataValidator)
const locationBanPatchValidator = getValidator(locationBanPatchSchema, dataValidator)
const locationBanQueryValidator = getValidator(locationBanQuerySchema, queryValidator)

export default {
  around: {
    all: [schemaHooks.resolveExternal(locationBanExternalResolver), schemaHooks.resolveResult(locationBanResolver)]
  },

  before: {
    all: [
      authenticate(),
      () => schemaHooks.validateQuery(locationBanQueryValidator),
      schemaHooks.resolveQuery(locationBanQueryResolver)
    ],
    find: [],
    get: [],
    create: [
      iff(isProvider('external'), verifyLocationAdmin()),
      () => schemaHooks.validateData(locationBanDataValidator),
      schemaHooks.resolveData(locationBanDataResolver)
    ],
    update: [disallow()],
    patch: [
      disallow(),
      () => schemaHooks.validateData(locationBanPatchValidator),
      schemaHooks.resolveData(locationBanPatchResolver)
    ],
    remove: [iff(isProvider('external'), verifyLocationAdmin())]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
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
