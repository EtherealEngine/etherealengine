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

import { BadRequest } from '@feathersjs/errors'
import { Id, Paginated, ServiceInterface } from '@feathersjs/feathers'

import { LocationID, locationPath } from '@etherealengine/common/src/schemas/social/location.schema'

import { InstanceID, instancePath } from '@etherealengine/common/src/schemas/networking/instance.schema'
import { ScopeType, ScopeTypeInterface, scopePath } from '@etherealengine/common/src/schemas/scope/scope.schema'
import { ChannelUserType, channelUserPath } from '@etherealengine/common/src/schemas/social/channel-user.schema'
import { ChannelType, channelPath } from '@etherealengine/common/src/schemas/social/channel.schema'
import { invitePath } from '@etherealengine/common/src/schemas/social/invite.schema'
import { locationAuthorizedUserPath } from '@etherealengine/common/src/schemas/social/location-authorized-user.schema'
import {
  IdentityProviderType,
  identityProviderPath
} from '@etherealengine/common/src/schemas/user/identity-provider.schema'
import { userRelationshipPath } from '@etherealengine/common/src/schemas/user/user-relationship.schema'
import { UserID, userPath } from '@etherealengine/common/src/schemas/user/user.schema'
import { KnexAdapterParams } from '@feathersjs/knex'
import { v4 as uuidv4 } from 'uuid'
import { Application } from '../../../declarations'
import logger from '../../ServerLogger'

export interface AcceptInviteParams extends KnexAdapterParams {
  preventUserRelationshipRemoval?: boolean
}

/**
 * A class for AcceptInvite service
 */

export class AcceptInviteService implements ServiceInterface<AcceptInviteParams> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  /**
   * A funtion which display specific accept invite
   *
   * @param id of specific accept invite
   * @param params query which contain passcode
   * @returns {Object} contains single invite
   */

  async get(id: Id, params?: AcceptInviteParams) {
    let inviteeIdentityProvider
    const returned = {} as any
    if (!params) params = {}
    if (params.query?.t) {
      params.query.passcode = params.query.t
      delete params.query.t
    }
    try {
      params.provider = null!
      let invite
      try {
        invite = await this.app.service(invitePath)._get(id)
      } catch (err) {
        //
      }

      if (invite == null) {
        logger.info('INVALID INVITE ID')
        return {
          error: 'Invalid Invite ID'
        }
      }

      if (params.query!.passcode !== invite.passcode) {
        logger.info('INVALID INVITE PASSCODE')
        return {
          error: 'Invalid Invite Passcode'
        }
      }

      const dateNow = new Date()

      if (invite.timed && invite.startTime && dateNow < invite.startTime) {
        logger.info(`Invite ${invite.id} accessed before start time ${dateNow}`)
        return {
          error: 'Invite accessed too early'
        }
      }

      if (invite.timed && invite.endTime && dateNow > invite.endTime) {
        logger.info(`Invite ${invite.id} accessed after end time ${dateNow}`)
        return {
          error: 'Invite has expired'
        }
      }

      if (invite.identityProviderType != null) {
        const inviteeIdentityProviderResult = (await this.app.service(identityProviderPath).find({
          query: {
            type: invite.identityProviderType,
            token: invite.token
          }
        })) as Paginated<IdentityProviderType>

        if (inviteeIdentityProviderResult.total === 0) {
          inviteeIdentityProvider = await this.app.service(identityProviderPath).create(
            {
              type: invite.identityProviderType,
              token: invite.token,
              userId: uuidv4() as UserID
            },
            params as any
          )
        } else {
          inviteeIdentityProvider = inviteeIdentityProviderResult.data[0]
        }
      } else if (invite.inviteeId != null) {
        const invitee = await this.app.service(userPath).get(invite.inviteeId)

        if (invitee == null || invitee.identityProviders == null || invitee.identityProviders.length === 0) {
          throw new BadRequest('Invalid invitee ID')
        }

        inviteeIdentityProvider = invitee.identityProviders[0]
      }

      if (params[identityProviderPath] == null) params[identityProviderPath] = inviteeIdentityProvider

      if (invite.makeAdmin) {
        const existingAdminScope = (await this.app.service(scopePath).find({
          query: {
            userId: inviteeIdentityProvider.userId,
            type: 'admin:admin' as ScopeType
          }
        })) as Paginated<ScopeTypeInterface>
        if (existingAdminScope.total === 0)
          await this.app.service(scopePath).create({
            userId: inviteeIdentityProvider.userId,
            type: 'admin:admin' as ScopeType
          })
      }

      if (invite.inviteType === 'friend') {
        const inviter = await this.app.service(userPath).get(invite.userId)

        if (inviter == null) {
          await this.app.service(invitePath).remove(invite.id)
          throw new BadRequest('Invalid user ID')
        }

        const existingRelationshipResult = await this.app.service(userRelationshipPath).find({
          query: {
            $or: [
              {
                userRelationshipType: 'requested'
              },
              {
                userRelationshipType: 'friend'
              }
            ],
            userId: invite.userId,
            relatedUserId: inviteeIdentityProvider.userId
          }
        })

        if (existingRelationshipResult.total === 0) {
          await this.app.service(userRelationshipPath).create(
            {
              userRelationshipType: 'friend',
              userId: invite.userId,
              relatedUserId: inviteeIdentityProvider.userId
            },
            params as any
          )
        } else {
          await this.app.service(userRelationshipPath).patch(
            existingRelationshipResult.data[0].id,
            {
              userRelationshipType: 'friend'
            },
            params as any
          )
        }

        const relationshipToPatch = await this.app.service(userRelationshipPath).find({
          query: {
            $or: [
              {
                userRelationshipType: 'requested'
              },
              {
                userRelationshipType: 'friend'
              }
            ],
            userId: inviteeIdentityProvider.userId,
            relatedUserId: invite.userId
          }
        })

        if (relationshipToPatch.data.length > 0)
          await this.app.service(userRelationshipPath).patch(
            relationshipToPatch.data[0].id,
            {
              userRelationshipType: 'friend'
            },
            params as any
          )
      } else if (invite.inviteType === 'channel') {
        const channel = (await this.app
          .service(channelPath)
          .find({ query: { id: invite.targetObjectId, $limit: 1 } })) as Paginated<ChannelType>

        if (channel.total === 0) {
          await this.app.service(invitePath).remove(invite.id)
          throw new BadRequest('Invalid channel ID')
        }

        const existingChannelUser = (await this.app.service(channelUserPath).find({
          query: {
            userId: inviteeIdentityProvider.userId,
            channelId: invite.targetObjectId
          }
        })) as Paginated<ChannelUserType>

        if (existingChannelUser.total === 0) {
          await this.app.service(channelUserPath).create({
            userId: inviteeIdentityProvider.userId,
            channelId: invite.targetObjectId
          })
        }
      }

      params.preventUserRelationshipRemoval = true
      if (invite.deleteOnUse) await this.app.service(invitePath).remove(invite.id, params as any)

      returned.token = await this.app
        .service('authentication')
        .createAccessToken({}, { subject: params[identityProviderPath].id.toString() })

      if (invite.inviteType === 'location' || invite.inviteType === 'instance') {
        const instance =
          invite.inviteType === 'instance' ? await this.app.service(instancePath).get(invite.targetObjectId) : null
        const locationId = instance ? (instance.locationId as LocationID) : (invite.targetObjectId as LocationID)
        const location = await this.app.service(locationPath).get(locationId)
        returned.locationName = location.slugifiedName
        if (instance) returned.instanceId = instance.id as InstanceID

        if (location.locationSetting?.locationType === 'private') {
          const userId = inviteeIdentityProvider.userId
          if (!location.locationAuthorizedUsers.find((authUser) => authUser.userId === userId))
            await this.app.service(locationAuthorizedUserPath).create({
              locationId: location.id as LocationID,
              userId: userId as UserID
            })
        }
        if (invite.spawnDetails) {
          const spawnDetails = JSON.parse(invite.spawnDetails)
          if (invite.spawnType === 'inviteCode') returned.inviteCode = spawnDetails.inviteCode
          if (invite.spawnType === 'spawnPoint') returned.spawnPoint = spawnDetails.spawnPoint
          if (invite.spawnType === 'spectate') returned.spectate = spawnDetails.spectate
        }
      }

      return returned
    } catch (err) {
      logger.error(err)
      throw err
    }
  }
}
