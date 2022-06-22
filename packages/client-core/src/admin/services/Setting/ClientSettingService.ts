import { Paginated } from '@feathersjs/feathers'

import { ClientSetting, PatchClientSetting } from '@xrengine/common/src/interfaces/ClientSetting'
import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'

import { API } from '../../../API'
import { NotificationService } from '../../../common/services/NotificationService'
import waitForClientAuthenticated from '../../../util/wait-for-client-authenticated'

const AdminClientSettingsState = defineState({
  name: 'AdminClientSettingsState',
  initial: () => ({
    client: [] as Array<ClientSetting>,
    updateNeeded: true
  })
})

export const ClientSettingsServiceReceptor = (action) => {
  getState(AdminClientSettingsState).batch((s) => {
    matches(action)
      .when(ClientSettingActions.fetchedClient.matches, (action) => {
        return s.merge({ client: action.clientSettings.data, updateNeeded: false })
      })
      .when(ClientSettingActions.clientSettingPatched.matches, (action) => {
        return s.updateNeeded.set(true)
      })
  })
}

export const accessClientSettingState = () => getState(AdminClientSettingsState)

export const useClientSettingState = () => useState(accessClientSettingState())

export const ClientSettingService = {
  fetchClientSettings: async (inDec?: 'increment' | 'decrement') => {
    try {
      await waitForClientAuthenticated()
      const clientSettings = (await API.instance.client.service('client-setting').find()) as Paginated<ClientSetting>
      dispatchAction(ClientSettingActions.fetchedClient({ clientSettings }))
    } catch (err) {
      console.log(err.message)
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  patchClientSetting: async (data: PatchClientSetting, id: string) => {
    try {
      await API.instance.client.service('client-setting').patch(id, data)
      dispatchAction(ClientSettingActions.clientSettingPatched())
    } catch (err) {
      console.log(err)
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  }
}

export class ClientSettingActions {
  static fetchedClient = defineAction({
    type: 'CLIENT_SETTING_DISPLAY' as const,
    clientSettings: matches.object as Validator<unknown, Paginated<ClientSetting>>
  })
  static clientSettingPatched = defineAction({
    type: 'CLIENT_SETTING_PATCHED' as const
  })
}
