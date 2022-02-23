import { NetworkId } from '@xrengine/engine/src/common/types/NetworkId'
import { UserId } from '@xrengine/engine/src/common/types/UserId'
import type SocketIO from 'socket.io'
import type { AvatarProps } from './WorldState'

export interface NetworkClient {
  userId: UserId
  userIndex: number
  name: string
  subscribedChatUpdates?: string[]
  // The following properties are only present on the server
  socket?: SocketIO.Socket
  socketId?: string
  lastSeenTs?: any
  joinTs?: any
  media?: {}
  consumerLayers?: {}
  stats?: {}
  instanceSendTransport?: any
  instanceRecvTransport?: any
  channelSendTransport?: any
  channelRecvTransport?: any
  dataConsumers?: Map<string, any> // Key => id of data producer
  dataProducers?: Map<string, any> // Key => label of data channel}
  avatarDetail?: AvatarProps
  networkId?: NetworkId // to easily retrieve the network object correspending to this client
}
