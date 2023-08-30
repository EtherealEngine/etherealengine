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

import { Instance as InstanceInterface } from '@etherealengine/common/src/interfaces/Instance'
import { locationPath, LocationType } from '@etherealengine/engine/src/schemas/social/location.schema'

import { instanceAttendancePath } from '@etherealengine/engine/src/schemas/networking/instance-attendance.schema'
import { InstanceID } from '@etherealengine/engine/src/schemas/networking/instance.schema'
import { scopePath, ScopeType } from '@etherealengine/engine/src/schemas/scope/scope.schema'
import { userRelationshipPath } from '@etherealengine/engine/src/schemas/user/user-relationship.schema'
import { UserID, userPath } from '@etherealengine/engine/src/schemas/user/user.schema'
import { Knex } from 'knex'
import { Application } from '../../../declarations'
import { UserParams } from '../../api/root-params'
import authenticate from '../../hooks/authenticate'
import setLoggedInUser from '../../hooks/set-loggedin-user-in-body'
import logger from '../../ServerLogger'
import { Instance } from './instance.class'
import instanceDocs from './instance.docs'
import hooks from './instance.hooks'
import createModel from './instance.model'

declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    instance: Instance
    'instance-friends': {
      find: ReturnType<typeof getActiveInstancesForUserFriends>
    }
  }
}

type ActiveInstance = {
  id: InstanceID
  location: string
  currentUsers: number
}

// TODO: paginate this

export const getActiveInstancesForUserFriends = (app: Application) => async (data: UserParams, params) => {
  if (!data.user) throw new Error('User not found')
  try {
    const instances = (await app.service('instance').Model.findAll({
      where: {
        ended: false
      }
    })) as InstanceInterface[]

    const filteredInstances = (
      await Promise.all(
        instances.map(async (instance) => {
          const knexClient: Knex = app.get('knexClient')

          const instanceAttendance = await knexClient
            .from(instanceAttendancePath)
            .join('instance', `${instanceAttendancePath}.instanceId`, '=', `${'instance'}.id`)
            .join(userPath, `${instanceAttendancePath}.userId`, '=', `${userPath}.id`)
            .join(userRelationshipPath, `${userPath}.id`, '=', `${userRelationshipPath}.userId`)
            .where(`${instanceAttendancePath}.ended`, '=', false)
            .andWhere(`${instanceAttendancePath}.isChannel`, '=', false)
            .andWhere(`${'instance'}.id`, '=', instance.id)
            .andWhere(`${userRelationshipPath}.userRelationshipType`, '=', 'friend')
            .andWhere(`${userRelationshipPath}.relatedUserId`, '=', data.user!.id)
            .select()
            .options({ nestTables: true })

          if (instanceAttendance.length > 0) return instance
        })
      )
    ).filter(Boolean)

    // TODO: Populating location property here manually. Once instance service is moved to feathers 5. This should be part of its resolver.

    const locationIds = filteredInstances
      .map((instance) => (instance?.locationId ? instance.locationId : undefined))
      .filter((instance) => instance !== undefined) as string[]

    const locations = (await app.service(locationPath)._find({
      query: {
        id: {
          $in: locationIds
        }
      },
      paginate: false
    })) as LocationType[]

    for (const instance of filteredInstances) {
      if (instance && instance.locationId) {
        instance.location = locations.find((item) => item.id === instance.locationId)!
      }
    }

    return filteredInstances
  } catch (err) {
    console.log(err)
    return []
  }
}

export default (app: Application) => {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  }

  /**
   * Initialize our service with any options it requires and docs
   */
  const event = new Instance(options, app)
  event.docs = instanceDocs
  app.use('instance', event)

  const service = app.service('instance')

  service.hooks(hooks)

  /**
   * A method used to remove specific instance
   *
   * @param data
   * @returns deleted channel
   */
  service.publish('removed', async (data): Promise<any> => {
    try {
      const adminScopes = (await app.service(scopePath).find({
        query: {
          type: 'admin:admin'
        },
        paginate: false
      })) as ScopeType[]

      const targetIds = adminScopes.map((admin) => admin.userId)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return await Promise.all(
        targetIds.map((userId: UserID) =>
          app.channel(`userIds/${userId}`).send({
            instance: data
          })
        )
      )
    } catch (err) {
      logger.error(err)
      throw err
    }
  })

  service.publish('patched', async (data: InstanceInterface): Promise<any> => {
    try {
      /** Remove channel if instance is a world server and it has ended */
      if (data.locationId && data.ended && !data.channelId) {
        const channel = await app.service('channel').Model.findOne({
          where: {
            instanceId: data.id
          }
        })
        await app.service('channel').remove(channel.id)
      }
    } catch (e) {
      // fine - channel already cleaned up elsewhere
    }
  })

  app.use('instance-friends', {
    find: getActiveInstancesForUserFriends(app)
  })

  app.service('instance-friends').hooks({
    before: {
      find: [authenticate(), setLoggedInUser('userId')]
    }
  })
}
