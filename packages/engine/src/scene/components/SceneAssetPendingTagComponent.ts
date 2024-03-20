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
  Entity,
  defineComponent,
  getComponent,
  getMutableComponent,
  hasComponent,
  removeComponent,
  setComponent
} from '@etherealengine/ecs'
import { createState, none } from '@etherealengine/hyperflux'

export const SceneAssetPendingTagComponent = defineComponent({
  name: 'SceneAssetPendingTagComponent',

  onInit(entity) {
    return [] as string[]
  },

  onSet(entity, component, json) {
    if (!json) return

    if (Array.isArray(json)) component.set(json)
  },

  addResource: (entity: Entity, resource: string) => {
    if (!hasComponent(entity, SceneAssetPendingTagComponent)) setComponent(entity, SceneAssetPendingTagComponent)
    if (!getComponent(entity, SceneAssetPendingTagComponent).includes(resource)) {
      getMutableComponent(entity, SceneAssetPendingTagComponent).merge([resource])
    }
  },

  removeResource: (entity: Entity, resource: string) => {
    if (!hasComponent(entity, SceneAssetPendingTagComponent)) return
    const index = getComponent(entity, SceneAssetPendingTagComponent).indexOf(resource)
    if (index < 0) return
    getMutableComponent(entity, SceneAssetPendingTagComponent)[index].set(none)
    if (!getComponent(entity, SceneAssetPendingTagComponent).length)
      removeComponent(entity, SceneAssetPendingTagComponent)
  },

  loadingProgress: createState(
    {} as Record<
      Entity,
      {
        loadedAmount: number
        totalAmount: number
      }
    >
  )
})

/**
 * - We need to move this component's functionality into Component.resources and ResourceState and handle inside of our useLoader hooks.
 * - Map all loaded scene entities to EntityUUID => ResourceID => Resource, and collapse into list of Resources.
 * - Scene loading percentage is derived from the sum of all loaded resources / total resources.
 */
