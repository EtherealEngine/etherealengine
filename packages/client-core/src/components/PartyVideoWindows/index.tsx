import { useState } from '@speigg/hookstate'
import React from 'react'

import { useMediaInstanceConnectionState } from '@xrengine/client-core/src/common/services/MediaInstanceConnectionService'
import { accessMediaStreamState } from '@xrengine/client-core/src/media/services/MediaStreamService'
import { accessAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { useUserState } from '@xrengine/client-core/src/user/services/UserService'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'

import PartyParticipantWindow from '../PartyParticipantWindow'

const PartyVideoWindows = (): JSX.Element => {
  const nearbyLayerUsers = useState(accessMediaStreamState().nearbyLayerUsers)
  const selfUserId = useState(accessAuthState().user.id)
  const userState = useUserState()
  const channelConnectionState = useMediaInstanceConnectionState()
  const currentChannelInstanceConnection =
    channelConnectionState.instances[Engine.instance.currentWorld.mediaNetwork?.hostId].ornull
  const displayedUsers = Engine.instance.currentWorld.mediaNetwork?.hostId
    ? currentChannelInstanceConnection.channelType.value === 'channel'
      ? userState.channelLayerUsers.value.filter((user) => user.id !== selfUserId.value)
      : userState.layerUsers.value.filter((user) => !!nearbyLayerUsers.value.find((u) => u.id === user.id))
    : []

  return (
    <>
      {displayedUsers.map((user) => (
        <PartyParticipantWindow peerId={user.id} key={user.id} />
      ))}
    </>
  )
}

export default PartyVideoWindows
