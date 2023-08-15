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
import { v4 } from 'uuid'

import { UserID, UserQuery, UserType } from '@etherealengine/engine/src/schemas/user/user.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import {
  InstanceAttendanceType,
  instanceAttendancePath
} from '@etherealengine/engine/src/schemas/networking/instance-attendance.schema'
import { ScopeType, scopePath } from '@etherealengine/engine/src/schemas/scope/scope.schema'
import { LocationAdminType, locationAdminPath } from '@etherealengine/engine/src/schemas/social/location-admin.schema'
import { LocationBanType, locationBanPath } from '@etherealengine/engine/src/schemas/social/location-ban.schema'
import { avatarPath } from '@etherealengine/engine/src/schemas/user/avatar.schema'
import {
  IdentityProviderType,
  identityProviderPath
} from '@etherealengine/engine/src/schemas/user/identity-provider.schema'
import { UserApiKeyType, userApiKeyPath } from '@etherealengine/engine/src/schemas/user/user-api-key.schema'
import { UserSettingType, userSettingPath } from '@etherealengine/engine/src/schemas/user/user-setting.schema'
import { getDateTimeSql } from '../../util/get-datetime-sql'

export const userResolver = resolve<UserType, HookContext>({
  avatar: virtual(async (user, context) => {
    if (user.avatarId) {
      const avatar = await context.app.service(avatarPath).get(user.avatarId)
      return avatar
    }
  }),
  userSetting: virtual(async (user, context) => {
    const userSetting = (await context.app.service(userSettingPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as UserSettingType[]

    return userSetting.length > 0 ? userSetting[0] : undefined
  }),
  apiKey: virtual(async (user, context) => {
    const apiKey = (await context.app.service(userApiKeyPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as UserApiKeyType[]

    return apiKey.length > 0 ? apiKey[0] : undefined
  }),
  identityProviders: virtual(async (user, context) => {
    //TODO: We should replace `as any as IdentityProviderType[]` with `as IdentityProviderType[]` once identity-provider service is migrated to feathers 5.
    const identityProviders = (await context.app.service(identityProviderPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as any as IdentityProviderType[]

    return identityProviders
  }),
  locationAdmins: virtual(async (user, context) => {
    //TODO: We should replace `as any as LocationAdminType[]` with `as LocationAdminType[]` once location-admin service is migrated to feathers 5.
    const locationAdmins = (await context.app.service(locationAdminPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as any as LocationAdminType[]
    return locationAdmins
  }),
  locationBans: virtual(async (user, context) => {
    const locationBans = (await context.app.service(locationBanPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as LocationBanType[]
    return locationBans
  }),
  scopes: virtual(async (user, context) => {
    //TODO: We should replace `as any as ScopeType[]` with `as ScopeType[]` once scope service is migrated to feathers 5.
    const scopes = (await context.app.service(scopePath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as any as ScopeType[]
    return scopes
  }),
  instanceAttendance: virtual(async (user, context) => {
    if (context.params.user?.id === context.arguments[0]) {
      const instanceAttendance = (await context.app.service(instanceAttendancePath).find({
        query: {
          userId: user.id,
          ended: false
        },
        paginate: false
      })) as InstanceAttendanceType[]
      return instanceAttendance
    }

    return []
  })
})

export const userExternalResolver = resolve<UserType, HookContext>({
  isGuest: async (value, user) => !!user.isGuest // https://stackoverflow.com/a/56523892/2077741
})

export const userDataResolver = resolve<UserType, HookContext>({
  id: async (id) => {
    return id || (v4() as UserID)
  },
  name: async (name) => {
    return name || 'Guest #' + Math.floor(Math.random() * (999 - 100 + 1) + 100)
  },
  createdAt: getDateTimeSql,
  updatedAt: getDateTimeSql
})

export const userPatchResolver = resolve<UserType, HookContext>({
  updatedAt: getDateTimeSql
})

export const userQueryResolver = resolve<UserQuery, HookContext>({})
