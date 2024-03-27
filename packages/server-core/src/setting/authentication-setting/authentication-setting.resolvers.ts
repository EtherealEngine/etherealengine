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
  AuthAppCredentialsType,
  AuthBearerTokenType,
  AuthCallbackType,
  AuthDefaultsType,
  AuthenticationSettingDatabaseType,
  AuthenticationSettingQuery,
  AuthenticationSettingType,
  AuthJwtOptionsType,
  AuthOauthType,
  AuthStrategiesType
} from '@etherealengine/common/src/schemas/setting/authentication-setting.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { AuthenticationSettingPatch } from '@etherealengine/common/src/schemas/setting/authentication-setting.schema'
import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export const authenticationSettingSchemaToDb = (patch: AuthenticationSettingPatch) => {
  return {
    ...patch,
    authStrategies:
      patch.authStrategies && typeof patch.authStrategies !== 'string'
        ? JSON.stringify(patch.authStrategies)
        : patch.authStrategies,
    jwtOptions:
      patch.jwtOptions && typeof patch.jwtOptions !== 'string' ? JSON.stringify(patch.jwtOptions) : patch.jwtOptions,
    bearerToken:
      patch.bearerToken && typeof patch.bearerToken !== 'string'
        ? JSON.stringify(patch.bearerToken)
        : patch.bearerToken,
    callback: patch.callback && typeof patch.callback !== 'string' ? JSON.stringify(patch.callback) : patch.callback,
    oauth: patch.oauth && typeof patch.oauth !== 'string' ? JSON.stringify(patch.oauth) : patch.oauth
  }
}

export const authenticationDbToSchema = (rawData: AuthenticationSettingDatabaseType): AuthenticationSettingType => {
  if (rawData.oauth && typeof rawData.oauth !== 'string') {
    // Did following because oauth string was incorrect
    rawData.oauth = Object.values(rawData.oauth).join('')
  }

  let authStrategies = JSON.parse(rawData.authStrategies) as AuthStrategiesType[]

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof authStrategies === 'string') {
    authStrategies = JSON.parse(authStrategies)
  }

  let jwtOptions: AuthJwtOptionsType | undefined = undefined
  if (rawData.jwtOptions) {
    jwtOptions = JSON.parse(rawData.jwtOptions) as AuthJwtOptionsType

    // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
    // was serialized multiple times, therefore we need to parse it twice.
    if (typeof jwtOptions === 'string') {
      jwtOptions = JSON.parse(jwtOptions)
    }
  }

  let bearerToken: AuthBearerTokenType | undefined = undefined
  if (rawData.bearerToken) {
    bearerToken = JSON.parse(rawData.bearerToken) as AuthBearerTokenType

    // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
    // was serialized multiple times, therefore we need to parse it twice.
    if (typeof bearerToken === 'string') {
      bearerToken = JSON.parse(bearerToken)
    }
  }

  let callback: AuthCallbackType | undefined = undefined
  if (rawData.callback) {
    callback = JSON.parse(rawData.callback) as AuthCallbackType

    // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
    // was serialized multiple times, therefore we need to parse it twice.
    if (typeof callback === 'string') {
      callback = JSON.parse(callback)
    }
  }

  let oauth: AuthOauthType | undefined = undefined
  if (rawData.oauth) {
    oauth = JSON.parse(rawData.oauth) as AuthOauthType

    // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
    // was serialized multiple times, therefore we need to parse it twice.
    if (typeof oauth === 'string') {
      oauth = JSON.parse(oauth)

      // We need to deserialized nested objects of pre-feathers 5 data.
      if (typeof oauth!.defaults === 'string') {
        oauth!.defaults = JSON.parse(oauth!.defaults) as AuthDefaultsType
      }

      if (typeof oauth!.facebook === 'string') {
        oauth!.facebook = JSON.parse(oauth!.facebook) as AuthAppCredentialsType
      }

      if (typeof oauth!.github === 'string') {
        oauth!.github = JSON.parse(oauth!.github) as AuthAppCredentialsType
      }

      if (typeof oauth!.google === 'string') {
        oauth!.google = JSON.parse(oauth!.google) as AuthAppCredentialsType
      }

      if (typeof oauth!.linkedin === 'string') {
        oauth!.linkedin = JSON.parse(oauth!.linkedin) as AuthAppCredentialsType
      }

      if (typeof oauth!.twitter === 'string') {
        oauth!.twitter = JSON.parse(oauth!.twitter) as AuthAppCredentialsType
      }

      if (typeof oauth!.discord === 'string') {
        oauth!.discord = JSON.parse(oauth!.discord) as AuthAppCredentialsType
      }
    }
  }

  return {
    ...rawData,
    authStrategies,
    jwtOptions,
    bearerToken,
    callback,
    oauth
  }
}

export const authenticationSettingResolver = resolve<AuthenticationSettingType, HookContext>(
  {
    createdAt: virtual(async (authenticationSetting) => fromDateTimeSql(authenticationSetting.createdAt)),
    updatedAt: virtual(async (authenticationSetting) => fromDateTimeSql(authenticationSetting.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return authenticationDbToSchema(rawData)
    }
  }
)

export const authenticationSettingExternalResolver = resolve<AuthenticationSettingType, HookContext>({})

export const authenticationSettingDataResolver = resolve<AuthenticationSettingDatabaseType, HookContext>(
  {
    id: async () => {
      return uuidv4()
    },
    createdAt: getDateTimeSql,
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        authStrategies: JSON.stringify(rawData.authStrategies),
        jwtOptions: JSON.stringify(rawData.jwtOptions),
        bearerToken: JSON.stringify(rawData.bearerToken),
        callback: JSON.stringify(rawData.callback),
        oauth: JSON.stringify(rawData.oauth)
      }
    }
  }
)

export const authenticationSettingPatchResolver = resolve<AuthenticationSettingType, HookContext>({
  updatedAt: getDateTimeSql
})

export const authenticationSettingQueryResolver = resolve<AuthenticationSettingQuery, HookContext>({})
