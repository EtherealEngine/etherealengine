import { Forbidden } from '@feathersjs/errors'
import { Params } from '@feathersjs/feathers/lib'
import { SequelizeServiceOptions, Service } from 'feathers-sequelize'
import { Op, Sequelize } from 'sequelize'

import { PartyUser as PartyUserDataType } from '@xrengine/common/src/interfaces/PartyUser'
import { UserInterface } from '@xrengine/common/src/interfaces/User'

import { Application } from '../../../declarations'
import logger from '../../logger'
import { PartyModelStatic } from '../party/party.model'
import { PartyUserModelStatic } from './party-user.model'

/**
 * A class for Party user service
 */
export class PartyUser<T = PartyUserDataType> extends Service<T> {
  app: Application
  docs: any
  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  async find(params?: Params): Promise<any> {
    try {
      const loggedInUser = params!.user as UserInterface
      const isInternalOrAdmin = (params && params.isInternalRequest) || loggedInUser?.userRole === 'admin'

      if (!isInternalOrAdmin && !loggedInUser) return null!

      const where = {} as any

      if (!isInternalOrAdmin) where.userId = loggedInUser.id
      if (params?.query) {
        if (typeof params.query.partyId !== 'undefined') where.partyId = params.query.partyId
        if (typeof params.query.userId !== 'undefined') where.userId = params.query.userId
        if (typeof params.query.isOwner !== 'undefined') where.isOwner = params.query.isOwner
      }

      console.log('where', where)
      const PartyUserMS = this.app.service('party-user').Model as PartyUserModelStatic
      const users = await PartyUserMS.findAll({
        where,
        include: [
          {
            model: this.app.service('user').Model,
            include: [
              {
                model: this.app.service('static-resource').Model,
                on: Sequelize.literal(
                  '`user`.`avatarId` = `user->static_resources`.`name` AND `user->static_resources`.`staticResourceType` = "user-thumbnail"'
                )
              }
            ]
          }
        ]
      })

      return { data: users }
    } catch (e) {
      logger.error(e)
      return null!
    }
  }

  async create(data: any, params?: Params): Promise<any> {
    const self = this
    if (!params) return null!

    try {
      const party = await this.app.service('party').get(data.partyId, {
        include: [{ model: this.app.service('channel').Model }]
      })

      console.log('party before create party-user', party)
      if (!party) return null!

      const existingPartyUsers = await this.app.service('party-user').find({
        query: {
          userId: data.userId
        }
      })

      await Promise.all(
        existingPartyUsers.data.map((partyUser) => {
          return new Promise(async (resolve, reject) => {
            try {
              console.log('Removing party user', partyUser)
              await self.app.service('party-user').remove(partyUser.id)
              console.log('Removed party user', partyUser.id)
              resolve()
            } catch (err) {
              reject(err)
            }
          })
        })
      )
      const partyUser = await super.create(data)
      console.log('new partyUser', partyUser)
      const user = await this.app.service('user').get(partyUser.userId)

      await this.app.service('user').patch(partyUser.userId, { partyId: partyUser.partyId })

      await this.app.service('message').create(
        {
          targetObjectId: partyUser.partyId,
          targetObjectType: 'party',
          text: `${user.name} joined the party`,
          isNotification: true
        },
        {
          'identity-provider': {
            userId: partyUser.userId
          }
        }
      )

      return partyUser
    } catch (err) {
      logger.error(err)
      return null!
    }
  }

  async patch(id: string, data: any, params?: Params): Promise<any> {
    try {
      const partyUserToPatch = await this.app.service('party-user').get(id)
      if (partyUserToPatch.userId !== params.user!.id && params.user.userRole !== 'admin')
        throw new Forbidden('You do not own that party user')

      // If we're removing ownership from the party owner somehow, make another party user the owner (if there is another)
      if (partyUserToPatch.isOwner && data.isOwner === false) {
        const otherPartyUsers = await this.app.service('party-user').find({
          query: {
            partyId: partyUserToPatch.partyId,
            userId: {
              $ne: partyUserToPatch.userId
            }
          }
        })

        if (otherPartyUsers.total > 0)
          await this.app.service('party-user').patch(otherPartyUsers.data[0].id, {
            isOwner: true
          })
      }

      return super.patch(id, data, params)
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async remove(id: string, params?: Params): Promise<any> {
    try {
      console.log('party-user remove', id)
      const partyUser = await this.app.service('party-user').get(id)

      const partyUserCount = await this.app.service('party-user').Model.count({ where: { partyId: partyUser.partyId } })

      if (partyUserCount <= 1) {
        await this.app.service('party').remove(partyUser.partyId)
        return partyUser
      } else if (partyUser.isOwner) {
        const oldestPartyUser = await this.app.service('party-user').find({
          query: {
            partyId: partyUser.partyId
          },
          $sort: {
            updatedAt: 1
          }
        })

        await this.app.service('party-user').patch(oldestPartyUser.id, { isOwner: true })
      }

      await this.app.service('user').patch(partyUser.userId, {
        partyId: null
      })

      return super.remove(id, params)
    } catch (err) {
      logger.error(err)
      throw err
    }
  }
}
