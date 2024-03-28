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

import {
  ECSState,
  Engine,
  PresentationSystemGroup,
  defineSystem,
  getComponent,
  getMutableComponent,
  getOptionalComponent,
  getOptionalMutableComponent,
  hasComponent
} from '@etherealengine/ecs'
import { getState } from '@etherealengine/hyperflux'
import { TransformComponent } from '@etherealengine/spatial'
import { FollowCameraComponent } from '@etherealengine/spatial/src/camera/components/FollowCameraComponent'
import { XRControlsState } from '@etherealengine/spatial/src/xr/XRState'
import { Vector3 } from 'three'
import { AvatarComponent } from '../components/AvatarComponent'
import { AvatarHeadDecapComponent } from '../components/AvatarIKComponents'
import { TransparencyDitheringComponent } from '../components/TransparencyDitheringComponent'

const eyeOffset = 0.25
const execute = () => {
  const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity()
  const deltaSeconds = getState(ECSState).deltaSeconds
  const cameraDithering = getOptionalMutableComponent(selfAvatarEntity, TransparencyDitheringComponent[0])
  if (!cameraDithering) return

  const cameraAttached = getState(XRControlsState).isCameraAttachedToAvatar

  const avatarComponent = getComponent(selfAvatarEntity, AvatarComponent)
  const headDithering = getMutableComponent(selfAvatarEntity, TransparencyDitheringComponent[1])
  headDithering.center.set(new Vector3(0, avatarComponent.eyeHeight, 0))
  const cameraComponent = getOptionalComponent(Engine.instance.cameraEntity, FollowCameraComponent)
  headDithering.distance.set(
    cameraComponent && !cameraAttached ? Math.max(Math.pow(cameraComponent.distance * 5, 2.5), 3) : 3.25
  )
  headDithering.exponent.set(cameraAttached ? 12 : 8)
  getMutableComponent(selfAvatarEntity, TransparencyDitheringComponent[0]).center.set(
    getComponent(Engine.instance.viewerEntity, TransformComponent).position
  )
  cameraDithering.distance.set(cameraAttached ? 8 : 3)
  cameraDithering.exponent.set(cameraAttached ? 10 : 2)

  if (!cameraComponent) return
  const hasDecapComponent = hasComponent(selfAvatarEntity, AvatarHeadDecapComponent)
  if (hasDecapComponent) cameraComponent.offset.setZ(Math.min(cameraComponent.offset.z + deltaSeconds, eyeOffset))
  else cameraComponent.offset.setZ(Math.max(cameraComponent.offset.z - deltaSeconds, 0))
}

export const AvatarTransparencySystem = defineSystem({
  uuid: 'AvatarTransparencySystem',
  execute,
  insert: { with: PresentationSystemGroup }
})
