import { subscribable } from '@hookstate/subscribable'
import { string } from 'ts-matches'

import { ComponentJson, EntityJson } from '@xrengine/common/src/interfaces/SceneInterface'
import {
  createMappedComponent,
  defineComponent,
  hasComponent,
  removeComponent
} from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { hookstate, StateMethodsDestroy } from '@xrengine/hyperflux/functions/StateFunctions'

import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import { removeEntity } from '../../ecs/functions/EntityFunctions'
import { iterateEntityNode, removeEntityNodeFromParent } from '../../ecs/functions/EntityTree'
import { serializeEntity } from '../functions/serializeWorld'
import { updateNamedSceneEntity, updateSceneEntity } from '../systems/SceneLoadingSystem'
import { CallbackComponent, setCallback } from './CallbackComponent'

export type LoadVolumeTarget = {
  uuid: string
  entityJson: EntityJson
  loaded: boolean
}

export type LoadVolumeComponentType = {
  targets: Map<string, LoadVolumeTarget>
}

export const LoadVolumeComponent = defineComponent({
  name: 'EE_load_volume',
  onAdd: (entity) => {
    const state = hookstate(
      {
        targets: new Map()
      } as LoadVolumeComponentType,
      subscribable()
    )
    return state as typeof state & StateMethodsDestroy
  },
  toJSON: (entity, component) => {
    const loadVol = component.value
    return { ...loadVol }
  },
  onUpdate: (entity, component, json) => {
    const world = Engine.instance.currentWorld
    const uuidMap = world.entityTree.uuidNodeMap
    const nodeMap = world.entityTree.entityNodeMap

    if (json.targets instanceof Map<string, LoadVolumeTarget>) {
      component.targets.set(json.targets)
    }

    function doLoad() {
      ;[...component.targets.value.values()].map(({ uuid, loaded, entityJson }) => {
        if (loaded) return
        updateSceneEntity(entityJson.name, entityJson)
        component.targets.merge((_targets) => {
          _targets.set(uuid, { ..._targets.get(uuid)!, loaded: true })
          return _targets
        })
      })
    }

    function doUnload() {
      const nuTargets = [...component.targets.value.values()].map(({ uuid, loaded, entityJson: oldEJson }) => {
        if (!loaded) return { uuid, loaded, componentJson: oldEJson }
        let targetEntity: Entity
        let clearChildren = () => removeEntity(targetEntity)

        const targetNode = uuidMap.get(uuid)!
        const parentNode = nodeMap.get(targetNode.parentEntity!)!
        targetEntity = targetNode.entity
        clearChildren = () =>
          iterateEntityNode(targetNode, (node) => {
            node.children.filter((entity) => !nodeMap.has(entity)).map((entity) => removeEntity(entity))
            removeEntityNodeFromParent(node)
            removeEntity(node.entity)
          })
        const componentJson = serializeEntity(targetEntity)
        clearChildren()
        const entityJson: EntityJson = { name: uuid, parent: parentNode.uuid, components: componentJson }
        return { uuid, loaded: false, entityJson }
      })
      component.targets.set(new Map(nuTargets.map((target) => [target.uuid, target] as [string, LoadVolumeTarget])))
    }

    if (hasComponent(entity, CallbackComponent)) {
      removeComponent(entity, CallbackComponent)
    }

    setCallback(entity, 'doLoad', doLoad)
    setCallback(entity, 'doUnload', doUnload)
  }
})

export const SCENE_COMPONENT_LOAD_VOLUME = 'load-volume'
