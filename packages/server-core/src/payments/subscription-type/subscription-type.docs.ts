/**
 * An object for swagger documentation configuration
 */
export default {
  definitions: {
    'subscription-type': {
      type: 'object',
      properties: {
        plan: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        type: {
          type: 'string'
        },
        description: {
          type: 'string'
        },
        amount: {
          type: 'integer'
        },
        seats: {
          type: 'string'
        }
      }
    },
    'subscription-type_list': {
      type: 'array',
      items: { $ref: '#/definitions/subscription-type' }
    }
  }
}
