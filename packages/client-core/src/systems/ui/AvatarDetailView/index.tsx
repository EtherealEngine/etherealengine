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

import React from 'react'
import { useTranslation } from 'react-i18next'
import { CircleGeometry, Mesh, MeshBasicMaterial } from 'three'

import { setComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { NO_PROXY, createState, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { WorldState } from '@etherealengine/spatial/src/networking/interfaces/WorldState'
import { createXRUI } from '@etherealengine/spatial/src/xrui/functions/createXRUI'
import { useXRUIState } from '@etherealengine/spatial/src/xrui/functions/useXRUIState'

import { NetworkState } from '@etherealengine/spatial/src/networking/NetworkState'
import { AvatarUIState } from '../../state/AvatarUIState'
import styleString from './index.scss?inline'

export function createAvatarDetailView(id: string) {
  const videoPreviewMesh = new Mesh(new CircleGeometry(0.25, 32), new MeshBasicMaterial())
  const ui = createXRUI(
    AvatarDetailView,
    createState({
      id,
      videoPreviewMesh
    })
  )
  setComponent(ui.entity, NameComponent, 'avatar-detail-ui-' + id)
  return ui
}

interface AvatarDetailState {
  id: string
}

const AvatarDetailView = () => {
  const { t } = useTranslation()
  const detailState = useXRUIState<AvatarDetailState>()
  const user = NetworkState.worldNetworkState?.peers
    ? Object.values(NetworkState.worldNetwork.peers).find((peer) => peer.userId === detailState.id.value)
    : undefined
  const worldState = useHookstate(getMutableState(WorldState)).get(NO_PROXY)
  const usersTypingState = useHookstate(getMutableState(AvatarUIState).usersTyping)
  const usersTyping = usersTypingState[detailState.id.value]?.value
  const username = worldState?.userNames && user ? worldState.userNames[user.userId] : 'A user'

  return (
    <>
      <link href="https://fonts.googleapis.com/css?family=Lato:400" rel="stylesheet" type="text/css" />
      <style>{styleString}</style>
      {user && (
        <div className="avatarName">
          {username}
          {usersTyping && <h6 className="typingIndicator">{t('common:typing')}</h6>}
        </div>
      )}
    </>
  )
}
