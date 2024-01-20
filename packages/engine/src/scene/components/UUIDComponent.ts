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

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { NO_PROXY_STEALTH, State, hookstate, useHookstate } from '@etherealengine/hyperflux'
import { Entity, UndefinedEntity } from '../../ecs/classes/Entity'
import { defineComponent, setComponent } from '../../ecs/functions/ComponentFunctions'
import { createEntity } from '../../ecs/functions/EntityFunctions'

export const UUIDComponent = defineComponent({
  name: 'UUIDComponent',
  jsonID: 'uuid-component',

  onInit: () => '' as EntityUUID,

  onSet: (entity, component, uuid: EntityUUID) => {
    if (component.value === uuid) return

    // throw error if uuid is already in use
    const currentEntity = UUIDComponent.getEntityByUUID(uuid)
    if (currentEntity !== UndefinedEntity && currentEntity !== entity) {
      throw new Error(`UUID ${uuid} is already in use`)
    }

    // remove old uuid
    const currentUUID = component.value
    _getUUIDState(currentUUID).set(UndefinedEntity)

    // set new uuid
    component.set(uuid)
    _getUUIDState(uuid).set(entity)
  },

  onRemove: (entity, component) => {
    const uuid = component.value
    _getUUIDState(uuid).set(UndefinedEntity)
  },

  entitiesByUUIDState: {} as Record<EntityUUID, State<Entity>>,

  useEntityByUUID(uuid: EntityUUID) {
    return useHookstate(_getUUIDState(uuid)).value
  },

  getEntityByUUID(uuid: EntityUUID) {
    return _getUUIDState(uuid).get(NO_PROXY_STEALTH)
  },

  getOrCreateEntityByUUID(uuid: EntityUUID) {
    const state = _getUUIDState(uuid)
    if (!state.value) {
      const entity = createEntity()
      setComponent(entity, UUIDComponent, uuid)
    }
    return state.value
  }
})

function _getUUIDState(uuid) {
  let entityState = UUIDComponent.entitiesByUUIDState[uuid]
  if (!entityState) {
    entityState = hookstate(UndefinedEntity)
    UUIDComponent.entitiesByUUIDState[uuid] = entityState
  }
  return entityState
}
