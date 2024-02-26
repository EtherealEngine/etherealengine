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

import type { UserID } from '@etherealengine/common/src/schema.type.module'
import * as Hyperflux from '@etherealengine/hyperflux'
import { createHyperStore, getState, getStateUnsafe } from '@etherealengine/hyperflux'
import { HyperFlux, HyperStore, disposeStore } from '@etherealengine/hyperflux/functions/StoreFunctions'
import * as bitECS from 'bitecs'

import type { FeathersApplication } from '@feathersjs/feathers'

import type { ServiceTypes } from '@etherealengine/common/declarations'

import { getAllEntities } from 'bitecs'
import { Group, Scene } from 'three'
import { ECSState } from './ECSState'
import { Entity, UndefinedEntity } from './Entity'
import { removeEntity } from './EntityFunctions'
import { removeQuery } from './QueryFunctions'
import { SystemState } from './SystemState'
import { Timer } from './Timer'

export class Engine {
  static instance: Engine

  constructor() {
    const UndefinedEntity = bitECS.addEntity(HyperFlux.store)
  }

  api: FeathersApplication<ServiceTypes>

  /** The uuid of the logged-in user */
  userID: UserID

  /**
   * The peerID of the logged-in user
   * @deprecated - use Engine.instance.store.peerID instead
   */
  get peerID() {
    return Engine.instance.store.peerID
  }

  store = createHyperStore({
    getDispatchId: () => Engine.instance.userID,
    getDispatchTime: () => getState(ECSState).simulationTime,
    getCurrentReactorRoot: () =>
      getStateUnsafe(SystemState).activeSystemReactors.get(getState(SystemState).currentSystemUUID)
  }) as HyperStore

  engineTimer = null! as ReturnType<typeof Timer>

  /**
   * Reference to the three.js scene object.
   */
  scene = new Scene()

  /**
   * The xr origin reference space entity
   */
  originEntity = UndefinedEntity

  /**
   * The xr origin group
   */
  origin = new Group()

  /**
   * The camera entity
   */
  cameraEntity = UndefinedEntity

  /**
   * The local client entity
   */
  localClientEntity = UndefinedEntity
}

globalThis.Engine = Engine
globalThis.Hyperflux = Hyperflux

export async function destroyEngine() {
  Engine.instance.engineTimer?.clear()

  if (Engine.instance.api) {
    if ((Engine.instance.api as any).server) await Engine.instance.api.teardown()

    const knex = (Engine.instance.api as any).get?.('knexClient')
    if (knex) await knex.destroy()
  }

  /** Remove all entities */
  const entities = getAllEntities(HyperFlux.store) as Entity[]

  const entityPromises = [] as Promise<void>[]

  for (const entity of entities) if (entity) entityPromises.push(...removeEntity(entity))

  await Promise.all(entityPromises)

  for (const query of getState(SystemState).reactiveQueryStates) {
    removeQuery(query.query)
  }

  await disposeStore()

  /** @todo include in next bitecs update */
  // bitecs.deleteWorld(Engine.instance)
  Engine.instance = null!
}
