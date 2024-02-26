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

import { DataChannelType } from '@etherealengine/common/src/interfaces/DataChannelType'
import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'
import { ChannelID, InstanceID } from '@etherealengine/common/src/schema.type.module'
import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import {
  NO_PROXY_STEALTH,
  defineAction,
  defineState,
  dispatchAction,
  getMutableState,
  getState,
  getStateUnsafe,
  none,
  useHookstate
} from '@etherealengine/hyperflux'
import React, { useEffect } from 'react'
import { Validator, matches, matchesPeerID } from '../../common/functions/MatchesUtils'

import { MediaStreamAppData, MediaTagType, NetworkState } from '../NetworkState'
import { MediasoupTransportObjectsState } from './MediasoupTransportState'

export class MediaProducerActions {
  static requestProducer = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_CREATE_PRODUCER',
    requestID: matches.string,
    transportID: matches.string,
    kind: matches.literals('audio', 'video').optional(),
    rtpParameters: matches.object,
    paused: matches.boolean,
    appData: matches.object as Validator<unknown, MediaStreamAppData>
  })

  static requestProducerError = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_CREATE_PRODUCER_ERROR',
    requestID: matches.string,
    error: matches.string
  })

  static producerCreated = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_PRODUCER_CREATED',
    requestID: matches.string,
    producerID: matches.string,
    transportID: matches.string,
    peerID: matchesPeerID,
    mediaTag: matches.string as Validator<unknown, DataChannelType>,
    channelID: matches.string as Validator<unknown, ChannelID>,
    $cache: true
  })

  static producerClosed = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_CLOSED_PRODUCER',
    producerID: matches.string,
    $cache: true
  })

  static producerPaused = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_PRODUCER_PAUSED',
    producerID: matches.string,
    paused: matches.boolean,
    globalMute: matches.boolean,
    $cache: {
      removePrevious: ['producerID']
    }
  })
}

export class MediasoupMediaConsumerActions {
  static requestConsumer = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_REQUEST_CONSUMER',
    peerID: matchesPeerID,
    mediaTag: matches.string as Validator<unknown, DataChannelType>,
    rtpCapabilities: matches.object,
    channelID: matches.string as Validator<unknown, ChannelID>
  })

  static consumerCreated = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_CREATED_CONSUMER',
    consumerID: matches.string,
    transportID: matches.string,
    peerID: matchesPeerID,
    mediaTag: matches.string as Validator<unknown, DataChannelType>,
    channelID: matches.string as Validator<unknown, ChannelID>,
    producerID: matches.string,
    kind: matches.literals('audio', 'video').optional(),
    rtpParameters: matches.object,
    consumerType: matches.string,
    paused: matches.boolean
  })

  static consumerLayers = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_CONSUMER_LAYERS',
    consumerID: matches.string,
    layer: matches.number
  })

  static consumerClosed = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_CLOSED_CONSUMER',
    consumerID: matches.string
  })

  static consumerPaused = defineAction({
    type: 'ee.engine.network.mediasoup.MEDIA_CONSUMER_PAUSED',
    consumerID: matches.string,
    paused: matches.boolean
  })
}

export const MediasoupMediaProducersConsumersObjectsState = defineState({
  name: 'ee.engine.network.mediasoup.MediasoupMediaProducersAndConsumersObjectsState',

  initial: {
    producers: {} as Record<string, any>,
    consumers: {} as Record<string, any>
  }
})

export const MediasoupMediaProducerConsumerState = defineState({
  name: 'ee.engine.network.mediasoup.MediasoupMediaProducerConsumerState',

  initial: {} as Record<
    InstanceID,
    {
      producers: {
        [producerID: string]: {
          producerID: string
          peerID: PeerID
          mediaTag: DataChannelType
          transportID: string
          channelID: ChannelID
          paused?: boolean
          globalMute?: boolean
        }
      }
      consumers: {
        [consumerID: string]: {
          consumerID: string
          peerID: PeerID
          mediaTag: DataChannelType
          transportID: string
          channelID: ChannelID
          producerID: string
          paused?: boolean
          kind?: 'audio' | 'video'
          rtpParameters: any
          type: string
        }
      }
    }
  >,

  getProducerByPeerIdAndMediaTag: (networkID: InstanceID, peerID: string, mediaTag: MediaTagType) => {
    const state = getState(MediasoupMediaProducerConsumerState)[networkID]
    if (!state) return

    const producer = Object.values(state.producers).find((p) => p.peerID === peerID && p.mediaTag === mediaTag)
    if (!producer) return

    return getState(MediasoupMediaProducersConsumersObjectsState).producers[producer.producerID]
  },

  getConsumerByPeerIdAndMediaTag: (networkID: InstanceID, peerID: string, tag: MediaTagType) => {
    const state = getState(MediasoupMediaProducerConsumerState)[networkID]
    if (!state) return

    const consumer = Object.values(state.consumers).find((p) => p.peerID === peerID && p.mediaTag === tag)
    if (!consumer) return

    return getState(MediasoupMediaProducersConsumersObjectsState).consumers[consumer.consumerID]
  },

  receptors: {
    onProducerCreated: MediaProducerActions.producerCreated.receive((action) => {
      const state = getMutableState(MediasoupMediaProducerConsumerState)
      const networkID = action.$network as InstanceID
      if (!state.value[networkID]) {
        state.merge({ [networkID]: { producers: {}, consumers: {} } })
      }
      state[networkID].producers.merge({
        [action.producerID]: {
          transportID: action.transportID,
          producerID: action.producerID,
          peerID: action.peerID,
          mediaTag: action.mediaTag,
          channelID: action.channelID
        }
      })
    }),

    onProducerClosed: MediaProducerActions.producerClosed.receive((action) => {
      const networkID = action.$network as InstanceID
      const state = getMutableState(MediasoupMediaProducerConsumerState)

      state[networkID]?.producers[action.producerID].set(none)

      if (!state[networkID]?.producers.keys.length && !state[networkID]?.consumers.keys.length) {
        state[networkID].set(none)
      }
    }),

    onProducerPaused: MediaProducerActions.producerPaused.receive((action) => {
      const state = getMutableState(MediasoupMediaProducerConsumerState)
      const networkID = action.$network as InstanceID
      if (!state.value[networkID]?.producers[action.producerID]) return

      const producerState = state[networkID].producers[action.producerID]

      producerState.merge({
        paused: action.paused,
        globalMute: action.globalMute
      })

      const peerID = producerState.peerID.value
      const mediatag = producerState.mediaTag.value

      const { globalMute, paused } = action
      const network = getMutableState(NetworkState).networks[networkID]
      const media = network.peers[peerID]?.media
      if (media && media[mediatag]) {
        media[mediatag].paused.set(paused)
        media[mediatag].globalMute.set(globalMute)
      }
    }),

    onConsumerCreated: MediasoupMediaConsumerActions.consumerCreated.receive((action) => {
      const state = getMutableState(MediasoupMediaProducerConsumerState)
      const networkID = action.$network as InstanceID
      if (!state.value[networkID]) {
        state.merge({ [networkID]: { producers: {}, consumers: {} } })
      }
      state[networkID].consumers.merge({
        [action.consumerID]: {
          consumerID: action.consumerID,
          peerID: action.peerID,
          mediaTag: action.mediaTag,
          transportID: action.transportID,
          channelID: action.channelID,
          producerID: action.producerID,
          kind: action.kind!,
          paused: action.paused,
          rtpParameters: action.rtpParameters,
          type: action.consumerType
        }
      })
    }),

    onConsumerClosed: MediasoupMediaConsumerActions.consumerClosed.receive((action) => {
      const state = getMutableState(MediasoupMediaProducerConsumerState)
      const networkID = action.$network
      if (!state.value[networkID]) return

      state[networkID].consumers[action.consumerID].set(none)

      if (!Object.keys(state[networkID].consumers).length && !Object.keys(state[networkID].consumers).length) {
        state[networkID].set(none)
      }
    }),

    onConsumerPaused: MediasoupMediaConsumerActions.consumerPaused.receive((action) => {
      const state = getMutableState(MediasoupMediaProducerConsumerState)
      const networkID = action.$network
      if (!state.value[networkID]?.consumers[action.consumerID]) return

      state[networkID].consumers[action.consumerID].merge({
        paused: action.paused
      })
    })
  },

  reactor: () => {
    const networkIDs = useHookstate(getMutableState(MediasoupMediaProducerConsumerState))
    return (
      <>
        {networkIDs.keys.map((id: InstanceID) => (
          <NetworkReactor key={id} networkID={id} />
        ))}
      </>
    )
  }
})

export const NetworkProducer = (props: { networkID: InstanceID; producerID: string }) => {
  const { networkID, producerID } = props
  const producerState = useHookstate(
    getMutableState(MediasoupMediaProducerConsumerState)[networkID].producers[producerID]
  )
  const producerObjectState = useHookstate(
    getMutableState(MediasoupMediaProducersConsumersObjectsState).producers[producerID]
  )
  const transportState = useHookstate(getMutableState(MediasoupTransportObjectsState)[producerState.transportID.value])

  useEffect(() => {
    const peerID = producerState.peerID.value
    const mediaTag = producerState.mediaTag.value
    const producer = producerObjectState.value as any

    if (!producer) return

    return () => {
      // TODO, for some reason this is triggering more often than it should, so check if it actually has been removed
      if (producer.closed || producer._closed) return

      producer.close()

      const network = getStateUnsafe(NetworkState).networks[networkID]

      if (!network) return

      // remove from the peer state
      const media = network.peers[peerID]?.media
      if (media && media[producer.appData.mediaTag]) {
        delete media[producer.appData.mediaTag]
      }

      const state = getState(MediasoupMediaProducerConsumerState)[networkID]
      if (!state) return

      const consumer = Object.values(state.consumers).find((p) => p.peerID === peerID && p.mediaTag === mediaTag)

      // todo, replace this with a better check
      if (consumer && isClient) {
        dispatchAction(
          MediasoupMediaConsumerActions.consumerClosed({
            consumerID: consumer.consumerID,
            $topic: network.topic
          })
        )
      }
    }
  }, [producerObjectState])

  useEffect(() => {
    const producer = producerObjectState.value as any

    if (!producer) return

    if (producer.closed || producer._closed) return

    if (producerState.paused.value && producer.pause) producer.pause()
    if (!producerState.paused.value && producer.resume) producer.resume()
  }, [producerState.paused, producerObjectState])

  useEffect(() => {
    if (!transportState.value || !producerObjectState.value) return
    const producerObject = producerObjectState.get(NO_PROXY_STEALTH)
    return () => {
      producerObject.close()
    }
  }, [transportState, producerObjectState])

  const consumer = Object.values(getState(MediasoupMediaProducerConsumerState)[networkID].consumers).find(
    (p) => p.producerID === producerID
  )

  if (!consumer) return null

  return <NetworkProducerConsumerPause networkID={networkID} producerID={producerID} consumerID={consumer.consumerID} />
}

const NetworkProducerConsumerPause = (props: { networkID: InstanceID; producerID: string; consumerID: string }) => {
  const { networkID, producerID, consumerID } = props

  const producerState = useHookstate(
    getMutableState(MediasoupMediaProducerConsumerState)[networkID].producers[producerID]
  )

  const consumerState = useHookstate(
    getMutableState(MediasoupMediaProducerConsumerState)[networkID].consumers[consumerID]
  )

  useEffect(() => {
    const consumer = consumerState.value

    const network = getState(NetworkState).networks[networkID]

    dispatchAction(
      MediasoupMediaConsumerActions.consumerPaused({
        consumerID: consumer.consumerID,
        paused: !!producerState.paused.value,
        $topic: network.topic
      })
    )
  }, [producerState.paused.value])

  return null
}

export const NetworkConsumer = (props: { networkID: InstanceID; consumerID: string }) => {
  const { networkID, consumerID } = props
  const consumerState = useHookstate(
    getMutableState(MediasoupMediaProducerConsumerState)[networkID].consumers[consumerID]
  )
  const consumerObjectState = useHookstate(
    getMutableState(MediasoupMediaProducersConsumersObjectsState).consumers[consumerID]
  )
  const transportState = useHookstate(getMutableState(MediasoupTransportObjectsState)[consumerState.transportID.value])

  useEffect(() => {
    const consumer = consumerObjectState.value as any
    if (!consumer) return

    return () => {
      // TODO, for some reason this is triggering more often than it should, so check if it actually has been removed
      if (consumerObjectState.value || consumer.closed || consumer._closed) return

      const network = getState(NetworkState).networks[networkID]
      consumer.close()
    }
  }, [consumerObjectState])

  useEffect(() => {
    const consumer = consumerObjectState.value as any
    if (!consumer || consumer.closed || consumer._closed) return

    if (consumerState.paused.value && typeof consumer.pause === 'function') consumer.pause()
    if (!consumerState.paused.value && typeof consumer.resume === 'function') consumer.resume()
  }, [consumerState.paused, consumerObjectState])

  useEffect(() => {
    if (!transportState.value || !consumerObjectState.value) return
    const consumerObject = consumerObjectState.get(NO_PROXY_STEALTH)
    return () => {
      consumerObject.close()
    }
  }, [transportState, consumerObjectState])

  return null
}

const NetworkReactor = (props: { networkID: InstanceID }) => {
  const { networkID } = props
  const networkState = useHookstate(getMutableState(NetworkState).networks[networkID])
  const producers = useHookstate(getMutableState(MediasoupMediaProducerConsumerState)[networkID].producers)
  const consumers = useHookstate(getMutableState(MediasoupMediaProducerConsumerState)[networkID].consumers)

  useEffect(() => {
    if (producers?.value)
      for (const [producerID, producer] of Object.entries(producers.value)) {
        if (!networkState.peers.value[producer.peerID]) {
          producers[producerID].set(none)
        }
      }
    if (consumers?.value)
      for (const [consumerID, consumer] of Object.entries(consumers.value)) {
        if (!networkState.peers.value[consumer.peerID]) {
          consumers[consumerID].set(none)
        }
      }
  }, [networkState.peers])

  return (
    <>
      {producers.keys.map((producerID: string) => (
        <NetworkProducer key={producerID} producerID={producerID} networkID={networkID} />
      ))}
      {consumers.keys.map((consumerID: string) => (
        <NetworkConsumer key={consumerID} consumerID={consumerID} networkID={networkID} />
      ))}
    </>
  )
}
