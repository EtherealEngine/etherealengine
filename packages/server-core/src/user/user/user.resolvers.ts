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
import { InviteCode, UserID, UserName, UserQuery, UserType } from '@etherealengine/common/src/schemas/user/user.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'
import { resolve, virtual } from '@feathersjs/schema'
import { v4 as uuidv4 } from 'uuid'

import {
  InstanceAttendanceType,
  instanceAttendancePath
} from '@etherealengine/common/src/schemas/networking/instance-attendance.schema'
import { instancePath } from '@etherealengine/common/src/schemas/networking/instance.schema'
import { ScopeTypeInterface, scopePath } from '@etherealengine/common/src/schemas/scope/scope.schema'
import { LocationAdminType, locationAdminPath } from '@etherealengine/common/src/schemas/social/location-admin.schema'
import { LocationBanType, locationBanPath } from '@etherealengine/common/src/schemas/social/location-ban.schema'
import { locationPath } from '@etherealengine/common/src/schemas/social/location.schema'
import { avatarPath } from '@etherealengine/common/src/schemas/user/avatar.schema'
import {
  IdentityProviderType,
  identityProviderPath
} from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { UserApiKeyType, userApiKeyPath } from '@etherealengine/common/src/schemas/user/user-api-key.schema'
import { UserAvatarType, userAvatarPath } from '@etherealengine/common/src/schemas/user/user-avatar.schema'
import { UserSettingType, userSettingPath } from '@etherealengine/common/src/schemas/user/user-setting.schema'
import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import getFreeInviteCode from '../../util/get-free-invite-code'

export const userResolver = resolve<UserType, HookContext>({
  avatarId: virtual(async (user, context) => {
    const userAvatars = (await context.app.service(userAvatarPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as UserAvatarType[]

    return userAvatars.length > 0 ? userAvatars[0].avatarId : undefined
  }),
  identityProviders: virtual(async (user, context) => {
    return (await context.app.service(identityProviderPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as IdentityProviderType[]
  }),
  scopes: virtual(async (user, context) => {
    return (await context.app.service(scopePath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as ScopeTypeInterface[]
  }),
  instanceAttendance: virtual(async (user, context) => {
    if (context.params.user?.id === context.id) {
      const instanceAttendance = (await context.app.service(instanceAttendancePath).find({
        query: {
          userId: user.id,
          ended: false
        },
        paginate: false
      })) as InstanceAttendanceType[]

      for (const attendance of instanceAttendance || []) {
        if (attendance.instanceId)
          attendance.instance = await context.app.service(instancePath).get(attendance.instanceId)
        if (attendance.instance && attendance.instance.locationId) {
          attendance.instance.location = await context.app.service(locationPath).get(attendance.instance.locationId)
        }
      }

      return instanceAttendance
    }

    return []
  }),
  createdAt: virtual(async (user) => fromDateTimeSql(user.createdAt)),
  updatedAt: virtual(async (user) => fromDateTimeSql(user.updatedAt))
})

export const userExternalResolver = resolve<UserType, HookContext>({
  avatar: virtual(async (user, context) => {
    if (context.params?.actualQuery?.skipAvatar) return {}
    if (context.event !== 'removed' && user.avatarId)
      try {
        return await context.app.service(avatarPath).get(user.avatarId, { query: { skipUser: true } })
      } catch (err) {
        return {}
      }
  }),
  identityProviders: virtual(async (user, context) => {
    return (
      (await context.app.service(identityProviderPath).find({
        query: {
          userId: user.id
        },
        paginate: false
      })) as IdentityProviderType[]
    ).map((ip) => {
      const { oauthToken, ...returned } = ip
      return returned
    })
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
  locationAdmins: virtual(async (user, context) => {
    return (await context.app.service(locationAdminPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as LocationAdminType[]
  }),
  locationBans: virtual(async (user, context) => {
    return (await context.app.service(locationBanPath).find({
      query: {
        userId: user.id
      },
      paginate: false
    })) as LocationBanType[]
  }),
  isGuest: async (value, user) => !!user.isGuest // https://stackoverflow.com/a/56523892/2077741
})

export const userDataResolver = resolve<UserType, HookContext>({
  id: async (id) => {
    return id || (uuidv4() as UserID)
  },
  name: async (name) => {
    return name || (('Guest #' + Math.floor(Math.random() * (999 - 100 + 1) + 100)) as UserName)
  },
  inviteCode: async (inviteCode, _, context) => {
    return inviteCode || ((await getFreeInviteCode(context.app)) as InviteCode)
  },
  avatarId: async (avatarId) => {
    return avatarId || undefined
  },
  createdAt: getDateTimeSql,
  updatedAt: getDateTimeSql
})

export const userPatchResolver = resolve<UserType, HookContext>({
  updatedAt: getDateTimeSql
})

export const userQueryResolver = resolve<UserQuery, HookContext>({})
