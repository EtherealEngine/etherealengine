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
  StaticResourceType,
  staticResourceMethods,
  staticResourcePath
} from '@etherealengine/engine/src/schemas/media/static-resource.schema'
import { Application } from '../../../declarations'
import authenticate from '../../hooks/authenticate'
import verifyScope from '../../hooks/verify-scope'
import { StaticResourceService } from './static-resource.class'
import staticResourceDocs from './static-resource.docs'
import hooks from './static-resource.hooks'

declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    [staticResourcePath]: StaticResourceService
    'static-resource-filters': {
      get: (data?: any, params?: any) => ReturnType<typeof getFilters>
    }
  }
}

const getFilters = async (app: Application) => {
  const mimeTypes = (await app.service(staticResourcePath).find({
    query: {
      $select: ['mimeType']
    }
  })) as StaticResourceType[]

  return {
    mimeTypes: mimeTypes.map((el) => el.mimeType)
  }
}

export default (app: Application): void => {
  const options = {
    name: staticResourcePath,
    paginate: app.get('paginate'),
    Model: app.get('knexClient'),
    multi: true
  }

  app.use(staticResourcePath, new StaticResourceService(options, app), {
    // A list of all methods this service exposes externally
    methods: staticResourceMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: staticResourceDocs
  })

  const service = app.service(staticResourcePath)
  service.hooks(hooks)

  app.use('static-resource-filters', {
    get: async (data, params) => {
      return await getFilters(app)
    }
  })

  app.service('static-resource-filters').hooks({
    before: {
      get: [authenticate(), verifyScope('admin', 'admin')]
    }
  })
}
