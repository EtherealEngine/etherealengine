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

import {
  IdentityProviderType,
  identityProviderMethods,
  identityProviderPath
} from '@etherealengine/engine/src/schemas/user/identity.provider.schema'

import { Paginated } from '@feathersjs/feathers'
import { Application } from '../../../declarations'
import authenticate from '../../hooks/authenticate'
import { IdentityProviderService } from './identity-provider.class'
import identityProviderDocs from './identity-provider.docs'
import hooks from './identity-provider.hooks'

declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    [identityProviderPath]: IdentityProviderService
    'generate-token': any
  }
}

export default (app: Application): void => {
  const options = {
    name: identityProviderPath,
    paginate: app.get('paginate'),
    Model: app.get('knexClient'),
    multi: true
  }

  app.use('generate-token', {
    create: async ({ type, token }, params): Promise<string | null> => {
      const userId = params.user.id
      if (!token || !type) throw new Error('Must pass service and identity-provider token to generate JWT')
      const ipResult = (await app.service(identityProviderPath).find({
        query: {
          userId: userId,
          type: type,
          token: token
        }
      })) as Paginated<IdentityProviderType>
      if (ipResult.total > 0) {
        const ip = ipResult.data[0]

        const abab = app.service('authentication').createAccessToken({}, { subject: ip.id.toString() })
        console.log(abab)
        return abab
      } else return null
    }
  })

  app.service('generate-token').hooks({
    before: {
      create: [authenticate()]
    }
  })

  app.use(identityProviderPath, new IdentityProviderService(options, app), {
    // A list of all methods this service exposes externally
    methods: identityProviderMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: identityProviderDocs
  })

  const service = app.service(identityProviderPath)
  service.hooks(hooks)
}
