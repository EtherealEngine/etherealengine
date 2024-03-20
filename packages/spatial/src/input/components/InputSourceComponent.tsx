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

import { defineQuery } from '@etherealengine/ecs'
import { defineComponent, getComponent, setComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Entity, UndefinedEntity } from '@etherealengine/ecs/src/Entity'
import { Raycaster } from 'three'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { XRHandComponent, XRSpaceComponent } from '../../xr/XRComponents'
import { ReferenceSpace } from '../../xr/XRState'
import { ButtonStateMap } from '../state/ButtonState'

export const InputSourceComponent = defineComponent({
  name: 'InputSourceComponent',

  onInit: () => {
    return {
      source: {} as XRInputSource,
      buttons: {} as Readonly<ButtonStateMap>,
      raycaster: new Raycaster(),
      intersections: [] as Array<{
        entity: Entity
        distance: number
      }>,
      captured: UndefinedEntity
    }
  },

  onSet: (entity, component, args: { source?: XRInputSource; gamepad?: Gamepad }) => {
    const source =
      args.source ??
      ({
        handedness: 'none',
        targetRayMode: 'screen',
        targetRaySpace: {} as XRSpace,
        gripSpace: undefined,
        gamepad:
          args.gamepad ??
          ({
            axes: [0, 0, 0, 0],
            buttons: [],
            connected: true,
            hapticActuators: [],
            id: 'emulated-gamepad-' + entity,
            index: 0,
            mapping: 'standard',
            timestamp: performance.now(),
            vibrationActuator: null
          } as Gamepad),
        profiles: [],
        hand: undefined
      } as XRInputSource)

    component.source.set(source)

    // if we have a real input source, we should add the XRSpaceComponent
    if (args.source?.targetRaySpace) {
      InputSourceComponent.entitiesByInputSource.set(args.source, entity)
      const space = args.source.targetRaySpace
      const baseSpace =
        args.source.targetRayMode === 'tracked-pointer' ? ReferenceSpace.localFloor : ReferenceSpace.viewer
      if (!baseSpace) throw new Error('Base space not found')
      setComponent(entity, XRSpaceComponent, { space, baseSpace })
    }

    if (source.hand) {
      setComponent(entity, XRHandComponent)
    }

    setComponent(entity, TransformComponent)
  },

  getMergedButtons(inputSourceEntities = inputSourceQuery()) {
    return Object.assign(
      {} as ButtonStateMap,
      ...inputSourceEntities.map((eid) => {
        return getComponent(eid, InputSourceComponent).buttons
      })
    ) as ButtonStateMap
  },

  getMergedAxes(inputSourceEntities = inputSourceQuery()) {
    const axes = [0, 0, 0, 0] as [number, number, number, number]
    for (const eid of inputSourceEntities) {
      const inputSource = getComponent(eid, InputSourceComponent)
      if (inputSource.source.gamepad?.axes) {
        for (let i = 0; i < 4; i++) {
          // keep the largest value (positive or negative)
          const newAxis = inputSource.source.gamepad?.axes[i] ?? 0
          axes[i] = Math.abs(axes[i]) > Math.abs(newAxis) ? axes[i] : newAxis
        }
      }
    }
    return axes
  },

  getClosestIntersectedEntity(inputSourceEntity: Entity) {
    return getComponent(inputSourceEntity, InputSourceComponent).intersections[0]?.entity
  },

  entitiesByInputSource: new WeakMap<XRInputSource, Entity>()
})

const inputSourceQuery = defineQuery([InputSourceComponent])
