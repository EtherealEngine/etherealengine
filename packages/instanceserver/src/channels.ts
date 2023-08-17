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

import { Paginated } from '@feathersjs/feathers/lib'

import '@feathersjs/transport-commons'

import { decode } from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

import { Instance } from '@etherealengine/common/src/interfaces/Instance'
import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineActions, EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { SceneState } from '@etherealengine/engine/src/ecs/classes/Scene'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { NetworkPeerFunctions } from '@etherealengine/engine/src/networking/functions/NetworkPeerFunctions'
import { WorldState } from '@etherealengine/engine/src/networking/interfaces/WorldState'
import { addNetwork, NetworkState } from '@etherealengine/engine/src/networking/NetworkState'
import { updatePeers } from '@etherealengine/engine/src/networking/systems/OutgoingActionSystem'
import { locationPath } from '@etherealengine/engine/src/schemas/social/location.schema'
import { dispatchAction, getMutableState, getState, State } from '@etherealengine/hyperflux'
import { loadEngineInjection } from '@etherealengine/projects/loadEngineInjection'
import { Application } from '@etherealengine/server-core/declarations'
import config from '@etherealengine/server-core/src/appconfig'
import { getProjectsList } from '@etherealengine/server-core/src/projects/project/project.service'
import multiLogger from '@etherealengine/server-core/src/ServerLogger'
import { ServerState } from '@etherealengine/server-core/src/ServerState'
import getLocalServerIp from '@etherealengine/server-core/src/util/get-local-server-ip'

import { ChannelID } from '@etherealengine/common/src/dbmodels/Channel'
import { ChannelUser } from '@etherealengine/engine/src/schemas/interfaces/ChannelUser'
import { instanceAttendancePath } from '@etherealengine/engine/src/schemas/networking/instance-attendance.schema'
import {
  identityProviderPath,
  IdentityProviderType
} from '@etherealengine/engine/src/schemas/user/identity-provider.schema'
import { userKickPath, UserKickType } from '@etherealengine/engine/src/schemas/user/user-kick.schema'
import { UserID, userPath, UserType } from '@etherealengine/engine/src/schemas/user/user.schema'
import { InstanceServerState } from './InstanceServerState'
import { authorizeUserToJoinServer, handleDisconnect, setupIPs } from './NetworkFunctions'
import { restartInstanceServer } from './restartInstanceServer'
import { getServerNetwork, initializeNetwork, SocketWebRTCServerNetwork } from './SocketWebRTCServerFunctions'
import { startMediaServerSystems, startWorldServerSystems } from './startServerSystems'

const logger = multiLogger.child({ component: 'instanceserver:channels' })

interface PrimusConnectionType {
  provider: string
  headers: any
  socketQuery?: {
    sceneId: string
    locationId?: string
    instanceId?: string
    channelId?: string
    roomCode?: string
    token: string
    EIO: string
    transport: string
    t: string
  }
  instanceId?: string
  channelId?: string
}

interface InstanceserverStatus {
  state: 'Shutdown' | 'Ready'
  address: string
  portsList: Array<{ name: string; port: number }>
  players: any
}

type InstanceMetadata = {
  currentUsers: number
  locationId: string
  channelId: string
  ipAddress: string
}

/**
 * Creates a new 'instance' entry based on a locationId or channelId
 * If it is a location instance, creates a 'channel' entry
 * @param app
 * @param newInstance
 */
const createNewInstance = async (app: Application, newInstance: InstanceMetadata) => {
  const { locationId, channelId } = newInstance

  logger.info('Creating new instance: %o %s, %s', newInstance, locationId, channelId)
  const instanceResult = (await app.service('instance').create(newInstance)) as Instance
  if (!channelId) {
    await app.service('channel').create({
      instanceId: instanceResult.id
    })
  }
  const serverState = getState(ServerState)
  const instanceServerState = getMutableState(InstanceServerState)
  await serverState.agonesSDK.allocate()
  instanceServerState.instance.set(instanceResult)
}

/**
 * Updates the existing 'instance' table entry
 * @param app
 * @param existingInstance
 * @param channelId
 * @param locationId
 */

const assignExistingInstance = async (
  app: Application,
  existingInstance: Instance,
  channelId: ChannelID,
  locationId: string
) => {
  const serverState = getState(ServerState)
  const instanceServerState = getMutableState(InstanceServerState)

  await serverState.agonesSDK.allocate()
  instanceServerState.instance.set(existingInstance)
  await app.service('instance').patch(existingInstance.id, {
    currentUsers: existingInstance.currentUsers + 1,
    channelId: channelId,
    locationId: locationId,
    podName: config.kubernetes.enabled ? instanceServerState.instanceServer.value?.objectMeta?.name : 'local',
    assigned: false,
    assignedAt: null!
  })
}

/**
 * Creates a new instance by either creating a new entry in the 'instance' table or updating an existing one
 * - Should only initialize an instance once per the lifecycle of an instance server
 * @param app
 * @param status
 * @param locationId
 * @param channelId
 * @param userId
 * @returns
 */

const initializeInstance = async (
  app: Application,
  status: InstanceserverStatus,
  locationId: string,
  channelId: ChannelID,
  userId?: UserID
) => {
  logger.info('Initializing new instance')

  const serverState = getState(ServerState)
  const instanceServerState = getMutableState(InstanceServerState)

  const isMediaInstance = !!channelId
  instanceServerState.isMediaInstance.set(isMediaInstance)

  const localIp = await getLocalServerIp(isMediaInstance)
  const selfIpAddress = `${status.address}:${status.portsList[0].port}`
  const ipAddress = config.kubernetes.enabled ? selfIpAddress : `${localIp.ipAddress}:${localIp.port}`
  const existingInstanceQuery = {
    ipAddress: ipAddress,
    ended: false
  } as any
  if (locationId) existingInstanceQuery.locationId = locationId
  else if (channelId) existingInstanceQuery.channelId = channelId

  /**
   * The instance record should be created when the instance is provisioned by the API server,
   * here we check that this is the case, as it may be altered, for example by another service or an admin
   */

  const existingInstanceResult = (await app.service('instance').find({
    query: existingInstanceQuery
  })) as Paginated<Instance>
  logger.info('existingInstanceResult: %o', existingInstanceResult.data)

  if (existingInstanceResult.total === 0) {
    const newInstance = {
      currentUsers: 1,
      locationId: locationId,
      channelId: channelId,
      ipAddress: ipAddress,
      podName: config.kubernetes.enabled ? instanceServerState.instanceServer.value?.objectMeta?.name : 'local'
    } as InstanceMetadata
    await createNewInstance(app, newInstance)
  } else {
    const instance = existingInstanceResult.data[0]
    if (locationId) {
      const existingChannel = await app.service('channel').Model.findOne({
        where: {
          instanceId: instance.id
        }
      })
      if (!existingChannel) {
        await app.service('channel').create({
          instanceId: instance.id
        })
      }
    }
    await serverState.agonesSDK.allocate()
    if (!instanceServerState.instance.value) instanceServerState.instance.set(instance)
    if (userId && !(await authorizeUserToJoinServer(app, instance, userId))) return
    await assignExistingInstance(app, instance, channelId, locationId)
  }
}

/**
 * Creates and initializes the server network and transport, then loads all systems for the engine
 * @param app
 * @param sceneId
 */

const loadEngine = async (app: Application, sceneId: string) => {
  const instanceServerState = getState(InstanceServerState)

  const hostId = instanceServerState.instance.id as UserID
  Engine.instance.userID = hostId
  Engine.instance.peerID = uuidv4() as PeerID
  const topic = instanceServerState.isMediaInstance ? NetworkTopics.media : NetworkTopics.world

  await setupIPs()
  const network = await initializeNetwork(app, hostId, hostId, topic)

  addNetwork(network)

  NetworkPeerFunctions.createPeer(
    network,
    'server' as PeerID,
    network.peerIndexCount++,
    hostId,
    network.userIndexCount++,
    'server-' + hostId
  )

  const projects = await getProjectsList()

  if (instanceServerState.isMediaInstance) {
    getMutableState(NetworkState).hostIds.media.set(hostId as UserID)
    startMediaServerSystems()
    await loadEngineInjection(projects)
    dispatchAction(EngineActions.initializeEngine({ initialised: true }))
    dispatchAction(EngineActions.sceneLoaded({}))
  } else {
    getMutableState(NetworkState).hostIds.world.set(hostId as UserID)

    const [projectName, sceneName] = sceneId.split('/')

    const sceneResultPromise = app.service('scene').get({ projectName, sceneName, metadataOnly: false }, null!)

    startWorldServerSystems()
    await loadEngineInjection(projects)
    dispatchAction(EngineActions.initializeEngine({ initialised: true }))

    const sceneUpdatedListener = async () => {
      const sceneData = (await sceneResultPromise).data
      getMutableState(SceneState).sceneData.set(sceneData)
      /** @todo - quick hack to wait until scene has loaded */

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (getState(EngineState).sceneLoaded) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
      })
    }
    const userUpdatedListener = async (user) => {
      const worldState = getMutableState(WorldState)
      if (worldState.userNames[user.id]?.value) worldState.userNames[user.id].set(user.name)
    }
    app.service('scene').on('updated', sceneUpdatedListener)
    app.service(userPath).on('patched', userUpdatedListener)
    await sceneUpdatedListener()

    logger.info('Scene loaded!')
  }

  const networkState = getMutableState(NetworkState).networks[network.id] as State<SocketWebRTCServerNetwork>
  networkState.authenticated.set(true)
  networkState.connected.set(true)
  networkState.ready.set(true)

  getMutableState(EngineState).connectedWorld.set(true)
}

/**
 * Update instance attendance with the new user for analytics purposes
 * @param app
 * @param userId
 */

const handleUserAttendance = async (app: Application, userId: UserID) => {
  const instanceServerState = getState(InstanceServerState)

  const channel = await app.service('channel').Model.findOne({
    where: {
      instanceId: instanceServerState.instance.id
    }
  })

  /** Only a world server gets assigned a channel, since it has chat. A media server uses a channel but does not have one itself */
  if (channel) {
    const existingChannelUser = (await app.service('channel-user').find({
      query: {
        channelId: channel.id,
        userId: userId
      }
    })) as Paginated<ChannelUser>

    if (!existingChannelUser.total) {
      await app.service('channel-user').create({
        channelId: channel.id,
        userId: userId
      })
    }
  }

  await app.service(instanceAttendancePath).patch(
    null,
    {
      ended: true
    },
    {
      query: {
        isChannel: instanceServerState.isMediaInstance,
        ended: false,
        userId: userId
      }
    }
  )

  const newInstanceAttendance = {
    instanceId: instanceServerState.instance.id,
    isChannel: instanceServerState.isMediaInstance,
    userId: userId
  }
  if (!instanceServerState.isMediaInstance) {
    const location = await app.service(locationPath).get(instanceServerState.instance.locationId!)
    ;(newInstanceAttendance as any).sceneId = location.sceneId
  }
  await app.service(instanceAttendancePath).create(newInstanceAttendance as any)
}

let instanceStarted = false

/**
 * Creates a new 'instance' entry or updates the current one with a connecting user, and handles initializing the instance server
 * @param app
 * @param status
 * @param locationId
 * @param channelId
 * @param sceneId
 * @param userId
 * @returns
 */
const createOrUpdateInstance = async (
  app: Application,
  status: InstanceserverStatus,
  locationId: string,
  channelId: ChannelID,
  sceneId: string,
  userId?: UserID
) => {
  const instanceServerState = getState(InstanceServerState)
  const serverState = getState(ServerState)

  logger.info('Creating new instance server or updating current one.')
  logger.info(`agones state is ${status.state}`)
  logger.info('app instance is %o', instanceServerState.instance)
  logger.info(`instanceLocationId: ${instanceServerState.instance?.locationId}, locationId: ${locationId}`)

  const isReady = status.state === 'Ready'
  const isNeedingNewServer = !config.kubernetes.enabled && !instanceStarted

  if (isReady || isNeedingNewServer) {
    instanceStarted = true
    await initializeInstance(app, status, locationId, channelId, userId)
    await loadEngine(app, sceneId)
  } else {
    try {
      if (!getState(EngineState).connectedWorld)
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (getState(EngineState).connectedWorld) {
              clearInterval(interval)
              resolve()
            }
          }, 1000)
        })
      const instance = await app.service('instance').get(instanceServerState.instance.id)
      if (userId && !(await authorizeUserToJoinServer(app, instance, userId))) return
      await serverState.agonesSDK.allocate()
      await app.service('instance').patch(instanceServerState.instance.id, {
        currentUsers: (instance.currentUsers as number) + 1,
        assigned: false,
        podName: config.kubernetes.enabled ? instanceServerState.instanceServer?.objectMeta?.name : 'local',
        assignedAt: null!
      })
    } catch (err) {
      logger.info('Could not update instance, likely because it is a local one that does not exist.')
    }
  }
}

const shutdownServer = async (app: Application, instanceId: string) => {
  const instanceServer = getState(InstanceServerState)
  const serverState = getState(ServerState)

  // already shut down
  if (!instanceServer.instance) return

  logger.info('Deleting instance ' + instanceId)
  try {
    await app.service('instance').patch(instanceId, {
      ended: true
    })
    if (instanceServer.instance.locationId) {
      const channel = await app.service('channel').Model.findOne({
        where: {
          instanceId: instanceServer.instance.id
        }
      })
      await app.service('channel').remove(channel.id)
    }
  } catch (err) {
    logger.error(err)
  }

  // already shut down
  if (!instanceServer.instance) return
  ;(instanceServer.instance as Instance).ended = true
  if (config.kubernetes.enabled) {
    const instanceServerState = getMutableState(InstanceServerState)
    instanceServerState.instance.set(null!)
    const gsName = instanceServer.instanceServer.objectMeta.name
    if (gsName !== undefined) {
      logger.info("App's instanceserver name:")
      logger.info(gsName)
    }
    await serverState.agonesSDK.shutdown()
  } else {
    restartInstanceServer()
  }
}

// todo: this could be more elegant
const getActiveUsersCount = (app: Application, userToIgnore: UserType) => {
  const activeClients = getServerNetwork(app).peers
  const activeUsers = [...activeClients].filter(
    ([id, client]) => client.userId !== Engine.instance.userID && client.userId !== userToIgnore.id
  )
  return activeUsers.length
}

const handleUserDisconnect = async (
  app: Application,
  connection: PrimusConnectionType,
  user: UserType,
  instanceId: string
) => {
  const instanceServerState = getState(InstanceServerState)

  try {
    const activeUsersCount = getActiveUsersCount(app, user)
    await app.service('instance').patch(instanceId, {
      currentUsers: activeUsersCount
    })
  } catch (err) {
    logger.info('Failed to patch instance user count, likely because it was destroyed.')
  }

  await app.service(instanceAttendancePath).patch(
    null,
    {
      ended: true
    },
    {
      query: {
        isChannel: instanceServerState.isMediaInstance,
        instanceId: instanceId,
        userId: user.id
      }
    }
  )

  app.channel(`instanceIds/${instanceId as string}`).leave(connection)

  await new Promise((resolve) => setTimeout(resolve, config.instanceserver.shutdownDelayMs))

  const network = getServerNetwork(app)

  // check if there are no peers connected (1 being the server,
  // 0 if the serer was just starting when someone connected and disconnected)
  if (network.peers.size <= 1) {
    logger.info('Shutting down instance server as there are no users present.')
    await shutdownServer(app, instanceId)
  }
}

const handleChannelUserRemoved = (app: Application) => async (params) => {
  const instanceServerState = getState(InstanceServerState)
  if (!instanceServerState.isMediaInstance) return
  const instance = instanceServerState.instance
  if (!instance.channelId) return
  const channel = await app.service('channel').Model.findOne({
    where: {
      id: instance.channelId
    }
  })
  if (!channel) return
  const network = getServerNetwork(app)
  const matchingPeer = Array.from(network.peers.values()).find((peer) => peer.userId === params.userId)
  if (matchingPeer) {
    matchingPeer.spark?.end()
    NetworkPeerFunctions.destroyPeer(network, matchingPeer.peerID)
    updatePeers(network)
  }
}

const onConnection = (app: Application) => async (connection: PrimusConnectionType) => {
  logger.info('Connection: %o', connection)

  if (!connection.socketQuery?.token) return

  const authResult = await app.service('authentication').strategies.jwt.authenticate!(
    { accessToken: connection.socketQuery.token },
    {}
  )
  const identityProvider = authResult[identityProviderPath] as IdentityProviderType
  if (!identityProvider?.id) return

  const userId = identityProvider.userId
  let locationId = connection.socketQuery.locationId!
  let channelId = connection.socketQuery.channelId! as ChannelID
  let roomCode = connection.socketQuery.roomCode!

  if (locationId === '') {
    locationId = undefined!
  }
  if (channelId === '') {
    channelId = undefined!
  }
  if (roomCode === '') {
    roomCode = undefined!
  }

  logger.info(
    `user ${userId} joining ${locationId ?? channelId} with sceneId ${
      connection.socketQuery.sceneId
    } and room code ${roomCode}`
  )

  const instanceServerState = getState(InstanceServerState)
  const serverState = getState(ServerState)

  /**
   * Since local environments do not have the ability to run multiple gameservers,
   * we need to shut down the current one if the user tries to load a new location
   */
  const isLocalServerNeedingNewLocation =
    !config.kubernetes.enabled &&
    instanceServerState.instance &&
    (instanceServerState.instance.locationId != locationId ||
      instanceServerState.instance.channelId != channelId ||
      (roomCode && instanceServerState.instance.roomCode !== roomCode))

  logger.info(
    `current id: ${instanceServerState.instance?.locationId ?? instanceServerState.instance?.channelId} and new id: ${
      locationId ?? channelId
    }`
  )
  logger.info(`current room code: ${instanceServerState.instance?.roomCode} and new id: ${roomCode}`)

  if (isLocalServerNeedingNewLocation) {
    await app.service('instance').patch(instanceServerState.instance.id, {
      ended: true
    })
    if (instanceServerState.instance.channelId) {
      await app.service('channel').remove(instanceServerState.instance.channelId)
    }
    restartInstanceServer()
    return
  }

  /**
   * If an instance has already been initialized, we want to disallow all connections trying to connect to the wrong location or channel
   */
  if (instanceServerState.instance) {
    if (locationId && instanceServerState.instance.locationId !== locationId)
      return logger.warn(
        'got a connection to the wrong location id',
        instanceServerState.instance.locationId,
        locationId
      )
    if (channelId && instanceServerState.instance.channelId !== channelId)
      return logger.warn('got a connection to the wrong channel id', instanceServerState.instance.channelId, channelId)
    if (roomCode && instanceServerState.instance.roomCode !== roomCode)
      return logger.warn('got a connection to the wrong room code', instanceServerState.instance.roomCode, roomCode)
  }

  const sceneId = locationId ? (await app.service(locationPath).get(locationId)).sceneId : ''

  /**
   * Now that we have verified the connecting user and that they are connecting to the correct instance, load the instance
   */
  const isResult = await serverState.agonesSDK.getGameServer()
  const status = isResult.status as InstanceserverStatus

  await createOrUpdateInstance(app, status, locationId, channelId, sceneId, userId)

  if (instanceServerState.instance) {
    connection.instanceId = instanceServerState.instance.id
    app.channel(`instanceIds/${instanceServerState.instance.id}`).join(connection)
  }

  await handleUserAttendance(app, userId)
}

const onDisconnection = (app: Application) => async (connection: PrimusConnectionType) => {
  logger.info('Disconnection or end: %o', connection)
  const token = connection.socketQuery?.token
  if (!token) return

  let authResult
  try {
    authResult = await app.service('authentication').strategies.jwt.authenticate!({ accessToken: token }, {})
  } catch (err) {
    if (err.code === 401 && err.data.name === 'TokenExpiredError') {
      const jwtDecoded = decode(token)!
      const idProvider = await app.service(identityProviderPath)._get(jwtDecoded.sub as string)
      authResult = {
        [identityProviderPath]: idProvider
      }
    } else throw err
  }

  const instanceServerState = getState(InstanceServerState)

  const identityProvider = authResult[identityProviderPath] as IdentityProviderType
  if (identityProvider != null && identityProvider.id != null) {
    const userId = identityProvider.userId
    const user = await app.service(userPath).get(userId)
    const instanceId = !config.kubernetes.enabled ? connection.instanceId : instanceServerState.instance?.id
    let instance
    logger.info('On disconnect, instanceId: ' + instanceId)
    logger.info('Disconnecting user ', user.id)

    if (!instanceId) {
      logger.info('No instanceId on user disconnect, waiting one second to see if initial user was connecting')
      await new Promise((resolve) =>
        setTimeout(() => {
          resolve(null)
        }, 1000)
      )
    }
    try {
      instance = instanceServerState.instance && instanceId != null ? await app.service('instance').get(instanceId) : {}
    } catch (err) {
      logger.warn('Could not get instance, likely because it is a local one that no longer exists.')
    }
    logger.info('instanceId %s instance %o', instanceId, instance)
    if (instanceId != null && instance != null) {
      await handleUserDisconnect(app, connection, user, instanceId)
    }
  }
}

export default (app: Application): void => {
  if (typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return
  }

  app.service('instanceserver-load').on('patched', async (params) => {
    const { id, ipAddress, podName, locationId, sceneId } = params

    const serverState = getState(ServerState)
    const instanceServerState = getState(InstanceServerState)

    if (instanceServerState.instance && instanceServerState.instance.id !== id) {
      return
    }

    const isResult = await serverState.agonesSDK.getGameServer()
    const gsName = isResult.objectMeta.name
    const status = isResult.status as InstanceserverStatus

    // Validate if pod name match
    if (gsName !== podName) {
      return
    }

    createOrUpdateInstance(app, status, locationId, null!, sceneId)
  })

  const kickCreatedListener = async (data: UserKickType) => {
    // TODO: only run for instanceserver
    if (!Engine.instance.worldNetwork) return // many attributes (such as .peers) are undefined in mediaserver

    logger.info('kicking user id %s', data.userId)

    const peerId = Engine.instance.worldNetwork.users.get(data.userId)
    if (!peerId || !peerId[0]) return

    logger.info('kicking peerId %o', peerId)

    const peer = Engine.instance.worldNetwork.peers.get(peerId[0])
    if (!peer || !peer.spark) return

    handleDisconnect(getServerNetwork(app), peer.peerID)
  }

  app.service(userKickPath).on('created', kickCreatedListener)
  app.service('channel-user').on('removed', handleChannelUserRemoved(app))

  app.on('connection', onConnection(app))
  app.on('disconnect', onDisconnection(app))
}
