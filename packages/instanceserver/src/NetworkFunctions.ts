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

import _ from 'lodash'
import { Spark } from 'primus'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { Instance } from '@etherealengine/common/src/interfaces/Instance'
import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'
import { respawnAvatar } from '@etherealengine/engine/src/avatar/functions/respawnAvatar'
import checkPositionIsValid from '@etherealengine/engine/src/common/functions/checkPositionIsValid'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { getComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { NetworkPeerFunctions } from '@etherealengine/engine/src/networking/functions/NetworkPeerFunctions'
import { WorldState } from '@etherealengine/engine/src/networking/interfaces/WorldState'
import { EntityNetworkState } from '@etherealengine/engine/src/networking/state/EntityNetworkState'
import { updatePeers } from '@etherealengine/engine/src/networking/systems/OutgoingActionSystem'
import { GroupComponent } from '@etherealengine/engine/src/scene/components/GroupComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { dispatchAction, getMutableState, getState } from '@etherealengine/hyperflux'
import { Action } from '@etherealengine/hyperflux/functions/ActionFunctions'
import { Application } from '@etherealengine/server-core/declarations'
import config from '@etherealengine/server-core/src/appconfig'
import { localConfig } from '@etherealengine/server-core/src/config'
import multiLogger from '@etherealengine/server-core/src/ServerLogger'
import { ServerState } from '@etherealengine/server-core/src/ServerState'
import getLocalServerIp from '@etherealengine/server-core/src/util/get-local-server-ip'

import { NetworkObjectComponent } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'
import { NetworkState } from '@etherealengine/engine/src/networking/NetworkState'
import { MediasoupTransportState } from '@etherealengine/engine/src/networking/systems/MediasoupTransportState'
import { instanceAuthorizedUserPath } from '@etherealengine/engine/src/schemas/networking/instance-authorized-user.schema'
import { inviteCodeLookupPath } from '@etherealengine/engine/src/schemas/social/invite-code-lookup.schema'
import { userKickPath } from '@etherealengine/engine/src/schemas/user/user-kick.schema'
import { UserID, UserType } from '@etherealengine/engine/src/schemas/user/user.schema'
import { toDateTimeSql } from '@etherealengine/server-core/src/util/get-datetime-sql'
import { InstanceServerState } from './InstanceServerState'
import { SocketWebRTCServerNetwork, WebRTCTransportExtension } from './SocketWebRTCServerFunctions'

const logger = multiLogger.child({ component: 'instanceserver:network' })
const isNameRegex = /instanceserver-([a-zA-Z0-9]{5}-[a-zA-Z0-9]{5})/

export const setupIPs = async () => {
  const app = Engine.instance.api as Application

  const serverState = getState(ServerState)
  const instanceServerState = getMutableState(InstanceServerState)

  if (config.kubernetes.enabled) {
    await cleanupOldInstanceservers(app)
    instanceServerState.instanceServer.set(await serverState.agonesSDK.getGameServer())
  }

  // Set up our instanceserver according to our current environment
  const announcedIp = config.kubernetes.enabled
    ? instanceServerState.instanceServer.value.status.address
    : (await getLocalServerIp(instanceServerState.isMediaInstance.value)).ipAddress

  // @todo put this in hyperflux state
  localConfig.mediasoup.webRtcTransport.listenIps = [
    {
      ip: '0.0.0.0',
      announcedIp
    }
  ]

  localConfig.mediasoup.webRtcServerOptions.listenInfos.forEach((listenInfo) => {
    listenInfo.announcedIp = announcedIp
    listenInfo.ip = '0.0.0.0'
  })

  localConfig.mediasoup.plainTransport.listenIp = {
    ip: '0.0.0.0',
    announcedIp
  }

  localConfig.mediasoup.recording.ip = announcedIp
}

export async function cleanupOldInstanceservers(app: Application): Promise<void> {
  const serverState = getState(ServerState)

  const instances = await app.service('instance').Model.findAndCountAll({
    offset: 0,
    limit: 1000,
    where: {
      ended: false
    }
  })
  const instanceservers = await serverState.k8AgonesClient.listNamespacedCustomObject(
    'agones.dev',
    'v1',
    'default',
    'gameservers'
  )

  await Promise.all(
    instances.rows.map((instance) => {
      if (!instance.ipAddress) return false
      const [ip, port] = instance.ipAddress.split(':')
      const match = (instanceservers?.body! as any).items.find((is) => {
        if (is.status.ports == null || is.status.address === '') return false
        const inputPort = is.status.ports.find((port) => port.name === 'default')
        return is.status.address === ip && inputPort.port.toString() === port
      })
      return match == null
        ? app.service('instance').patch(instance.id, {
            ended: true
          })
        : Promise.resolve()
    })
  )

  const isIds = (instanceservers?.body! as any).items.map((is) =>
    isNameRegex.exec(is.metadata.name) != null ? isNameRegex.exec(is.metadata.name)![1] : null
  )
  return
}

/**
 * Returns true if a user has permission to access a specific instance
 * @param app
 * @param instance
 * @param userId
 * @returns
 */
export const authorizeUserToJoinServer = async (app: Application, instance: Instance, userId: UserID) => {
  const authorizedUsers = (await app.service(instanceAuthorizedUserPath).find({
    query: {
      instanceId: instance.id,
      $limit: 0
    }
  })) as any
  if (authorizedUsers.total > 0) {
    const thisUserAuthorized = (await app.service(instanceAuthorizedUserPath).find({
      query: {
        instanceId: instance.id,
        userId,
        $limit: 0
      }
    })) as any
    if (thisUserAuthorized.total === 0) {
      logger.info(`User "${userId}" not authorized to be on this server.`)
      return false
    }
  }

  // check if user is not kicked in the instance for a duration
  const currentDate = new Date()
  const userKick = (await app.service(userKickPath).find({
    query: {
      userId,
      instanceId: instance.id,
      duration: {
        $gt: toDateTimeSql(currentDate)
      },
      $limit: 0
    }
  })) as any
  if (userKick.total > 0) {
    logger.info(`User "${userId}" has been kicked from this server for this duration`)
    return false
  }

  return true
}

export function getUserIdFromPeerID(network: SocketWebRTCServerNetwork, peerID: PeerID) {
  const client = Object.values(network.peers).find((c) => c.peerID === peerID)
  return client?.userId
}

export const handleConnectingPeer = (
  network: SocketWebRTCServerNetwork,
  spark: Spark,
  peerID: PeerID,
  user: UserType,
  inviteCode?: string
) => {
  const userId = user.id

  // Create a new client object
  // and add to the dictionary
  const existingUser = Object.values(network.peers).find((client) => client.userId === userId)
  const userIndex = existingUser ? existingUser.userIndex : network.userIndexCount++
  const peerIndex = network.peerIndexCount++

  const networkState = getMutableState(NetworkState).networks[network.id]
  networkState.peers.merge({
    [peerID]: {
      userId,
      userIndex: userIndex,
      spark: spark,
      peerIndex,
      peerID,
      media: {},
      lastSeenTs: Date.now()
    }
  })

  if (!network.users[userId]) {
    networkState.users.merge({ [userId]: [peerID] })
  } else {
    network.users[userId]!.push(peerID)
  }

  const worldState = getMutableState(WorldState)
  worldState.userNames[userId].set(user.name)

  network.userIDToUserIndex[userId] = userIndex
  network.userIndexToUserID[userIndex] = userId

  updatePeers(network)

  logger.info('Connect to world from ' + userId)

  const cachedActions = NetworkPeerFunctions.getCachedActionsForPeer(peerID).map((action) => {
    return _.cloneDeep(action)
  })

  const instanceServerState = getState(InstanceServerState)
  if (inviteCode && !instanceServerState.isMediaInstance) getUserSpawnFromInvite(network, user, inviteCode!)

  return {
    routerRtpCapabilities: network.transport.routers[0].rtpCapabilities,
    peerIndex: network.peerIDToPeerIndex[peerID]!,
    cachedActions
  }
}

const getUserSpawnFromInvite = async (
  network: SocketWebRTCServerNetwork,
  user: UserType,
  inviteCode: string,
  iteration = 0
) => {
  if (inviteCode) {
    const inviteCodeLookups = await Engine.instance.api.service(inviteCodeLookupPath).find({
      query: {
        inviteCode
      }
    })

    if (inviteCodeLookups.length > 0) {
      const inviterUser = inviteCodeLookups[0]
      const inviterUserInstanceAttendance = inviterUser.instanceAttendance || []
      const userInstanceAttendance = user.instanceAttendance || []
      let bothOnSameInstance = false
      for (const instanceAttendance of inviterUserInstanceAttendance) {
        if (
          !instanceAttendance.isChannel &&
          userInstanceAttendance.find(
            (userAttendance) => !userAttendance.isChannel && userAttendance.id === instanceAttendance.id
          )
        )
          bothOnSameInstance = true
      }
      if (bothOnSameInstance) {
        const selfAvatarEntity = NetworkObjectComponent.getUserAvatarEntity(user.id as UserID)
        if (!selfAvatarEntity) {
          if (iteration >= 100) {
            logger.warn(
              `User ${user.id} did not spawn their avatar within 5 seconds, abandoning attempts to spawn at inviter`
            )
            return
          }
          return setTimeout(() => getUserSpawnFromInvite(network, user, inviteCode, iteration + 1), 50)
        }
        const inviterUserId = inviterUser.id
        const inviterUserAvatarEntity = NetworkObjectComponent.getUserAvatarEntity(inviterUserId as UserID)
        if (!inviterUserAvatarEntity) {
          if (iteration >= 100) {
            logger.warn(
              `inviting user ${inviterUserId} did not have a spawned avatar within 5 seconds, abandoning attempts to spawn at inviter`
            )
            return
          }
          return setTimeout(() => getUserSpawnFromInvite(network, user, inviteCode, iteration + 1), 50)
        }
        const inviterUserTransform = getComponent(inviterUserAvatarEntity, TransformComponent)

        /** @todo find nearest valid spawn position, rather than 2 in front */
        const inviterUserObject3d = getComponent(inviterUserAvatarEntity, GroupComponent)[0]
        // Translate infront of the inviter
        inviterUserObject3d.translateZ(2)

        const validSpawnablePosition = checkPositionIsValid(inviterUserObject3d.position, false)

        if (validSpawnablePosition) {
          const spawnPose = getState(EntityNetworkState)[user.id as any as EntityUUID]
          spawnPose.spawnPosition.copy(inviterUserObject3d.position)
          spawnPose.spawnRotation.copy(inviterUserTransform.rotation)
          respawnAvatar(selfAvatarEntity)
        }
      } else {
        logger.warn('The user who invited this user in no longer on this instance.')
      }
    }
  }
}

export const handleIncomingActions = (network: SocketWebRTCServerNetwork, peerID: PeerID) => (message) => {
  const networkPeer = network.peers[peerID]
  if (!networkPeer) return

  networkPeer.lastSeenTs = Date.now()
  if (!message?.length) {
    // logger.info('Got heartbeat from ' + peerID + ' at ' + Date.now())
    return
  }

  const actions = /*decode(new Uint8Array(*/ message /*))*/ as Required<Action>[]
  for (const a of actions) {
    a.$from = networkPeer.userId
    a.$network = network.id
    dispatchAction(a)
  }
  // logger.info('SERVER INCOMING ACTIONS: %s', JSON.stringify(actions))
}

export async function handleDisconnect(network: SocketWebRTCServerNetwork, peerID: PeerID): Promise<any> {
  const userId = getUserIdFromPeerID(network, peerID) as UserID
  const disconnectedClient = network.peers[peerID]
  if (!disconnectedClient) return logger.warn(`Tried to handle disconnect for peer ${peerID} but was not found`)
  // On local, new connections can come in before the old sockets are disconnected.
  // The new connection will overwrite the socketID for the user's client.
  // This will only clear transports if the client's socketId matches the socket that's disconnecting.
  if (peerID === disconnectedClient?.peerID) {
    const state = getMutableState(WorldState)
    const userName = state.userNames[userId].value

    const instanceServerState = getState(InstanceServerState)
    const app = Engine.instance.api as Application

    if (!instanceServerState.isMediaInstance)
      app.service('message').create(
        {
          instanceId: instanceServerState.instance.id,
          text: `${userName} left`,
          isNotification: true
        },
        {
          'identity-provider': {
            userId: userId
          }
        }
      )

    NetworkPeerFunctions.destroyPeer(network, peerID)
    updatePeers(network)
    logger.info(`Disconnecting user ${userId} on spark ${peerID}`)
    const recvTransport = MediasoupTransportState.getTransport(network.id, 'recv', peerID) as WebRTCTransportExtension
    const sendTransport = MediasoupTransportState.getTransport(network.id, 'send', peerID) as WebRTCTransportExtension
    if (recvTransport) recvTransport.close()
    if (sendTransport) sendTransport.close()
  } else {
    logger.warn("Spark didn't match for disconnecting client.")
  }
}
