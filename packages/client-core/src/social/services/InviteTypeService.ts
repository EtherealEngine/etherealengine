import { Paginated } from '@feathersjs/feathers'

import { InviteType } from '@xrengine/common/src/interfaces/InviteType'
import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { addActionReceptor, defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'

import { NotificationService } from '../../common/services/NotificationService'
import { client } from '../../feathers'
import { store, useDispatch } from '../../store'

//State
const InviteTypeState = defineState({
  name: 'InviteTypeState',
  initial: () => ({
    invitesType: [] as Array<InviteType>,
    skip: 0,
    limit: 5,
    total: 0
  })
})

export const InviteTypeServiceReceptor = (action) => {
  getState(InviteTypeState).batch((s) => {
    matches(action).when(InviteTypeAction.retrievedInvitesTypes.matches, (action) => {
      return s.merge({
        invitesType: action.invitesType.data,
        skip: action.skip,
        limit: action.limit,
        total: action.total
      })
    })
  })
}

// Temporary
addActionReceptor(InviteTypeServiceReceptor)

export const accessInviteTypeState = () => getState(InviteTypeState)

export const useInviteTypeState = () => useState(accessInviteTypeState())

//Service
export const InviteTypeService = {
  retrieveInvites: async () => {
    const dispatch = useDispatch()

    dispatch(InviteTypeAction.fetchingInvitesTypes())
    try {
      const inviteTypeResult = (await client.service('invite-type').find()) as Paginated<InviteType>
      dispatch(
        InviteTypeAction.retrievedInvitesTypes({
          invitesType: inviteTypeResult,
          total: inviteTypeResult.total,
          skip: inviteTypeResult.skip,
          limit: inviteTypeResult.limit
        })
      )
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  }
}

//Action
export class InviteTypeAction {
  static retrievedInvitesTypes = defineAction({
    type: 'LOAD_INVITE_TYPE' as const,
    total: matches.number,
    limit: matches.number,
    invitesType: matches.any as Validator<unknown, Paginated<InviteType>>,
    skip: matches.number
  })

  static fetchingInvitesTypes = defineAction({
    type: 'FETCHING_RECEIVED_INVITES_TYPES' as const
  })
}
