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
import { disallow } from 'feathers-hooks-common'

import {
  loginTokenDataValidator,
  loginTokenPatchValidator,
  loginTokenQueryValidator
} from '@etherealengine/engine/src/schemas/user/login-token.schema'
import crypto from 'crypto'
import moment from 'moment'
import config from '../../appconfig'

import { HookContext } from '../../../declarations'
import { toDateTimeSql } from '../../util/datetime-sql'
import { LoginTokenService } from './login-token.class'
import {
  loginTokenDataResolver,
  loginTokenExternalResolver,
  loginTokenPatchResolver,
  loginTokenQueryResolver,
  loginTokenResolver
} from './login-token.resolvers'

/**
 * Generate token when creating a login token
 * @param context
 * @returns
 */
const generateToken = async (context: HookContext<LoginTokenService>) => {
  const token = crypto.randomBytes(config.authentication.bearerToken.numBytes).toString('hex')

  context.data = { ...context.data, token, expiresAt: toDateTimeSql(moment().utc().add(2, 'days').toDate()) }
}

export default {
  around: {
    all: [schemaHooks.resolveExternal(loginTokenExternalResolver), schemaHooks.resolveResult(loginTokenResolver)]
  },

  before: {
    all: [() => schemaHooks.validateQuery(loginTokenQueryValidator), schemaHooks.resolveQuery(loginTokenQueryResolver)],
    find: [disallow('external')],
    get: [disallow('external')],
    create: [
      disallow('external'),
      () => schemaHooks.validateData(loginTokenDataValidator),
      schemaHooks.resolveData(loginTokenDataResolver),
      generateToken
    ],
    update: [disallow('external')],
    patch: [
      disallow('external'),
      () => schemaHooks.validateData(loginTokenPatchValidator),
      schemaHooks.resolveData(loginTokenPatchResolver)
    ],
    remove: [disallow('external')]
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
