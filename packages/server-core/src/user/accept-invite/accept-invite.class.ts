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
import { Id, NullableId, Params, ServiceMethods } from '@feathersjs/feathers'

import { locationPath } from '@etherealengine/engine/src/schemas/social/location.schema'

import { locationAuthorizedUserPath } from '@etherealengine/engine/src/schemas/social/location-authorized-user.schema'
import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import Paginated from '../../types/PageObject'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Data {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ServiceOptions {}

interface AcceptInviteParams extends Params {
  preventUserRelationshipRemoval?: boolean
}

/**
 * accept invite class for get, create, update and remove user invite
 *
 */
export class AcceptInvite implements ServiceMethods<Data> {
  app: Application
  options: ServiceOptions
  docs: any

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options
    this.app = app
  }

  async setup() {}

  /**
   * A function which help to find all accept invite and display it
   *
   * @param params number of limit and skip for pagination
   * Number should be passed as query parmas
   * @returns {@Array} all listed invite
   */
  async find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return []
  }

  /**
   * A funtion which display specific accept invite
   *
   * @param id of specific accept invite
   * @param params query which contain passcode
   * @returns {@Object} contains single invite
   */

  async get(id: Id, params?: AcceptInviteParams): Promise<Data> {
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
        invite = await this.app.service('invite').Model.findOne({
          where: {
            id: id
          }
        })
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
        const inviteeIdentityProviderResult = await this.app.service('identity-provider').find({
          query: {
            type: invite.identityProviderType,
            token: invite.token
          }
        })

        if ((inviteeIdentityProviderResult as any).total === 0) {
          inviteeIdentityProvider = await this.app.service('identity-provider').create(
            {
              type: invite.identityProviderType,
              token: invite.token
            },
            params
          )
        } else {
          inviteeIdentityProvider = (inviteeIdentityProviderResult as any).data[0]
        }
      } else if (invite.inviteeId != null) {
        const invitee = await this.app.service('user').get(invite.inviteeId)

        if (invitee == null || invitee.identity_providers == null || invitee.identity_providers.length === 0) {
          throw new BadRequest('Invalid invitee ID')
        }

        inviteeIdentityProvider = invitee.identity_providers[0]
      }

      if (params['identity-provider'] == null) params['identity-provider'] = inviteeIdentityProvider

      if (invite.makeAdmin) {
        const existingAdminScope = await this.app.service('scope').find({
          query: {
            userId: inviteeIdentityProvider.userId,
            type: 'admin:admin'
          }
        })
        if (existingAdminScope.total === 0)
          await this.app.service('scope').create({
            userId: inviteeIdentityProvider.userId,
            type: 'admin:admin'
          })
      }

      if (invite.inviteType === 'friend') {
        const inviter = await this.app.service('user').Model.findOne({ where: { id: invite.userId } })

        if (inviter == null) {
          await this.app.service('invite').remove(invite.id)
          throw new BadRequest('Invalid user ID')
        }

        const existingRelationshipResult = (await this.app.service('user-relationship').find({
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
        })) as any

        if ((existingRelationshipResult as any).total === 0) {
          await this.app.service('user-relationship').create(
            {
              userRelationshipType: 'friend',
              userId: invite.userId,
              relatedUserId: inviteeIdentityProvider.userId
            },
            params
          )
        } else {
          await this.app.service('user-relationship').patch(
            existingRelationshipResult.data[0].id,
            {
              userRelationshipType: 'friend'
            },
            params
          )
        }

        const relationshipToPatch = (await this.app.service('user-relationship').find({
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
        })) as any

        if (relationshipToPatch.data.length > 0)
          await this.app.service('user-relationship').patch(
            relationshipToPatch.data[0].id,
            {
              userRelationshipType: 'friend'
            },
            params
          )
      } else if (invite.inviteType === 'channel') {
        const channel = await this.app.service('channel').Model.findOne({ where: { id: invite.targetObjectId } })

        if (channel == null) {
          await this.app.service('invite').remove(invite.id)
          throw new BadRequest('Invalid channel ID')
        }

        const existingChannelUser = (await this.app.service('channel-user').find({
          query: {
            userId: inviteeIdentityProvider.userId,
            channelId: invite.targetObjectId
          }
        })) as any

        if (existingChannelUser.total === 0) {
          await this.app.service('channel-user').create({
            userId: inviteeIdentityProvider.userId,
            channelId: invite.targetObjectId
          })
        }
      }

      params.preventUserRelationshipRemoval = true
      if (invite.deleteOnUse) await this.app.service('invite').remove(invite.id, params)

      returned.token = await this.app
        .service('authentication')
        .createAccessToken({}, { subject: params['identity-provider'].id.toString() })

      if (invite.inviteType === 'location' || invite.inviteType === 'instance') {
        let instance =
          invite.inviteType === 'instance' ? await this.app.service('instance').get(invite.targetObjectId) : null
        const locationId = instance ? instance.locationId : invite.targetObjectId
        const location = await this.app.service(locationPath).get(locationId)
        returned.locationName = location.slugifiedName
        if (instance) returned.instanceId = instance.id

        if (location.locationSetting?.locationType === 'private') {
          const userId = inviteeIdentityProvider.userId
          if (!location.locationAuthorizedUsers.find((authUser) => authUser.userId === userId))
            await this.app.service(locationAuthorizedUserPath).create({
              locationId: location.id,
              userId: userId
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

  /**
   * A function for creating invite
   *
   * @param data which will be used for creating new accept invite
   * @param params
   */
  async create(data: Data, params?: Params): Promise<Data> {
    if (Array.isArray(data)) {
      return await Promise.all(data.map((current) => this.create(current, params)))
    }

    return data
  }

  /**
   * A function to update accept invite
   *
   * @param id of specific accept invite
   * @param data for updating accept invite
   * @param params
   * @returns Data
   */
  async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data
  }

  /**
   * A function for updating accept invite
   *
   * @param id of specific accept invite
   * @param data for updaing accept invite
   * @param params
   * @returns Data
   */
  async patch(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data
  }

  /**
   * A function for removing accept invite
   * @param id of specific accept invite
   * @param params
   * @returns id
   */
  async remove(id: NullableId, params?: Params): Promise<Data> {
    return { id }
  }
}
