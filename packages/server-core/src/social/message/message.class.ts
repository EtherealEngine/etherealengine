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
import { SequelizeServiceOptions, Service } from 'feathers-sequelize'

import { Channel } from '@etherealengine/engine/src/schemas/interfaces/Channel'
import { Message as MessageInterface } from '@etherealengine/engine/src/schemas/interfaces/Message'

import { ChannelID } from '@etherealengine/common/src/dbmodels/Channel'
import { instanceAttendanceDBPath } from '@etherealengine/engine/src/schemas/networking/instance-attendance.schema'
import { UserId, UserType, userPath } from '@etherealengine/engine/src/schemas/user/user.schema'
import { Knex } from 'knex'
import { Application } from '../../../declarations'
import { UserParams } from '../../api/root-params'

export interface MessageParams extends UserParams {
  'identity-provider': {
    userId: UserId
  }
}

export type MessageDataType = MessageInterface

export type CreateMessageDataType = {
  channelId?: ChannelID
  instanceId?: string
  text: string
  isNotification?: boolean
}

export class Message<T = MessageDataType> extends Service<T> {
  app: Application
  docs: any
  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  /**
   * A function which is used to create a message
   *
   * @param data for new message
   * @param params contain user info
   * @returns {@Object} created message
   */
  // @ts-ignore
  async create(data: CreateMessageDataType, params?: MessageParams): Promise<T> {
    let channel: Channel | null = null
    let userIdList: any[] = []
    const loggedInUser = params!.user as UserType
    const userId = loggedInUser?.id
    const givenChannelId = data.channelId
    const instanceId = data.instanceId
    const channelModel = this.app.service('channel').Model

    if (givenChannelId) channel = await this.app.service('channel').get(givenChannelId)

    if (!channel) {
      if (instanceId) {
        const targetInstance = await this.app.service('instance').get(instanceId)
        if (targetInstance == null) {
          throw new BadRequest('Invalid target instance ID')
        }
        channel = await channelModel.findOne({
          where: {
            instanceId
          }
        })
        if (channel == null) {
          channel = (await this.app.service('channel').create({
            instanceId
          })) as Channel
        }

        const knexClient: Knex = this.app.get('knexClient')

        const instanceUsers = await knexClient
          .from(userPath)
          .join(instanceAttendanceDBPath, `${instanceAttendanceDBPath}.userId`, `${userPath}.id`)
          .where(`${instanceAttendanceDBPath}.instanceId`, instanceId)
          .limit(1000)
          .select()
          .options({ nestTables: true })

        userIdList = instanceUsers.map((instanceUser) => instanceUser.user.id)
      }
    }
    if (!channel) throw new BadRequest('Could not find or create channel')

    const messageData = {
      senderId: userId,
      channelId: channel.id,
      text: data.text,
      isNotification: data.isNotification
    }
    const newMessage = (await super.create(messageData as any)) as MessageInterface
    newMessage.sender = loggedInUser

    return newMessage as T
  }
}
