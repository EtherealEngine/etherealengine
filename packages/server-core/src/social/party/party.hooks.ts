import { HookOptions } from '@feathersjs/feathers'
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import Sequelize from 'sequelize'

import addAssociations from '../../hooks/add-associations'
import authenticate from '../../hooks/authenticate'
import createPartyInstance from '../../hooks/createPartyInstance'
import isInternalRequest from '../../hooks/isInternalRequest'
import restrictUserRole from '../../hooks/restrict-user-role'

// Don't remove this comment. It's needed to format import lines nicely.

export default {
  before: {
    all: [authenticate(), isInternalRequest()],
    find: [
      iff(isProvider('external'), restrictUserRole('admin') as any),
      addAssociations({
        models: [
          {
            model: 'party-user',
            include: [
              {
                model: 'user'
              }
            ]
          }
        ]
      })
    ],
    get: [
      addAssociations({
        models: [
          {
            model: 'party-user',
            include: [
              {
                model: 'user'
              }
            ]
          }
        ]
      })
    ],
    create: [],
    update: [disallow()],
    patch: [iff(isProvider('external'), restrictUserRole('admin') as any)],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      /*createPartyInstance()*/
    ],
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
} as HookOptions<any, any>
