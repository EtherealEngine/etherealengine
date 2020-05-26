import * as authentication from '@feathersjs/authentication'
// Don't remove this comment. It's needed to format import lines nicely.

import formatMessage from '../../hooks/format-message'
import validateMessage from '../../hooks/validate-message'
import addMessageReceipient from '../../hooks/add-message-receiptant'

const { authenticate } = authentication.hooks

export default {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validateMessage()],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [addMessageReceipient(), formatMessage()],
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
}
