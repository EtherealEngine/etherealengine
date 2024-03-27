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

import config from '@etherealengine/common/src/config'
import { BotUserAgent } from '@etherealengine/common/src/constants/BotUserAgent'
import { PUBLIC_STUN_SERVERS } from '@etherealengine/common/src/constants/STUNServers'
import multiLogger from '@etherealengine/common/src/logger'
import {
  ChannelID,
  InstanceID,
  InviteCode,
  LocationID,
  MessageID,
  RoomCode
} from '@etherealengine/common/src/schema.type.module'
import { getSearchParamFromURL } from '@etherealengine/common/src/utils/getSearchParamFromURL'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { AuthTask } from '@etherealengine/engine/src/avatar/functions/receiveJoinWorld'
import { PeerID, State, dispatchAction, getMutableState, getState, none } from '@etherealengine/hyperflux'
import {
  Action,
  Topic,
  addOutgoingTopicIfNecessary,
  defineActionQueue,
  removeActionQueue
} from '@etherealengine/hyperflux/functions/ActionFunctions'
import {
  DataChannelType,
  MediaStreamAppData,
  MediasoupDataProducerActions,
  MediasoupDataProducerConsumerState,
  MediasoupMediaConsumerActions,
  MediasoupMediaProducerActions,
  MediasoupMediaProducerConsumerState,
  MediasoupMediaProducersConsumersObjectsState,
  MediasoupTransportActions,
  MediasoupTransportObjectsState,
  MediasoupTransportState,
  NetworkActions,
  NetworkConnectionParams,
  NetworkState,
  NetworkTopics,
  VideoConstants,
  addNetwork,
  createNetwork,
  removeNetwork,
  screenshareAudioDataChannelType,
  screenshareVideoDataChannelType,
  webcamAudioDataChannelType,
  webcamVideoDataChannelType
} from '@etherealengine/network'
import * as mediasoupClient from 'mediasoup-client'
import {
  Consumer,
  DataProducer,
  DtlsParameters,
  MediaKind,
  Transport as MediaSoupTransport,
  Producer,
  RtpParameters,
  SctpStreamParameters
} from 'mediasoup-client/lib/types'
import type { EventEmitter } from 'primus'
import Primus from 'primus-client'
import { v4 as uuidv4 } from 'uuid'
import { LocationInstanceState } from '../common/services/LocationInstanceConnectionService'
import { MediaInstanceState } from '../common/services/MediaInstanceConnectionService'
import {
  startFaceTracking,
  startLipsyncTracking,
  stopFaceTracking,
  stopLipsyncTracking
} from '../media/webcam/WebcamInput'
import { AuthState } from '../user/services/AuthService'
import { MediaStreamState, MediaStreamService as _MediaStreamService } from './MediaStreams'
import { clearPeerMediaChannels } from './PeerMediaChannelState'

import { DataChannelRegistryState, NetworkActionFunctions } from '@etherealengine/network'
import { encode } from 'msgpackr'

import { defineSystem, destroySystem } from '@etherealengine/ecs/src/SystemFunctions'
import { PresentationSystemGroup } from '@etherealengine/ecs/src/SystemGroups'
import { AdminClientSettingsState } from '../admin/services/Setting/ClientSettingService'

const logger = multiLogger.child({ component: 'client-core:SocketWebRTCClientFunctions' })

export type WebRTCTransportExtension = Omit<MediaSoupTransport, 'appData'> & { appData: MediaStreamAppData }
export type ProducerExtension = Omit<Producer, 'appData'> & { appData: MediaStreamAppData }
export type ConsumerExtension = Omit<Consumer, 'appData'> & {
  appData: MediaStreamAppData
}

let id = 0

// import { encode, decode } from 'msgpackr'

// Adds support for Promise to Primus client
// Each 'data' listener function needs to be named something unique in order for removeListener to
// not remove all 'data' listener functions
export const promisedRequest = (network: SocketWebRTCClientNetwork, type: any, data = {}) => {
  return new Promise<any>((resolve) => {
    const responseFunction = (data) => {
      if (data.type.toString() === message.type.toString() && message.id === data.id) {
        resolve(data.data)
        network.transport.primus.removeListener('data', responseFunction)
      }
    }
    Object.defineProperty(responseFunction, 'name', { value: `responseFunction${id}`, writable: true })
    const message = {
      type: type,
      data: data,
      id: (id++).toString() as MessageID
    }
    network.transport.primus.write(message)

    network.transport.primus.on('data', responseFunction)
  })
}

const instanceStillProvisioned = (instanceID: InstanceID, locationID?: LocationID, channelID?: ChannelID) =>
  !!(
    (locationID && getState(LocationInstanceState).instances[instanceID]) ||
    (channelID && getState(MediaInstanceState).instances[instanceID])
  )

const unprovisionInstance = (topic: Topic, instanceID: InstanceID) => {
  if (topic === NetworkTopics.world) {
    const locationInstanceConnectionState = getMutableState(LocationInstanceState)
    locationInstanceConnectionState.instances[instanceID].set(none)
  } else {
    const mediaInstanceConnectionState = getMutableState(MediaInstanceState)
    mediaInstanceConnectionState.instances[instanceID].set(none)
  }
}

export const closeNetwork = (network: SocketWebRTCClientNetwork) => {
  clearInterval(network.transport.heartbeat)
  network.transport.primus?.removeAllListeners()
  network.transport.primus?.end()
  removeNetwork(network)
  /** Dispatch updatePeers locally to ensure event souce states know about this */
  dispatchAction(
    NetworkActions.updatePeers({
      peers: [],
      $to: Engine.instance.store.peerID,
      $topic: network.topic,
      $network: network.id
    })
  )
}

export const initializeNetwork = (id: InstanceID, hostPeerID: PeerID, topic: Topic, primus: Primus) => {
  const mediasoupDevice = new mediasoupClient.Device(
    navigator.userAgent === BotUserAgent ? { handlerName: 'Chrome74' } : undefined
  )

  const transport = {
    messageToPeer: (peerId: PeerID, data: any) => {
      network.transport.primus?.write(data)
    },

    messageToAll: (data: any) => {
      network.transport.primus?.write(data)
    },

    onMessage: (fromPeerID: PeerID, message: any) => {
      const actions = message as any as Required<Action>[]
      // const actions = decode(new Uint8Array(message)) as IncomingActionType[]
      NetworkActionFunctions.receiveIncomingActions(network, fromPeerID, actions)
    },

    bufferToPeer: (dataChannelType: DataChannelType, fromPeerID: PeerID, peerID: PeerID, data: any) => {
      transport.bufferToAll(dataChannelType, fromPeerID, data)
    },

    bufferToAll: (dataChannelType: DataChannelType, fromPeerID: PeerID, data: any) => {
      const dataProducer = MediasoupDataProducerConsumerState.getProducerByDataChannel(network.id, dataChannelType) as
        | DataProducer
        | undefined
      if (!dataProducer) return
      if (dataProducer.closed || dataProducer.readyState !== 'open') return
      const fromPeerIndex = network.peerIDToPeerIndex[fromPeerID]
      if (typeof fromPeerIndex === 'undefined')
        return console.warn('fromPeerIndex is undefined', fromPeerID, fromPeerIndex)
      dataProducer.send(encode([fromPeerIndex, data]))
    },

    onBuffer: (dataChannelType: DataChannelType, fromPeerID: PeerID, data: any) => {
      const dataChannelFunctions = getState(DataChannelRegistryState)[dataChannelType]
      if (dataChannelFunctions) {
        for (const func of dataChannelFunctions) func(network, dataChannelType, fromPeerID, data)
      }
    },

    mediasoupDevice,
    mediasoupLoaded: false,
    primus,

    heartbeat: setInterval(() => {
      network.transport.messageToPeer(network.hostPeerID, [])
    }, 1000)
  }

  const network = createNetwork(id, hostPeerID, topic, transport)

  return network
}

export type SocketWebRTCClientNetwork = ReturnType<typeof initializeNetwork>

export const connectToInstance = (
  instanceID: InstanceID,
  ipAddress: string,
  port: string,
  locationID?: LocationID,
  channelID?: ChannelID,
  roomCode?: RoomCode
) => {
  let primus: Primus | undefined
  let connectionFailTimeout: NodeJS.Timeout | undefined
  let aborted = false
  let connecting = true

  // wrap the connect function in a closure to allow for recursive calls and single useEffect cleanup
  const _connect = () => {
    aborted = false
    connecting = true

    logger.info('Connecting to instance type: %o', { instanceID, ipAddress, port, locationID, channelID, roomCode })

    const authState = getState(AuthState)
    const token = authState.authUser.accessToken

    const query: NetworkConnectionParams = {
      instanceID,
      locationId: locationID,
      channelId: channelID,
      roomCode,
      token
    }

    if (locationID) delete query.channelId
    if (channelID) delete query.locationId
    if (!roomCode) delete query.roomCode

    try {
      if (
        config.client.localBuild === 'true' ||
        (config.client.appEnv === 'development' && config.client.localNginx !== 'true')
      ) {
        const queryString = new URLSearchParams(query).toString()
        primus = new Primus(`https://${ipAddress as string}:${port.toString()}?${queryString}`)
      } else {
        query.address = ipAddress
        query.port = port.toString()
        const queryString = new URLSearchParams(query).toString()
        primus = new Primus(`${config.client.instanceserverUrl}?${queryString}`)
      }
    } catch (err) {
      logger.error('Failed to connect to primus', err)
      // TODO: do we want to unprovision here?
      return unprovisionInstance(locationID ? NetworkTopics.world : NetworkTopics.media, instanceID)
    }

    connectionFailTimeout = setTimeout(() => {
      if (aborted || !primus) return
      primus.removeAllListeners()
      primus.end()
      /** If we still have the instance provisioned, we should try again */
      if (instanceStillProvisioned(instanceID, locationID, channelID)) _connect()
    }, 3000)

    const onConnect = () => {
      if (aborted || !primus) return
      connecting = false
      primus.off('incoming::open', onConnect)
      logger.info('CONNECTED to port %o', { port })

      clearTimeout(connectionFailTimeout)

      const topic = locationID ? NetworkTopics.world : NetworkTopics.media
      authenticatePrimus(primus, instanceID, topic)

      /** Server closed the connection. */
      const onDisconnect = () => {
        if (aborted) return
        if (primus) {
          primus.off('incoming::end', onDisconnect)
          primus.off('end', onDisconnect)
        }
        const network = getState(NetworkState).networks[instanceID] as SocketWebRTCClientNetwork
        if (!network) return logger.error('Disconnected from unconnected instance ' + instanceID)

        logger.info('Disonnected from network %o', { topic: network.topic, id: network.id })
        /**
         * If we are disconnected (server closes our socket) rather than leave the network,
         * we just need to destroy and recreate the transport
         */
        closeNetwork(network)
        /** If we still have the instance provisioned, we should try again */
        if (instanceStillProvisioned(instanceID, locationID, channelID)) _connect()
      }
      // incoming::end is emitted when the server closes the connection
      primus.on('incoming::end', onDisconnect)
      // end is emitted when the client closes the connection
      primus.on('end', onDisconnect)
    }
    primus!.on('incoming::open', onConnect)
  }

  _connect()

  return () => {
    aborted = true
    if (connecting) {
      if (connectionFailTimeout) clearTimeout(connectionFailTimeout)
      if (!primus) return
      primus.removeAllListeners()
      primus.end()
    } else {
      const network = getState(NetworkState).networks[instanceID] as SocketWebRTCClientNetwork | undefined
      if (network) leaveNetwork(network)
    }
  }
}

export const getChannelIdFromTransport = (network: SocketWebRTCClientNetwork) => {
  const channelConnectionState = getState(MediaInstanceState)
  const mediaNetwork = NetworkState.mediaNetwork
  const currentChannelInstanceConnection = mediaNetwork && channelConnectionState.instances[mediaNetwork.id]
  const isWorldConnection = network.topic === NetworkTopics.world
  return isWorldConnection ? null : currentChannelInstanceConnection?.channelId
}

export async function authenticatePrimus(primus: Primus, instanceID: InstanceID, topic: Topic) {
  logger.info('Authenticating instance ' + instanceID)

  const authState = getState(AuthState)
  const accessToken = authState.authUser.accessToken
  const inviteCode = getSearchParamFromURL('inviteCode') as InviteCode
  const payload = { accessToken, peerID: Engine.instance.store.peerID, inviteCode }

  const { status, routerRtpCapabilities, cachedActions, error, hostPeerID } = await new Promise<AuthTask>((resolve) => {
    const onAuthentication = (response: AuthTask) => {
      if (response.status !== 'pending') {
        clearInterval(interval)
        resolve(response)
        primus.off('data', onAuthentication)
        primus.removeListener('incoming::end', onDisconnect)
      }
    }

    primus.on('data', onAuthentication)

    let disconnected = false
    const interval = setInterval(() => {
      if (disconnected) {
        clearInterval(interval)
        resolve({ status: 'fail' })
        primus.removeAllListeners()
        primus.end()
        return
      }
      primus.write(payload)
    }, 100)

    const onDisconnect = () => {
      disconnected = true
    }
    primus.addListener('incoming::end', onDisconnect)
  })

  if (status !== 'success') {
    /** We failed to connect to be authenticated, we do not want to try again */
    // TODO: do we want to unprovision here?
    unprovisionInstance(topic, instanceID)
    return logger.error(new Error('Unable to connect with credentials' + error))
  }

  connectToNetwork(primus, instanceID, topic, hostPeerID!, routerRtpCapabilities!, cachedActions!)
}

export const connectToNetwork = async (
  primus: Primus,
  instanceID: InstanceID,
  topic: Topic,
  hostPeerID: PeerID,
  routerRtpCapabilities: any,
  cachedActions: Required<Action>[]
) => {
  /** Check if a network already exists */
  const existingNetwork = getState(NetworkState).networks[instanceID]
  if (!existingNetwork) {
    getMutableState(NetworkState).hostIds[topic].set(instanceID)
    const network = initializeNetwork(instanceID, hostPeerID, topic, primus)
    addNetwork(network)
  }

  const network = getState(NetworkState).networks[instanceID] as SocketWebRTCClientNetwork

  const networkState = getMutableState(NetworkState).networks[network.id] as State<SocketWebRTCClientNetwork>

  network.transport.primus.on('data', (message) => {
    if (!message) return
    network.transport.onMessage(network.hostPeerID, message)
  })

  addOutgoingTopicIfNecessary(network.topic)

  // handle cached actions
  for (const action of cachedActions!) Engine.instance.store.actions.incoming.push({ ...action, $fromCache: true })

  Engine.instance.store.actions.outgoing[network.topic].queue.push(
    ...Engine.instance.store.actions.outgoing[network.topic].history
  )

  if (!network.transport.mediasoupDevice.loaded) {
    await network.transport.mediasoupDevice.load({ routerRtpCapabilities })
    logger.info('Successfully loaded routerRtpCapabilities')
    networkState.transport.mediasoupLoaded.set(true)
  }

  dispatchAction(
    MediasoupTransportActions.requestTransport({
      peerID: Engine.instance.store.peerID,
      direction: 'send',
      sctpCapabilities: network.transport.mediasoupDevice.sctpCapabilities,
      $network: network.id,
      $topic: network.topic,
      $to: network.hostPeerID
    })
  )

  dispatchAction(
    MediasoupTransportActions.requestTransport({
      peerID: Engine.instance.store.peerID,
      direction: 'recv',
      sctpCapabilities: network.transport.mediasoupDevice.sctpCapabilities,
      $network: network.id,
      $topic: network.topic,
      $to: network.hostPeerID
    })
  )

  logger.info('Successfully connected to instance type: %o', { topic: network.topic, id: network.id })
}

export const waitForTransports = async (network: SocketWebRTCClientNetwork) => {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (network.ready) {
        clearInterval(interval)
        resolve()
        return
      }
    }, 100)
  })
}

export const onTransportCreated = async (action: typeof MediasoupTransportActions.transportCreated.matches._TYPE) => {
  const network = getState(NetworkState).networks[action.$network] as SocketWebRTCClientNetwork | undefined
  if (!network) return console.warn('Network not found', action.$network)

  const { transportID, direction, sctpParameters, iceParameters, iceCandidates, dtlsParameters } = action

  const channelId = getChannelIdFromTransport(network)

  let transport: MediaSoupTransport

  const iceServers = config.client.nodeEnv === 'production' ? PUBLIC_STUN_SERVERS : []

  const transportOptions = {
    id: action.transportID,
    sctpParameters: sctpParameters as any,
    iceParameters: iceParameters as any,
    iceCandidates: iceCandidates as any,
    dtlsParameters: dtlsParameters as any,
    iceServers
  }

  if (direction === 'recv') {
    transport = await network.transport.mediasoupDevice.createRecvTransport(transportOptions)
  } else if (direction === 'send') {
    transport = await network.transport.mediasoupDevice.createSendTransport(transportOptions)
  } else throw new Error(`bad transport 'direction': ${direction}`)

  // mediasoup-client will emit a connect event when media needs to
  // start flowing for the first time. send dtlsParameters to the
  // server, then call callback() on success or errback() on failure.

  transport.on(
    'connect',
    async (
      { dtlsParameters }: { dtlsParameters: DtlsParameters },
      callback: () => void,
      errback: (error: Error) => void
    ) => {
      const requestID = uuidv4()
      dispatchAction(
        MediasoupTransportActions.requestTransportConnect({
          requestID,
          transportID,
          dtlsParameters,
          $network: network.id,
          $topic: network.topic,
          $to: network.hostPeerID
        })
      )

      //  TODO - this is an anti pattern, how else can we resolve this? inject a system?
      try {
        const transportConnected = await new Promise<any>((resolve, reject) => {
          const actionQueue = defineActionQueue(MediasoupTransportActions.transportConnected.matches)
          const errorQueue = defineActionQueue(MediasoupTransportActions.requestTransportConnectError.matches)

          const cleanup = () => {
            destroySystem(systemUUID)
            removeActionQueue(actionQueue)
            removeActionQueue(errorQueue)
          }

          const systemUUID = defineSystem({
            uuid: '[WebRTC] transport connected ' + transportID,
            insert: { after: PresentationSystemGroup },
            execute: () => {
              for (const action of actionQueue()) {
                if (action.requestID !== requestID) return
                cleanup()
                resolve(action)
              }
              for (const action of errorQueue()) {
                if (action.requestID !== requestID) return
                cleanup()
                logger.error(action.error)
                reject(new Error(action.error))
              }
            }
          })
        })
        callback()
      } catch (e) {
        logger.error('Transport connect error', e)
        errback(e)
      }
    }
  )

  if (direction === 'send') {
    transport.on(
      'produce',
      async (
        {
          kind,
          rtpParameters,
          appData
        }: { kind: MediaKind; rtpParameters: RtpParameters; appData: MediaStreamAppData },
        callback: (arg0: { id: string }) => void,
        errback: (error: Error) => void
      ) => {
        const mediaStreamState = getMutableState(MediaStreamState)
        let paused = false

        switch (appData.mediaTag) {
          case webcamVideoDataChannelType:
            paused = mediaStreamState.videoPaused.value
            break
          case webcamAudioDataChannelType:
            paused = mediaStreamState.audioPaused.value
            break
          case screenshareVideoDataChannelType:
            paused = mediaStreamState.screenShareVideoPaused.value
            break
          case screenshareAudioDataChannelType:
            paused = mediaStreamState.screenShareAudioPaused.value
            break
          default:
            return logger.error('Unkown media type on transport produce', appData.mediaTag)
        }

        // tell the server what it needs to know from us in order to set
        // up a server-side producer object, and get back a
        // producer.id. call callback() on success or errback() on
        // failure.
        const requestID = uuidv4()
        dispatchAction(
          MediasoupMediaProducerActions.requestProducer({
            requestID,
            transportID,
            kind,
            rtpParameters,
            paused,
            appData,
            $network: network.id,
            $topic: network.topic,
            $to: network.hostPeerID
          })
        )

        //  TODO - this is an anti pattern, how else can we resolve this? inject a system?
        try {
          const producerPromise = await new Promise<any>((resolve, reject) => {
            const actionQueue = defineActionQueue(MediasoupMediaProducerActions.producerCreated.matches)
            const errorQueue = defineActionQueue(MediasoupMediaProducerActions.requestProducerError.matches)

            const cleanup = () => {
              destroySystem(systemUUID)
              removeActionQueue(actionQueue)
              removeActionQueue(errorQueue)
            }

            const systemUUID = defineSystem({
              uuid: '[WebRTC] media producer ' + requestID,
              insert: { after: PresentationSystemGroup },
              execute: () => {
                for (const action of actionQueue()) {
                  if (action.requestID !== requestID) return
                  cleanup()
                  resolve(action)
                }
                for (const action of errorQueue()) {
                  if (action.requestID !== requestID) return
                  cleanup()
                  logger.error(action.error)
                  reject(new Error(action.error))
                }
              }
            })
          })
          callback({ id: producerPromise.producerID })
        } catch (e) {
          errback(e)
        }
      }
    )

    transport.on(
      'producedata',
      async (
        parameters: {
          sctpStreamParameters: SctpStreamParameters
          label: DataChannelType
          protocol: string
          appData: Record<string, unknown>
        },
        callback: (arg0: { id: string }) => void,
        errback: (error: Error) => void
      ) => {
        const { sctpStreamParameters, label, protocol, appData } = parameters

        const requestID = uuidv4()
        dispatchAction(
          MediasoupDataProducerActions.requestProducer({
            requestID,
            transportID: transportOptions.id,
            sctpStreamParameters,
            dataChannel: label,
            protocol,
            appData,
            $network: network.id,
            $topic: network.topic,
            $to: network.hostPeerID
          })
        )

        //  TODO - this is an anti pattern, how else can we resolve this? inject a system?
        try {
          const producerPromise = await new Promise<any>((resolve, reject) => {
            const actionQueue = defineActionQueue(MediasoupDataProducerActions.producerCreated.matches)
            const errorQueue = defineActionQueue(MediasoupDataProducerActions.requestProducerError.matches)

            const cleanup = () => {
              destroySystem(systemUUID)
              removeActionQueue(actionQueue)
              removeActionQueue(errorQueue)
            }

            const systemUUID = defineSystem({
              uuid: '[WebRTC] data producer ' + requestID,
              insert: { after: PresentationSystemGroup },
              execute: () => {
                for (const action of actionQueue()) {
                  if (action.requestID !== requestID) return
                  cleanup()
                  resolve(action)
                }
                for (const action of errorQueue()) {
                  if (action.requestID !== requestID) return
                  cleanup()
                  logger.error(action.error)
                  reject(new Error(action.error))
                }
              }
            })
          })
          callback({ id: producerPromise.producerID })
        } catch (e) {
          errback(e)
        }
      }
    )
  }

  // any time a transport transitions to closed,
  // failed, or disconnected, leave the  and reset
  transport.on('connectionstatechange', async (state: string) => {
    if (state === 'closed' || state === 'failed' || state === 'disconnected') {
      logger.error('Transport %o transitioned to state ' + state, transport)
      logger.error(
        'If this occurred unexpectedly shortly after joining a world, check that the instanceserver nodegroup has public IP addresses.'
      )
      logger.info('Waiting 5 seconds to make a new transport')
      setTimeout(() => {
        logger.info('Re-creating transport after unexpected closing/fail/disconnect %o', {
          direction,
          channelId
        })
        // ensure the network still exists and we want to re-create the transport
        if (
          !getState(NetworkState).networks[network.id] ||
          !network.transport.primus ||
          network.transport.primus.disconnect
        )
          return

        const transportID = MediasoupTransportState.getTransport(network.id, direction, Engine.instance.store.peerID)
        getMutableState(MediasoupTransportState)[network.id][transportID].set(none)

        dispatchAction(
          MediasoupTransportActions.requestTransport({
            peerID: Engine.instance.store.peerID,
            direction,
            sctpCapabilities: network.transport.mediasoupDevice.sctpCapabilities,
            $network: network.id,
            $topic: network.topic,
            $to: network.hostPeerID
          })
        )
      }, 5000)
    }
  })

  getMutableState(MediasoupTransportObjectsState)[transportID].set(transport)
}

export async function configureMediaTransports(mediaTypes: string[]): Promise<boolean> {
  const mediaStreamState = getMutableState(MediaStreamState)
  if (
    mediaTypes.indexOf('video') > -1 &&
    (!mediaStreamState.videoStream.value || !mediaStreamState.videoStream.value.active)
  ) {
    await _MediaStreamService.startCamera()

    if (!mediaStreamState.videoStream.value) {
      logger.warn('Video stream is null, camera must have failed or be missing')
      return false
    }
  }

  if (
    mediaTypes.indexOf('audio') > -1 &&
    (!mediaStreamState.audioStream.value || !mediaStreamState.audioStream.value.active)
  ) {
    await _MediaStreamService.startMic()

    if (!mediaStreamState.audioStream.value) {
      logger.warn('Audio stream is null, mic must have failed or be missing')
      return false
    }
  }
  return true
}

const getCodecEncodings = (service: string) => {
  const clientSettingState = getState(AdminClientSettingsState).client[0]
  const settings =
    service === 'video' ? clientSettingState.mediaSettings.video : clientSettingState.mediaSettings.screenshare
  let codec, encodings
  if (settings) {
    switch (settings.codec) {
      case 'VP9':
        codec = VideoConstants.VP9_CODEC
        encodings = VideoConstants.CAM_VIDEO_SVC_CODEC_OPTIONS
        break
      case 'h264':
        codec = VideoConstants.H264_CODEC
        encodings = VideoConstants.CAM_VIDEO_SIMULCAST_ENCODINGS
        encodings[0].maxBitrate = settings.lowResMaxBitrate * 1000
        encodings[1].maxBitrate = settings.midResMaxBitrate * 1000
        encodings[2].maxBitrate = settings.highResMaxBitrate * 1000
        break
      case 'VP8':
        codec = VideoConstants.VP8_CODEC
        encodings = VideoConstants.CAM_VIDEO_SIMULCAST_ENCODINGS
        encodings[0].maxBitrate = settings.lowResMaxBitrate * 1000
        encodings[1].maxBitrate = settings.midResMaxBitrate * 1000
        encodings[2].maxBitrate = settings.highResMaxBitrate * 1000
    }
  }

  return { codec, encodings }
}

export async function createCamVideoProducer(network: SocketWebRTCClientNetwork): Promise<void> {
  const channelConnectionState = getState(MediaInstanceState)
  const currentChannelInstanceConnection = channelConnectionState.instances[network.id]
  const channelId = currentChannelInstanceConnection.channelId
  const mediaStreamState = getMutableState(MediaStreamState)
  if (mediaStreamState.videoStream.value !== null) {
    await waitForTransports(network)
    const transport = MediasoupTransportState.getTransport(network.id, 'send') as WebRTCTransportExtension

    const { codec, encodings } = getCodecEncodings('video')

    try {
      let produceInProgress = false
      await new Promise((resolve) => {
        const waitForProducer = setInterval(async () => {
          if (!mediaStreamState.camVideoProducer.value || mediaStreamState.camVideoProducer.value.closed) {
            if (!produceInProgress) {
              produceInProgress = true
              const producer = (await transport.produce({
                track: mediaStreamState.videoStream.value!.getVideoTracks()[0],
                encodings,
                codecOptions: VideoConstants.CAM_VIDEO_SIMULCAST_CODEC_OPTIONS,
                codec,
                appData: { mediaTag: webcamVideoDataChannelType, channelId: channelId }
              })) as any as ProducerExtension
              getMutableState(MediasoupMediaProducersConsumersObjectsState).producers[producer.id].set(producer)
              mediaStreamState.camVideoProducer.set(producer)
            }
          } else {
            clearInterval(waitForProducer)
            produceInProgress = false
            resolve(true)
          }
        }, 100)
      })
    } catch (err) {
      logger.error(err, 'Error producing video')
    }
  }
}

export async function createCamAudioProducer(network: SocketWebRTCClientNetwork): Promise<void> {
  const channelConnectionState = getState(MediaInstanceState)
  const clientSettingState = getState(AdminClientSettingsState)
  const currentChannelInstanceConnection = channelConnectionState.instances[network.id]
  const channelId = currentChannelInstanceConnection.channelId
  const mediaStreamState = getMutableState(MediaStreamState)
  if (mediaStreamState.audioStream.value !== null) {
    //To control the producer audio volume, we need to clone the audio track and connect a Gain to it.
    //This Gain is saved on MediaStreamState so it can be accessed from the user's component and controlled.
    const audioTrack = mediaStreamState.audioStream.value.getAudioTracks()[0]
    const ctx = new AudioContext()
    const src = ctx.createMediaStreamSource(new MediaStream([audioTrack]))
    const dst = ctx.createMediaStreamDestination()
    const gainNode = ctx.createGain()
    gainNode.gain.value = 1
    ;[src, gainNode, dst].reduce((a, b) => a && (a.connect(b) as any))
    mediaStreamState.microphoneGainNode.set(gainNode)
    mediaStreamState.audioStream.value.removeTrack(audioTrack)
    mediaStreamState.audioStream.value.addTrack(dst.stream.getAudioTracks()[0])
    // same thing for audio, but we can use our already-created

    await waitForTransports(network)
    const transport = MediasoupTransportState.getTransport(network.id, 'send') as WebRTCTransportExtension

    try {
      const codecOptions = { ...VideoConstants.CAM_AUDIO_CODEC_OPTIONS }
      if (clientSettingState.client?.[0]?.mediaSettings?.audio)
        codecOptions.opusMaxAverageBitrate = clientSettingState.client[0].mediaSettings.audio.maxBitrate * 1000

      // Create a new transport for audio and start producing
      let produceInProgress = false
      await new Promise((resolve) => {
        const waitForProducer = setInterval(async () => {
          if (!mediaStreamState.camAudioProducer.value || mediaStreamState.camAudioProducer.value.closed) {
            if (!produceInProgress) {
              produceInProgress = true
              const producer = (await transport.produce({
                track: mediaStreamState.audioStream.value!.getAudioTracks()[0],
                codecOptions,
                appData: { mediaTag: webcamAudioDataChannelType, channelId: channelId }
              })) as any as ProducerExtension
              getMutableState(MediasoupMediaProducersConsumersObjectsState).producers[producer.id].set(producer)
              mediaStreamState.camAudioProducer.set(producer)
            }
          } else {
            clearInterval(waitForProducer)
            produceInProgress = false
            resolve(true)
          }
        }, 100)
      })
    } catch (err) {
      logger.error(err, 'Error producing video')
    }
  }
}

export const receiveConsumerHandler = async (
  action: typeof MediasoupMediaConsumerActions.consumerCreated.matches._TYPE
) => {
  const network = getState(NetworkState).networks[action.$network] as SocketWebRTCClientNetwork

  const { peerID, mediaTag, channelID, paused } = action

  await waitForTransports(network)
  const transport = MediasoupTransportState.getTransport(network.id, 'recv') as WebRTCTransportExtension

  const consumer = (await transport.consume({
    id: action.consumerID,
    producerId: action.producerID,
    rtpParameters: action.rtpParameters as any,
    kind: action.kind!,
    appData: { peerID, mediaTag, channelId: channelID }
  })) as unknown as ConsumerExtension

  // if we do already have a consumer, we shouldn't have called this method
  const existingConsumer = MediasoupMediaProducerConsumerState.getConsumerByPeerIdAndMediaTag(
    network.id,
    peerID,
    mediaTag
  ) as ConsumerExtension

  if (!existingConsumer) {
    getMutableState(MediasoupMediaProducersConsumersObjectsState).consumers[consumer.id].set(consumer)
    // okay, we're ready. let's ask the peer to send us media
    if (!paused) resumeConsumer(network, consumer)
    else pauseConsumer(network, consumer)
  } else if (existingConsumer.track?.muted) {
    dispatchAction(
      MediasoupMediaConsumerActions.consumerClosed({
        consumerID: existingConsumer.id,
        $network: network.id,
        $topic: network.topic,
        $to: peerID
      })
    )
    getMutableState(MediasoupMediaProducersConsumersObjectsState).consumers[consumer.id].set(consumer)
    // okay, we're ready. let's ask the peer to send us media
    if (!paused) {
      resumeConsumer(network, consumer)
    } else {
      pauseConsumer(network, consumer)
    }
  } else {
    dispatchAction(
      MediasoupMediaConsumerActions.consumerClosed({
        consumerID: consumer.id,
        $network: network.id,
        $topic: network.topic,
        $to: peerID
      })
    )
  }
}

/** @todo move these pause/resume/mute/unmute functions onto a state definition */
export function pauseConsumer(network: SocketWebRTCClientNetwork, consumer: ConsumerExtension) {
  dispatchAction(
    MediasoupMediaConsumerActions.consumerPaused({
      consumerID: consumer.id,
      paused: true,
      $network: network.id,
      $topic: network.topic,
      $to: network.hostPeerID
    })
  )
}

export function resumeConsumer(network: SocketWebRTCClientNetwork, consumer: ConsumerExtension) {
  dispatchAction(
    MediasoupMediaConsumerActions.consumerPaused({
      consumerID: consumer.id,
      paused: false,
      $network: network.id,
      $topic: network.topic,
      $to: network.hostPeerID
    })
  )
}

export function pauseProducer(network: SocketWebRTCClientNetwork, producer: ProducerExtension) {
  dispatchAction(
    MediasoupMediaProducerActions.producerPaused({
      producerID: producer.id,
      globalMute: false,
      paused: true,
      $network: network.id,
      $topic: network.topic
    })
  )
}

export function resumeProducer(network: SocketWebRTCClientNetwork, producer: ProducerExtension) {
  dispatchAction(
    MediasoupMediaProducerActions.producerPaused({
      producerID: producer.id,
      globalMute: false,
      paused: false,
      $network: network.id,
      $topic: network.topic
    })
  )
}

export function globalMuteProducer(network: SocketWebRTCClientNetwork, producer: { id: any }) {
  dispatchAction(
    MediasoupMediaProducerActions.producerPaused({
      producerID: producer.id,
      globalMute: true,
      paused: true,
      $network: network.id,
      $topic: network.topic
    })
  )
}

export function globalUnmuteProducer(network: SocketWebRTCClientNetwork, producer: { id: any }) {
  dispatchAction(
    MediasoupMediaProducerActions.producerPaused({
      producerID: producer.id,
      globalMute: false,
      paused: false,
      $network: network.id,
      $topic: network.topic
    })
  )
}

export function setPreferredConsumerLayer(
  network: SocketWebRTCClientNetwork,
  consumer: ConsumerExtension,
  layer: number
) {
  dispatchAction(
    MediasoupMediaConsumerActions.consumerLayers({
      consumerID: consumer.id,
      layer,
      $network: network.id,
      $topic: network.topic,
      $to: network.hostPeerID
    })
  )
}

export const toggleFaceTracking = async () => {
  const mediaStreamState = getMutableState(MediaStreamState)
  if (mediaStreamState.faceTracking.value) {
    mediaStreamState.faceTracking.set(false)
    stopFaceTracking()
    stopLipsyncTracking()
  } else {
    const mediaNetwork = NetworkState.mediaNetwork as SocketWebRTCClientNetwork
    if (await configureMediaTransports(['video', 'audio'])) {
      mediaStreamState.faceTracking.set(true)
      startFaceTracking()
      startLipsyncTracking()
    }
  }
}

export const toggleMicrophonePaused = async () => {
  const mediaStreamState = getMutableState(MediaStreamState)
  const mediaNetwork = NetworkState.mediaNetwork as SocketWebRTCClientNetwork
  if (await configureMediaTransports(['audio'])) {
    if (!mediaStreamState.camAudioProducer.value) await createCamAudioProducer(mediaNetwork)
    else {
      const audioPaused = mediaStreamState.audioPaused.value
      if (audioPaused) resumeProducer(mediaNetwork, mediaStreamState.camAudioProducer.value!)
      else pauseProducer(mediaNetwork, mediaStreamState.camAudioProducer.value!)
      mediaStreamState.audioPaused.set(!audioPaused)
    }
  }
}

export const toggleWebcamPaused = async () => {
  const mediaStreamState = getMutableState(MediaStreamState)
  const mediaNetwork = NetworkState.mediaNetwork as SocketWebRTCClientNetwork
  if (await configureMediaTransports(['video'])) {
    if (!mediaStreamState.camVideoProducer.value) await createCamVideoProducer(mediaNetwork)
    else {
      const videoPaused = mediaStreamState.videoPaused.value
      if (videoPaused) resumeProducer(mediaNetwork, mediaStreamState.camVideoProducer.value!)
      else pauseProducer(mediaNetwork, mediaStreamState.camVideoProducer.value!)
      mediaStreamState.videoPaused.set(!videoPaused)
    }
  }
}

export const toggleScreenshare = async () => {
  const mediaStreamState = getMutableState(MediaStreamState)
  const mediaNetwork = NetworkState.mediaNetwork as SocketWebRTCClientNetwork
  if (mediaStreamState.screenVideoProducer.value) await stopScreenshare(mediaNetwork)
  else await startScreenshare(mediaNetwork)
}

export const toggleScreenshareAudioPaused = async () => {
  const mediaStreamState = getMutableState(MediaStreamState)
  const mediaNetwork = NetworkState.mediaNetwork as SocketWebRTCClientNetwork
  const audioPaused = mediaStreamState.screenShareAudioPaused.value
  if (audioPaused) resumeProducer(mediaNetwork, mediaStreamState.screenAudioProducer.value!)
  else pauseProducer(mediaNetwork, mediaStreamState.screenAudioProducer.value!)
  mediaStreamState.screenShareAudioPaused.set(!audioPaused)
}

export const toggleScreenshareVideoPaused = async () => {
  const mediaStreamState = getMutableState(MediaStreamState)
  const mediaNetwork = NetworkState.mediaNetwork as SocketWebRTCClientNetwork
  const videoPaused = mediaStreamState.screenShareVideoPaused.value
  if (videoPaused) await startScreenshare(mediaNetwork)
  else await stopScreenshare(mediaNetwork)
}

export function leaveNetwork(network: SocketWebRTCClientNetwork) {
  if (!network) return
  logger.info('Leaving network %o', { topic: network.topic, id: network.id })

  try {
    closeNetwork(network)

    if (network.topic === NetworkTopics.media) {
      clearPeerMediaChannels()
      getMutableState(NetworkState).hostIds.media.set(none)
    } else {
      getMutableState(NetworkState).hostIds.world.set(none)
      // if world has a media server connection
      if (NetworkState.mediaNetwork) {
        leaveNetwork(NetworkState.mediaNetwork as SocketWebRTCClientNetwork)
      }
      const parsed = new URL(window.location.href)
      const query = parsed.searchParams
      query.delete('roomCode')
      query.delete('instanceId')
      parsed.search = query.toString()
      if (typeof history.pushState !== 'undefined') {
        window.history.replaceState({}, '', parsed.toString())
      }
    }
  } catch (err) {
    logger.error(err, 'Error with leave()')
  }
}

export const startScreenshare = async (network: SocketWebRTCClientNetwork) => {
  logger.info('Start screen share')
  const mediaStreamState = getMutableState(MediaStreamState)

  // get a screen share track
  mediaStreamState.localScreen.set(
    await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })
  )

  const channelConnectionState = getState(MediaInstanceState)
  const clientSettingState = getState(AdminClientSettingsState).client[0]
  const screenshareSettings = clientSettingState.mediaSettings.screenshare
  const currentChannelInstanceConnection = channelConnectionState.instances[network.id]
  const channelId = currentChannelInstanceConnection.channelId

  await waitForTransports(network)
  const transport = MediasoupTransportState.getTransport(network.id, 'send') as WebRTCTransportExtension

  const { codec, encodings } = getCodecEncodings('screenshare')

  // create a producer for video
  const videoProducer = (await transport.produce({
    track: mediaStreamState.localScreen.value!.getVideoTracks()[0],
    encodings,
    codecOptions: VideoConstants.CAM_VIDEO_SIMULCAST_CODEC_OPTIONS,
    codec,
    appData: { mediaTag: screenshareVideoDataChannelType, channelId }
  })) as any as ProducerExtension
  mediaStreamState.screenVideoProducer.set(videoProducer)

  getMutableState(MediasoupMediaProducersConsumersObjectsState).producers[videoProducer.id].set(videoProducer)

  // create a producer for audio, if we have it
  if (mediaStreamState.localScreen.value!.getAudioTracks().length) {
    const audioProducer = (await transport.produce({
      track: mediaStreamState.localScreen.value!.getAudioTracks()[0],
      appData: { mediaTag: screenshareAudioDataChannelType, channelId }
    })) as any as ProducerExtension
    mediaStreamState.screenAudioProducer.set(audioProducer)
    mediaStreamState.screenShareAudioPaused.set(false)
    getMutableState(MediasoupMediaProducersConsumersObjectsState).producers[audioProducer.id].set(audioProducer)
  }

  // handler for screen share stopped event (triggered by the
  // browser's built-in screen sharing ui)
  mediaStreamState.screenVideoProducer.value!.track!.onended = async () => {
    return stopScreenshare(network)
  }

  mediaStreamState.screenShareVideoPaused.set(false)
}

export const stopScreenshare = async (network: SocketWebRTCClientNetwork) => {
  logger.info('Screen share stopped')
  const mediaStreamState = getMutableState(MediaStreamState)

  console.log(mediaStreamState.screenVideoProducer.value, mediaStreamState.screenShareVideoPaused.value)
  if (mediaStreamState.screenVideoProducer.value) {
    dispatchAction(
      MediasoupMediaProducerActions.producerPaused({
        producerID: mediaStreamState.screenVideoProducer.value.id,
        globalMute: false,
        paused: true,
        $network: network.id,
        $topic: network.topic
      })
    )
    await mediaStreamState.screenVideoProducer.value.pause()
    mediaStreamState.screenShareVideoPaused.set(true)
    dispatchAction(
      MediasoupMediaProducerActions.producerClosed({
        producerID: mediaStreamState.screenVideoProducer.value.id,
        $network: network.id,
        $topic: network.topic
      })
    )
    await mediaStreamState.screenVideoProducer.value.close()
    mediaStreamState.screenVideoProducer.set(null)
  }

  if (mediaStreamState.screenAudioProducer.value) {
    dispatchAction(
      MediasoupMediaProducerActions.producerPaused({
        producerID: mediaStreamState.screenAudioProducer.value.id,
        globalMute: false,
        paused: true,
        $network: network.id,
        $topic: network.topic
      })
    )
    dispatchAction(
      MediasoupMediaProducerActions.producerClosed({
        producerID: mediaStreamState.screenAudioProducer.value.id,
        $network: network.id,
        $topic: network.topic
      })
    )
    await mediaStreamState.screenAudioProducer.value.close()
    mediaStreamState.screenAudioProducer.set(null)
    mediaStreamState.screenShareAudioPaused.set(true)
  }
}

type Primus = EventEmitter & {
  buffer: any[]
  disconnect: boolean
  emitter: any //EventEmitter
  offlineHandler: () => void
  online: boolean
  onlineHandler: () => void
  options: {
    pingTimeout: 45000
    queueSize: number
    reconnect: any
    strategy: string
    timeout: number
    transport: any
  }
  readable: boolean
  readyState: number
  recovery: any
  socket: WebSocket
  timers: any
  transformers: { outgoing: Array<any>; incoming: Array<any> }
  transport: any
  url: URL
  writable: boolean
  _events: any
  _eventsCount: number

  AVOID_WEBSOCKETS: false
  NETWORK_EVENTS: unknown
  ark: any
  authorization: false
  client: unknown
  clone: unknown
  critical: unknown
  decoder: unknown
  destroy: () => void
  emits: unknown
  encoder: unknown
  end: () => void
  heartbeat: unknown
  id: unknown
  initialise: unknown
  merge: unknown
  open: unknown
  parse: unknown
  pathname: '/primus'
  plugin: unknown
  protocol: unknown
  querystring: unknown
  querystringify: unknown
  reserved: unknown
  send: unknown
  timeout: unknown
  transform: unknown
  transforms: unknown
  uri: unknown
  version: '7.3.4'
  write: (data: any) => void
  _write: unknown
}
