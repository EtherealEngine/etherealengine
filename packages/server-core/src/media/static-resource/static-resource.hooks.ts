import { hooks } from '@feathersjs/authentication'
import { HookContext } from '@feathersjs/feathers'
import dauria from 'dauria'

import collectAnalytics from '@xrengine/server-core/src/hooks/collect-analytics'
import replaceThumbnailLink from '@xrengine/server-core/src/hooks/replace-thumbnail-link'
import attachOwnerIdInQuery from '@xrengine/server-core/src/hooks/set-loggedin-user-in-query'

import restrictUserRole from '../../hooks/restrict-user-role'

const { authenticate } = hooks

export default {
  before: {
    all: [],
    find: [collectAnalytics()],
    get: [],
    create: [
      authenticate('jwt'),
      restrictUserRole('admin'),
      (context: HookContext): HookContext => {
        if (!context.data.uri && context.params.file) {
          const file = context.params.file
          const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
          console.log('uri is', uri)
          const url = dauria.getBase64DataURI(file.buffer, file.mimetype)
          const mimeType = context.data.mimeType ?? file.mimetype
          console.log('mimeType is', file.mimetype)
          const name = context.data.name ?? file.name
          context.data = { uri: uri, mimeType: mimeType, name: name }
        }
        return context
      }
    ],
    update: [authenticate('jwt'), restrictUserRole('admin')],
    patch: [authenticate('jwt'), restrictUserRole('admin'), replaceThumbnailLink()],
    remove: [authenticate('jwt'), restrictUserRole('admin'), attachOwnerIdInQuery('userId')]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
} as any
