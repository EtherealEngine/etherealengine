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
import { Op } from 'sequelize'

import { Channel } from '@etherealengine/common/src/interfaces/Channel'
import { Message as MessageInterface } from '@etherealengine/common/src/interfaces/Message'
import { UserInterface } from '@etherealengine/common/src/interfaces/User'

import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import { UserParams } from '../../user/user/user.class'

export interface MessageParams extends UserParams {
  'identity-provider': {
    userId: string
  }
}

export type MessageDataType = MessageInterface

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
  async create(data: any, params?: MessageParams): Promise<T> {
    let channel: Channel | null = null
    let userIdList: any[] = []
    const loggedInUser = params!.user as UserInterface
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
        const instanceUsers = await this.app.service('user').find({
          query: {
            $limit: 1000
          },
          sequelize: {
            include: [
              {
                model: this.app.service('instance-attendance').Model,
                as: 'instanceAttendance',
                where: {
                  instanceId
                }
              }
            ]
          }
        })
        userIdList = (instanceUsers as any).data.map((instanceUser) => {
          return instanceUser.id
        })
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

    await Promise.all(
      userIdList.map((mappedUserId: string) => {
        return this.app.service('message-status').create({
          userId: mappedUserId,
          messageId: newMessage.id,
          status: userId === mappedUserId ? 'read' : 'unread'
        })
      })
    )

    // await this.app.service('channel').patch(channelId, {})

    return newMessage as T
  }
}
