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

import * as bitECS from 'bitecs'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'

import { HyperFlux } from '@etherealengine/hyperflux'
import { removeAllComponents } from './ComponentFunctions'
import { Entity, EntityUUID, UndefinedEntity } from './Entity'

export const createEntity = (): Entity => {
  let entity = bitECS.addEntity(HyperFlux.store)
  if (entity === 0) entity = bitECS.addEntity(HyperFlux.store) // always discard entity 0 since we do a lot of `if (entity)` checks
  return entity as Entity
}

export const removeEntity = (entity: Entity) => {
  if (!entity || !entityExists(entity)) return [] ///throw new Error(`[removeEntity]: Entity ${entity} does not exist in the world`)

  removeAllComponents(entity)

  bitECS.removeEntity(HyperFlux.store, entity)
}

export const entityExists = (entity: Entity) => {
  return bitECS.entityExists(HyperFlux.store, entity)
}

export const EntityContext = React.createContext(UndefinedEntity)

export const useEntityContext = () => {
  return React.useContext(EntityContext)
}

export const generateEntityUUID = () => {
  return uuidv4() as EntityUUID
}
