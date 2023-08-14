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

import { t } from 'i18next'
import React, { useEffect } from 'react'

import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { addActionReceptor, defineActionQueue, getState, removeActionReceptor } from '@etherealengine/hyperflux'

import { MediaConsumerActions } from '@etherealengine/engine/src/networking/systems/MediaProducerConsumerState'
import {
  LocationInstanceConnectionService,
  LocationInstanceConnectionServiceReceptor
} from '../common/services/LocationInstanceConnectionService'
import {
  MediaInstanceConnectionService,
  MediaInstanceConnectionServiceReceptor,
  MediaInstanceState
} from '../common/services/MediaInstanceConnectionService'
import { NetworkConnectionService } from '../common/services/NetworkConnectionService'
import { PeerMediaConsumers } from '../media/PeerMedia'
import { ChannelState } from '../social/services/ChannelService'
import { FriendServiceReceptor } from '../social/services/FriendService'
import { LocationState } from '../social/services/LocationService'
import { WarningUIService } from '../systems/WarningUISystem'
import { SocketWebRTCClientNetwork, receiveConsumerHandler } from '../transports/SocketWebRTCClientFunctions'
import { AuthState } from '../user/services/AuthService'
import { DataChannelSystem } from './DataChannelSystem'
import { InstanceProvisioning } from './NetworkInstanceProvisioning'

const noWorldServersAvailableQueue = defineActionQueue(NetworkConnectionService.actions.noWorldServersAvailable.matches)
const noMediaServersAvailableQueue = defineActionQueue(NetworkConnectionService.actions.noMediaServersAvailable.matches)
const worldInstanceDisconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.worldInstanceDisconnected.matches
)
const worldInstanceKickedQueue = defineActionQueue(NetworkConnectionService.actions.worldInstanceKicked.matches)
const mediaInstanceDisconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.mediaInstanceDisconnected.matches
)
const worldInstanceReconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.worldInstanceReconnected.matches
)
const mediaInstanceReconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.mediaInstanceReconnected.matches
)
const consumerCreatedQueue = defineActionQueue(MediaConsumerActions.consumerCreated.matches)

const execute = () => {
  const locationState = getState(LocationState)
  const chatState = getState(ChannelState)
  const authState = getState(AuthState)
  const engineState = getState(EngineState)

  for (const action of consumerCreatedQueue())
    receiveConsumerHandler(Engine.instance.mediaNetwork as SocketWebRTCClientNetwork, action)

  for (const action of noWorldServersAvailableQueue()) {
    const currentLocationID = locationState.currentLocation.location.id
    /** @todo - revisit reconnection UX */
    // WarningUIService.openWarning({
    //   title: t('common:instanceServer.noAvailableServers'),
    //   body: t('common:instanceServer.noAvailableServersMessage'),
    //   action: (timeout) => timeout && LocationInstanceConnectionService.provisionServer(currentLocationID)
    // })
    setTimeout(() => {
      LocationInstanceConnectionService.provisionServer(currentLocationID)
    }, 2000)
  }

  for (const action of noMediaServersAvailableQueue()) {
    const channels = chatState.channels.channels
    const activeChannel = Object.values(channels).find((channel) => channel.id === chatState.targetChannelId)

    if (!activeChannel) {
      // setTimeout(() => {
      //   ChannelState.getInstanceChannel()
      //   updateWarningModal(WarningModalTypes.NO_MEDIA_SERVER_PROVISIONED)
      // }, 2000)
    } else {
      /** @todo - revisit reconnection UX */
      // WarningUIService.openWarning({
      //   title: t('common:instanceServer.noAvailableServers'),
      //   body: t('common:instanceServer.noAvailableServersMessage'),
      //   timeout: 15,
      //   action: (timeout) => timeout && MediaInstanceConnectionService.provisionServer(channelId, false)
      // })
      setTimeout(() => {
        MediaInstanceConnectionService.provisionServer(activeChannel.id, false)
      }, 2000)
    }
  }

  for (const action of worldInstanceDisconnectedQueue()) {
    const transport = Engine.instance.worldNetwork as SocketWebRTCClientNetwork
    if (engineState.isTeleporting || transport.reconnecting) continue

    const currentLocationID = locationState.currentLocation.location.id
    /** @todo - revisit reconnection UX */
    // WarningUIService.openWarning({
    //   title: t('common:instanceServer.worldDisconnected'),
    //   body: t('common:instanceServer.worldDisconnectedMessage'),
    //   // action: () => window.location.reload(),
    //   timeout: 30
    // })
    setTimeout(() => {
      LocationInstanceConnectionService.provisionServer(currentLocationID)
    }, 2000)
  }

  for (const action of worldInstanceKickedQueue()) {
    WarningUIService.openWarning({
      title: t('common:instanceServer.youKickedFromWorld'),
      body: `${t('common:instanceServer.youKickedFromWorldMessage')}: ${action.message}`
    })
  }

  for (const action of mediaInstanceDisconnectedQueue()) {
    const transport = Engine.instance.mediaNetwork as SocketWebRTCClientNetwork
    const mediaInstanceState = getState(MediaInstanceState)
    if (transport?.reconnecting) continue

    const channels = chatState.channels.channels
    const activeChannel = Object.values(channels).find((channel) => channel.id === chatState.targetChannelId)
    if (activeChannel && !mediaInstanceState.joiningNewMediaChannel) {
      /** @todo - revisit reconnection UX */
      // WarningUIService.openWarning({
      //   title: 'Media disconnected',
      //   body: "You've lost your connection with the media server. We'll try to reconnect when the following time runs out.",
      //   action: (timeout) => timeout && MediaInstanceConnectionService.provisionServer(channelId, false),
      //   timeout: 15
      // })
      setTimeout(() => {
        MediaInstanceConnectionService.provisionServer(activeChannel.id, false)
      }, 2000)
    }
  }

  for (const action of worldInstanceReconnectedQueue()) {
    WarningUIService.closeWarning()
  }

  for (const action of mediaInstanceReconnectedQueue()) {
    WarningUIService.closeWarning()
  }
}

const reactor = () => {
  useEffect(() => {
    addActionReceptor(LocationInstanceConnectionServiceReceptor)
    addActionReceptor(MediaInstanceConnectionServiceReceptor)
    addActionReceptor(FriendServiceReceptor)

    return () => {
      // todo replace with subsystems
      removeActionReceptor(LocationInstanceConnectionServiceReceptor)
      removeActionReceptor(MediaInstanceConnectionServiceReceptor)
      removeActionReceptor(FriendServiceReceptor)
    }
  }, [])

  return (
    <>
      <PeerMediaConsumers />
      <InstanceProvisioning />
    </>
  )
}

export const ClientNetworkingSystem = defineSystem({
  uuid: 'ee.client.ClientNetworkingSystem',
  execute,
  reactor,
  subSystems: [DataChannelSystem]
})
