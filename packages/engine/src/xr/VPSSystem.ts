import { createActionQueue, removeActionQueue } from '@xrengine/hyperflux'

import { World } from '../ecs/classes/World'
import { defineQuery, getComponent, getComponentState, removeQuery } from '../ecs/functions/ComponentFunctions'
import { LocalTransformComponent } from '../transform/components/TransformComponent'
import {
  PersistentAnchorActions,
  PersistentAnchorComponent,
  SCENE_COMPONENT_PERSISTENT_ANCHOR,
  SCENE_COMPONENT_SKY_ANCHOR,
  SkyAnchorComponent
} from './XRAnchorComponents'

export async function VPSSystem(world: World) {
  world.sceneComponentRegistry.set(PersistentAnchorComponent.name, SCENE_COMPONENT_PERSISTENT_ANCHOR)
  world.sceneLoadingRegistry.set(SCENE_COMPONENT_PERSISTENT_ANCHOR, {
    defaultData: {}
  })

  world.sceneComponentRegistry.set(SkyAnchorComponent.name, SCENE_COMPONENT_SKY_ANCHOR)
  world.sceneLoadingRegistry.set(SCENE_COMPONENT_SKY_ANCHOR, {
    defaultData: {}
  })

  const vpsAnchorQuery = defineQuery([PersistentAnchorComponent])
  const vpsAnchorFoundQueue = createActionQueue(PersistentAnchorActions.anchorFound.matches)
  const vpsAnchorUpdatedQueue = createActionQueue(PersistentAnchorActions.anchorUpdated.matches)
  const vpsAnchorLostQueue = createActionQueue(PersistentAnchorActions.anchorLost.matches)

  const execute = () => {
    const anchors = vpsAnchorQuery()

    for (const action of vpsAnchorFoundQueue()) {
      for (const entity of anchors) {
        const anchor = getComponentState(entity, PersistentAnchorComponent)
        if (anchor.name.value === action.name) {
          anchor.active.set(true)
          const localTransform = getComponent(entity, LocalTransformComponent)
          localTransform.position.copy(action.position)
          localTransform.rotation.copy(action.rotation)
        }
      }
    }

    for (const action of vpsAnchorUpdatedQueue()) {
      for (const entity of anchors) {
        const anchor = getComponentState(entity, PersistentAnchorComponent)
        if (anchor.name.value === action.name) {
          const localTransform = getComponent(entity, LocalTransformComponent)
          localTransform.position.copy(action.position)
          localTransform.rotation.copy(action.rotation)
        }
      }
    }

    for (const action of vpsAnchorLostQueue()) {
      for (const entity of anchors) {
        const anchor = getComponentState(entity, PersistentAnchorComponent)
        if (anchor.name.value === action.name) anchor.active.set(false)
      }
    }
  }

  const cleanup = async () => {
    world.sceneComponentRegistry.delete(PersistentAnchorComponent.name)
    world.sceneLoadingRegistry.delete(SCENE_COMPONENT_PERSISTENT_ANCHOR)
    world.sceneComponentRegistry.delete(SkyAnchorComponent.name)
    world.sceneLoadingRegistry.delete(SCENE_COMPONENT_SKY_ANCHOR)
    removeActionQueue(vpsAnchorFoundQueue)
    removeActionQueue(vpsAnchorUpdatedQueue)
    removeActionQueue(vpsAnchorLostQueue)
    removeQuery(world, vpsAnchorQuery)
  }

  return { execute, cleanup, subsystems: [] }
}
