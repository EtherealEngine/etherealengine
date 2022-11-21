import { OpaqueType } from './OpaqueType'
import { UserId } from './UserId'

export type PeerID = OpaqueType<'PeerID'> & string

export const SelfPeerID = 'self' as PeerID

export type PeersUpdateType = {
  peerID: PeerID
  peerIndex: number
  userID: UserId
  userIndex: number
  name: string
}
