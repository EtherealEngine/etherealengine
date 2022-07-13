import { ThemeMode } from './ClientSetting'
import { IdentityProvider } from './IdentityProvider'
import { LocationAdmin } from './LocationAdmin'
import { LocationBan } from './LocationBan'
import { Party } from './Party'
import { StaticResourceInterface } from './StaticResourceInterface'
import { UserApiKey } from './UserApiKey'
import { UserId } from './UserId'
import { RelationshipType } from './UserRelationship'

export interface UserSetting {
  id: string
  spatialAudioEnabled: boolean
  volume?: number
  audio: number
  microphone: number
  themeModes: ThemeMode
}

export interface UserScope {
  type: string
  id: string
}

export interface UserInterface {
  id: UserId
  name: string
  userRole?: string
  avatarId?: string
  identity_providers?: IdentityProvider[]
  identityProviders?: IdentityProvider[]
  locationAdmins?: LocationAdmin[]
  relationType?: RelationshipType
  inverseRelationType?: RelationshipType
  avatarUrl?: string
  instanceId?: string
  channelInstanceId?: string
  partyId?: string
  locationBans?: LocationBan[]
  user_setting?: UserSetting
  inviteCode?: string
  party?: Party
  scopes?: UserScope[]
  apiKey: UserApiKey
  static_resources?: StaticResourceInterface
}

export const UserSeed: UserInterface = {
  id: '' as UserId,
  name: '',
  userRole: '',
  avatarId: '',
  apiKey: {
    id: '',
    token: '',
    userId: '' as UserId
  },
  identityProviders: [],
  locationAdmins: []
}

export interface CreateEditUser {
  name: string
  avatarId?: string
  inviteCode?: string
  userRole: string
  scopes?: UserScope[]
}

export function resolveUser(user: any): UserInterface {
  let returned = user
  if (user?.identity_providers) {
    returned = {
      ...returned,
      identityProviders: user.identity_providers
    }
  }
  if (user?.location_admins && user.location_admins.length > 0) {
    returned = {
      ...returned,
      locationAdmins: user.location_admins
    }
  }
  if (user?.location_bans && user.location_bans.length > 0) {
    returned = {
      ...returned,
      locationBans: user.location_bans
    }
  }
  if (user?.user_api_key && user.user_api_key.id) {
    returned = {
      ...returned,
      apiKey: user.user_api_key
    }
  }

  // console.log('Returned user:')
  // console.log(returned)
  return returned
}

export function resolveWalletUser(credentials: any): UserInterface {
  let returned = {
    id: '' as UserId,
    instanceId: credentials.user.id,
    name: credentials.user.displayName,
    userRole: 'guest',
    avatarId: credentials.user.id,
    identityProviders: [],
    locationAdmins: [],
    avatarUrl: credentials.user.icon,
    apiKey: credentials.user.apiKey || { id: '', token: '', userId: '' as UserId }
  }

  return returned
}
