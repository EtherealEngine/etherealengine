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

import { useEffect } from 'react'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import {
  ErrorBoundary,
  NO_PROXY,
  State,
  defineActionQueue,
  dispatchAction,
  getMutableState,
  getState,
  useHookstate
} from '@etherealengine/hyperflux'
import { SystemImportType, getSystemsFromSceneData } from '@etherealengine/projects/loadSystemInjection'

import { ComponentJsonType, EntityJsonType, SceneID, scenePath } from '@etherealengine/common/src/schema.type.module'
import { Not } from 'bitecs'
import React from 'react'
import { Group } from 'three'
import { Engine } from '../../ecs/classes/Engine'
import { EngineActions, EngineState } from '../../ecs/classes/EngineState'
import { Entity, UndefinedEntity } from '../../ecs/classes/Entity'
import { SceneState } from '../../ecs/classes/Scene'
import {
  ComponentJSONIDMap,
  defineQuery,
  getComponent,
  hasComponent,
  removeComponent,
  setComponent,
  useOptionalComponent,
  useQuery
} from '../../ecs/functions/ComponentFunctions'
import { PresentationSystemGroup } from '../../ecs/functions/EngineFunctions'
import { entityExists, removeEntity, useEntityContext } from '../../ecs/functions/EntityFunctions'
import { EntityTreeComponent } from '../../ecs/functions/EntityTree'
import { QueryReactor, defineSystem, destroySystem } from '../../ecs/functions/SystemFunctions'
import { NetworkState } from '../../networking/NetworkState'
import { WorldNetworkAction } from '../../networking/functions/WorldNetworkAction'
import { PhysicsState } from '../../physics/state/PhysicsState'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { GLTFLoadedComponent } from '../components/GLTFLoadedComponent'
import { GroupComponent, addObjectToGroup } from '../components/GroupComponent'
import { NameComponent } from '../components/NameComponent'
import { SceneAssetPendingTagComponent } from '../components/SceneAssetPendingTagComponent'
import { SceneDynamicLoadTagComponent } from '../components/SceneDynamicLoadTagComponent'
import { SceneObjectComponent } from '../components/SceneObjectComponent'
import { SceneTagComponent } from '../components/SceneTagComponent'
import { SourceComponent } from '../components/SourceComponent'
import { UUIDComponent } from '../components/UUIDComponent'
import { VisibleComponent } from '../components/VisibleComponent'
import { proxifyParentChildRelationships } from '../functions/loadGLTFModel'

const query = defineQuery([SceneAssetPendingTagComponent])

const reactor = () => {
  const scenes = useHookstate(getMutableState(SceneState).scenes)
  const sceneAssetPendingTagQuery = useQuery([SceneAssetPendingTagComponent])
  const assetLoadingState = useHookstate(SceneAssetPendingTagComponent.loadingProgress)
  const entities = useHookstate(UUIDComponent.entitiesByUUIDState)

  const physicsWorld = useHookstate(getMutableState(PhysicsState).physicsWorld)

  useEffect(() => {
    if (!getState(EngineState).sceneLoading) return

    const values = Object.values(assetLoadingState.value)
    const total = values.reduce((acc, curr) => acc + curr.totalAmount, 0)
    const loaded = values.reduce((acc, curr) => acc + curr.loadedAmount, 0)
    const progress = !sceneAssetPendingTagQuery.length || total === 0 ? 100 : Math.round((100 * loaded) / total)

    getMutableState(EngineState).loadingProgress.set(progress)

    if (!sceneAssetPendingTagQuery.length && !getState(EngineState).sceneLoaded) {
      getMutableState(EngineState).merge({
        sceneLoading: false,
        sceneLoaded: true
      })
      dispatchAction(EngineActions.sceneLoaded({}))
      SceneAssetPendingTagComponent.loadingProgress.set({})
    }
  }, [sceneAssetPendingTagQuery.length, assetLoadingState, entities.keys])

  if (!physicsWorld.value) return null

  return (
    <>
      <QueryReactor
        Components={[
          EntityTreeComponent,
          TransformComponent,
          UUIDComponent,
          SceneObjectComponent,
          Not(SceneTagComponent)
        ]}
        ChildEntityReactor={NetworkedSceneObjectReactor}
      />
      {Object.keys(scenes.value).map((sceneID: SceneID) => (
        <SceneReactor key={sceneID} sceneID={sceneID} />
      ))}
    </>
  )
}

/** @todo - this needs to be rework according to #9105 # */
const NetworkedSceneObjectReactor = () => {
  const entity = useEntityContext()
  const loaded = useHookstate(false)
  const worldNetwork = useHookstate(NetworkState.worldNetworkState)

  useEffect(() => {
    if (loaded.value) return
    if (NetworkState.worldNetwork?.isHosting) {
      if (!entityExists(entity)) return
      if (hasComponent(entity, GLTFLoadedComponent)) return
      const uuid = getComponent(entity, UUIDComponent)
      const transform = getComponent(entity, TransformComponent)
      dispatchAction(
        WorldNetworkAction.spawnObject({
          entityUUID: uuid,
          prefab: '',
          position: transform.position.clone(),
          rotation: transform.rotation.clone()
        })
      )
      loaded.set(true)
    }
  }, [worldNetwork])

  return null
}

const SceneReactor = (props: { sceneID: SceneID }) => {
  const currentSceneSnapshotState = SceneState.useScene(props.sceneID)
  const entities = currentSceneSnapshotState.entities
  const rootUUID = currentSceneSnapshotState.root.value

  const ready = useHookstate(false)
  const systemsLoaded = useHookstate([] as SystemImportType[])
  const isActiveScene = useHookstate(getMutableState(SceneState).activeScene).value === props.sceneID

  useEffect(() => {
    const scene = getState(SceneState).scenes[props.sceneID]
    const { project } = scene.metadata
    const data = scene.snapshots[scene.index].data
    getSystemsFromSceneData(project, data).then((systems) => {
      // wait to set scene loading state until systems are loaded
      if (isActiveScene)
        getMutableState(EngineState).merge({
          sceneLoading: true,
          sceneLoaded: false
        })

      if (systems.length) {
        systemsLoaded.set(systems)
      } else {
        ready.set(true)
      }
    })

    if (!isActiveScene) return

    const sceneUpdatedListener = async () => {
      const [projectName, sceneName] = props.sceneID.split('/')
      const sceneData = await Engine.instance.api
        .service(scenePath)
        .get(null, { query: { project: projectName, name: sceneName } })
      SceneState.loadScene(props.sceneID, sceneData)
    }
    // for testing
    // window.addEventListener('keydown', (ev) => {
    //   if (ev.code === 'KeyN') sceneUpdatedListener()
    // })

    Engine.instance.api.service(scenePath).on('updated', sceneUpdatedListener)

    return () => {
      Engine.instance.api.service(scenePath).off('updated', sceneUpdatedListener)
    }
  }, [])

  useEffect(() => {
    ready.set(true)
    const systems = [...systemsLoaded.value]
    return () => {
      for (const system of systems) {
        destroySystem(system.systemUUID)
      }
    }
  }, [systemsLoaded.length])

  return (
    <>
      {ready.value &&
        Object.entries(entities.value).map(([entityUUID, data]) =>
          entityUUID === rootUUID && isActiveScene ? (
            <EntitySceneRootLoadReactor
              key={entityUUID}
              sceneID={props.sceneID}
              entityUUID={entityUUID as EntityUUID}
            />
          ) : (
            <EntityLoadReactor
              key={entityUUID + ' ' + data.parent}
              sceneID={props.sceneID}
              entityUUID={entityUUID as EntityUUID}
            />
          )
        )}
    </>
  )
}

/** @todo eventually, this will become redundant */
const EntitySceneRootLoadReactor = (props: { entityUUID: EntityUUID; sceneID: SceneID }) => {
  const entityState = SceneState.useScene(props.sceneID).entities[props.entityUUID]
  const selfEntity = useHookstate(UndefinedEntity)

  useEffect(() => {
    const entity = UUIDComponent.getOrCreateEntityByUUID(props.entityUUID)
    setComponent(entity, NameComponent, entityState.name.value)
    setComponent(entity, VisibleComponent, true)
    setComponent(entity, SourceComponent, props.sceneID)
    setComponent(entity, SceneTagComponent, true)
    setComponent(entity, TransformComponent)
    setComponent(entity, SceneObjectComponent)
    setComponent(entity, EntityTreeComponent, { parentEntity: null })

    loadComponents(entity, entityState.components.get(NO_PROXY))

    selfEntity.set(entity)

    return () => {
      removeEntity(entity)
    }
  }, [])

  return (
    <>
      {selfEntity.value
        ? entityState.components.map((compState) => (
            <ErrorBoundary key={compState.name.value}>
              <ComponentLoadReactor
                componentID={compState.value.name}
                entityUUID={props.entityUUID}
                componentJSONState={compState}
              />
            </ErrorBoundary>
          ))
        : null}
    </>
  )
}

const EntityLoadReactor = (props: { entityUUID: EntityUUID; sceneID: SceneID }) => {
  const entityState = SceneState.useScene(props.sceneID).entities[props.entityUUID]
  const parentEntity = UUIDComponent.useEntityByUUID(entityState.value.parent!)

  return (
    <>
      {parentEntity ? (
        <ErrorBoundary key={props.entityUUID + ' - ' + parentEntity}>
          <EntityChildLoadReactor
            parentEntity={parentEntity}
            entityUUID={props.entityUUID}
            sceneID={props.sceneID}
            entityJSONState={entityState}
          />
        </ErrorBoundary>
      ) : (
        <></>
      )}
    </>
  )
}

const EntityChildLoadReactor = (props: {
  parentEntity: Entity
  entityUUID: EntityUUID
  sceneID: SceneID
  entityJSONState: State<EntityJsonType>
}) => {
  const parentEntity = props.parentEntity
  const selfEntity = useHookstate(UndefinedEntity)
  const sceneLoaded = useHookstate(getMutableState(EngineState).sceneLoaded)
  const entityJSONState = props.entityJSONState
  const parentLoaded = !!useOptionalComponent(parentEntity, UUIDComponent)
  const dynamicParentState = useOptionalComponent(parentEntity, SceneDynamicLoadTagComponent)

  useEffect(() => {
    // ensure parent has been deserialized before checking if dynamically loaded
    if (!parentLoaded) return

    // if parent is dynamically loaded, wait for it to be loaded
    if (!getState(EngineState).isEditor && dynamicParentState?.value && !dynamicParentState.loaded.value) return

    const entity = UUIDComponent.getOrCreateEntityByUUID(props.entityUUID)

    selfEntity.set(entity)

    setComponent(entity, SceneObjectComponent)
    setComponent(entity, EntityTreeComponent, {
      parentEntity,
      uuid: props.entityUUID,
      childIndex: entityJSONState.index.value
    })

    if (!hasComponent(entity, GroupComponent)) {
      const obj3d = new Group()
      obj3d.entity = entity
      addObjectToGroup(entity, obj3d)
      proxifyParentChildRelationships(obj3d)
    }

    setComponent(entity, SourceComponent, props.sceneID)
    loadComponents(entity, entityJSONState.components.get(NO_PROXY))

    return () => {
      removeEntity(entity)
    }
  }, [dynamicParentState?.loaded, parentLoaded])

  useEffect(() => {
    const entity = UUIDComponent.getEntityByUUID(props.entityUUID)
    if (!entity) return
    setComponent(entity, NameComponent, entityJSONState.name.value)
  }, [entityJSONState.name, selfEntity])

  useEffect(() => {
    const entity = UUIDComponent.getEntityByUUID(props.entityUUID)
    if (!entity) return
    const uuid = props.entityUUID
    setComponent(entity, EntityTreeComponent, {
      parentEntity,
      uuid,
      childIndex: entityJSONState.index.value
    })
  }, [entityJSONState.parent, entityJSONState.index, selfEntity])

  return (
    <>
      {/* 
        we only need to include component reactors once the scene has loaded.
        Scene loading is handled entirely through the first useEffect in this reactor
      */}
      {selfEntity.value && sceneLoaded.value
        ? entityJSONState.components.map((compState) => (
            <ErrorBoundary key={compState.value.name + ' - ' + selfEntity.value}>
              <ComponentLoadReactor
                componentID={compState.value.name}
                entityUUID={props.entityUUID}
                componentJSONState={compState}
              />
            </ErrorBoundary>
          ))
        : null}
    </>
  )
}

const ComponentLoadReactor = (props: {
  componentID: string
  entityUUID: EntityUUID
  componentJSONState: State<ComponentJsonType>
}) => {
  const componentState = props.componentJSONState

  useEffect(() => {
    if (!componentState?.value) return
    const entity = UUIDComponent.getEntityByUUID(props.entityUUID)
    const component = componentState.get(NO_PROXY)
    return () => {
      // if entity has been removed, we don't need to remove components
      if (!entity || !entityExists(entity)) return
      removeComponent(entity, ComponentJSONIDMap.get(component.name)!)
    }
  }, [])

  useEffect(() => {
    /** @todo this is a hack fix for variants */
    if (!getState(EngineState).isEditing) return
    if (!componentState?.value) return
    const entity = UUIDComponent.getEntityByUUID(props.entityUUID)
    loadComponents(entity, [componentState.get(NO_PROXY)])
  }, [componentState])

  return null
}

/** load all components synchronously to ensure no desync */
const loadComponents = (entity: Entity, components: ComponentJsonType[]) => {
  for (const component of components) {
    /** @todo - we have to check for existence here, as the dynamic loading parent component takes a re-render to load in */
    if (!entity || !entityExists(entity)) {
      console.trace('Entity does not exist', entity)
      continue
    }

    const Component = ComponentJSONIDMap.get(component.name)
    if (!Component) {
      console.warn('[SceneLoading] could not find component name', component.name)
      continue
    }

    try {
      setComponent(entity, Component, component.props)
    } catch (e) {
      console.error(`Error loading scene entity: `, getComponent(entity, UUIDComponent), entity, component)
      console.error(e)
      continue
    }
  }
}

const sceneLoadedActionQueue = defineActionQueue(EngineActions.sceneLoaded.matches)

const execute = () => {
  if (sceneLoadedActionQueue().length) getMutableState(EngineState).merge({ sceneLoading: false, sceneLoaded: true })
}

export const SceneLoadingSystem = defineSystem({
  uuid: 'ee.engine.scene.SceneLoadingSystem',
  insert: { after: PresentationSystemGroup },
  execute,
  reactor
})
