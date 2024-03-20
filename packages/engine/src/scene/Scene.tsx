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

import { SceneDataType, SceneID, scenePath } from '@etherealengine/common/src/schema.type.module'
import { EntityUUID, UUIDComponent } from '@etherealengine/ecs'
import { getComponent, getOptionalComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { UndefinedEntity } from '@etherealengine/ecs/src/Entity'
import {
  NO_PROXY,
  Topic,
  defineAction,
  defineState,
  dispatchAction,
  getMutableState,
  getState,
  none,
  useHookstate
} from '@etherealengine/hyperflux'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { EntityTreeComponent } from '@etherealengine/spatial/src/transform/components/EntityTree'
import React, { useLayoutEffect } from 'react'
import { Color, Texture } from 'three'
import matches, { Validator } from 'ts-matches'
import { SceneComponent } from './components/SceneComponent'
import { migrateOldColliders } from './functions/migrateOldColliders'
import { migrateOldComponentJSONIDs } from './functions/migrateOldComponentJSONIDs'
import { migrateSceneSettings } from './functions/migrateSceneSettings'
import { serializeEntity } from './functions/serializeWorld'
import { SceneLoadingReactor } from './systems/SceneLoadingSystem'
import { EntityJsonType, SceneJsonType } from './types/SceneTypes'

export interface SceneSnapshotInterface {
  data: SceneJsonType
}

export const SceneState = defineState({
  name: 'SceneState',
  initial: () => ({
    scenes: {} as Record<SceneID, Omit<SceneDataType, 'scene'> & { scene: SceneJsonType }>,
    sceneLoaded: false,
    loadingProgress: 0,
    background: null as null | Color | Texture,
    environment: null as null | Texture,
    sceneModified: false
  }),

  getScene: (sceneID: SceneID) => {
    return getState(SceneState).scenes[sceneID]
  },

  useScene: (sceneID: SceneID) => {
    return useHookstate(getMutableState(SceneState).scenes[sceneID]).scene
  },

  loadScene: (sceneID: SceneID, sceneData: SceneDataType) => {
    const data: SceneJsonType = sceneData.scene

    migrateOldComponentJSONIDs(data)
    migrateSceneSettings(data)
    for (const [uuid, entityJson] of Object.entries(data.entities)) {
      migrateOldColliders(entityJson)
    }

    getMutableState(SceneState).scenes[sceneID].set(sceneData)

    dispatchAction(SceneSnapshotAction.createSnapshot({ sceneID, data }))
  },

  unloadScene: (sceneID: SceneID) => {
    getMutableState(SceneState).scenes[sceneID].set(none)
  },

  getRootEntity: (sceneID: SceneID) => {
    if (!getState(SceneState).scenes[sceneID]) return UndefinedEntity
    const scene = getState(SceneState).scenes[sceneID].scene
    return UUIDComponent.getEntityByUUID(scene.root)
  }
})

export const SceneServices = {
  setCurrentScene: (sceneID: SceneID) => {
    Engine.instance.api
      .service(scenePath)
      .get('' as SceneID, { query: { sceneKey: sceneID } })
      .then((sceneData: SceneDataType) => {
        SceneState.loadScene(sceneID, sceneData)
      })

    return () => {
      SceneState.unloadScene(sceneID)
    }
  }
}

export class SceneSnapshotAction {
  static createSnapshot = defineAction({
    type: 'ee.scene.snapshot.CREATE_SNAPSHOT' as const,
    sceneID: matches.string as Validator<unknown, SceneID>,
    // selectedEntities: matches.array as Validator<unknown, Array<EntityUUID>>,
    data: matches.object as Validator<unknown, SceneJsonType>
  })

  static undo = defineAction({
    type: 'ee.scene.snapshot.UNDO' as const,
    sceneID: matches.string as Validator<unknown, SceneID>,
    count: matches.number
    // $topic: EditorTopic,
    // $cache: true
  })

  static redo = defineAction({
    type: 'ee.scene.snapshot.REDO' as const,
    sceneID: matches.string as Validator<unknown, SceneID>,
    count: matches.number
    // $topic: EditorTopic,
    // $cache: true
  })

  static clearHistory = defineAction({
    type: 'ee.scene.snapshot.CLEAR_HISTORY' as const,
    sceneID: matches.string as Validator<unknown, SceneID>
  })
}

export const SceneSnapshotState = defineState({
  name: 'SceneSnapshotState',
  initial: {} as Record<
    SceneID,
    {
      snapshots: Array<SceneSnapshotInterface>
      index: number
    }
  >,

  receptors: {
    onSnapshot: SceneSnapshotAction.createSnapshot.receive((action) => {
      const { data } = action
      const state = getMutableState(SceneSnapshotState)[action.sceneID]
      if (!state.value) {
        state.set({
          index: 0,
          snapshots: [{ data }]
        })
        return
      }
      state.snapshots.set([...state.snapshots.get(NO_PROXY).slice(0, state.index.value + 1), { data }])
      state.index.set(state.index.value + 1)
    }),

    onUndo: SceneSnapshotAction.undo.receive((action) => {
      const state = getMutableState(SceneSnapshotState)[action.sceneID]
      if (state.index.value <= 0) return
      state.index.set(Math.max(state.index.value - action.count, 0))
    }),

    onRedo: SceneSnapshotAction.redo.receive((action) => {
      const state = getMutableState(SceneSnapshotState)[action.sceneID]
      if (state.index.value >= state.snapshots.value.length - 1) return
      state.index.set(Math.min(state.index.value + action.count, state.snapshots.value.length - 1))
    }),

    onClearHistory: SceneSnapshotAction.clearHistory.receive((action) => {
      const state = getMutableState(SceneSnapshotState)[action.sceneID]
      const data = state.snapshots[0].data.get(NO_PROXY)
      getMutableState(SceneSnapshotState)[action.sceneID].set({
        index: 0,
        snapshots: [{ data }]
      })
    })
  },

  reactor: () => {
    const state = useHookstate(getMutableState(SceneSnapshotState))
    return (
      <>
        {state.keys.map((sceneID: SceneID) => (
          <SceneSnapshotReactor sceneID={sceneID} key={sceneID} />
        ))}
      </>
    )
  },

  useSnapshotIndex(sceneID: SceneID) {
    return useHookstate(getMutableState(SceneSnapshotState)[sceneID].index)
  },

  cloneCurrentSnapshot: (sceneID: SceneID) => {
    const state = getState(SceneSnapshotState)[sceneID]
    return JSON.parse(JSON.stringify({ sceneID, ...state.snapshots[state.index] })) as SceneSnapshotInterface & {
      sceneID: SceneID
    }
  },

  /** @todo reserved for future use */
  snapshotFromECS: (sceneID: SceneID) => {
    const entities = SceneComponent.entitiesByScene[sceneID] ?? []
    const serializedEntities: [EntityUUID, EntityJsonType][] = entities.map((entity) => {
      const components = serializeEntity(entity)
      const name = getComponent(entity, NameComponent)
      const uuid = getComponent(entity, UUIDComponent)
      const parentEntity = getOptionalComponent(entity, EntityTreeComponent)?.parentEntity
      const entityJson: EntityJsonType = {
        name,
        components
      }
      if (parentEntity) {
        entityJson.parent = getComponent(parentEntity, UUIDComponent)
      }
      return [uuid, entityJson]
    })
    let rootEntity = entities[0]
    while (getComponent(rootEntity, SceneComponent) === sceneID) {
      const entityTree = getOptionalComponent(rootEntity, EntityTreeComponent)
      if (!entityTree || entityTree.parentEntity === null) break
      rootEntity = entityTree.parentEntity
    }
    const root = getComponent(rootEntity, UUIDComponent)
    const data: SceneJsonType = {
      entities: {} as Record<EntityUUID, EntityJsonType>,
      root,
      version: 0
    }
    for (const [uuid, entityJson] of serializedEntities) {
      data.entities[uuid] = entityJson
    }
    const snapshot: SceneSnapshotInterface = {
      data
    }
    return snapshot
  }
})

export const EditorTopic = 'editor' as Topic

const SceneSnapshotReactor = (props: { sceneID: SceneID }) => {
  const sceneState = useHookstate(getMutableState(SceneSnapshotState)[props.sceneID])

  useLayoutEffect(() => {
    if (!sceneState.index.value) return
    getMutableState(SceneState).sceneModified.set(true)
    // update scene state with the current snapshot
    getMutableState(SceneState).scenes[props.sceneID].scene.set(
      sceneState.snapshots[sceneState.index.value].data.get(NO_PROXY)
    )
  }, [sceneState.index])

  return <SceneLoadingReactor />
}
