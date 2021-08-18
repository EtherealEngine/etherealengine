/** Functions to provide engine level functionalities. */

import { Color } from 'three'
import PhysX from 'three-physx'
import { PersistTagComponent } from '../../scene/components/PersistTagComponent'
import { Engine } from '../classes/Engine'
import { World } from '../classes/World'
import { hasComponent, removeAllComponents, removeEntity } from './EntityFunctions'

/** Reset the engine and remove everything from memory. */
export async function reset(): Promise<void> {}
/*
  console.log('RESETTING ENGINE')
  // Stop all running workers
  Engine.workers.forEach((w) => w.terminate())
  Engine.workers.length = 0

  disposeDracoLoaderWorkers()

  // clear all entities components
  await new Promise<void>((resolve) => {
    World.defaultWorld.entities.forEach((entity) => {
      removeAllComponents(entity, false)
    })
    setTimeout(() => {
      executeSystemBeforeReset() // for systems to handle components deletion
      resolve()
    }, 500)
  })

  await new Promise<void>((resolve) => {
    // delete all entities
    removeAllEntities()
    setTimeout(() => {
      executeSystemBeforeReset() // for systems to handle components deletion
      resolve()
    }, 500)
  })

  if (World.defaultWorld.entities.length) {
    console.log('World.defaultWorld.entities.length', World.defaultWorld.entities.length)
    throw new Error('World.defaultWorld.entities cleanup not complete')
  }

  Engine.tick = 0

  World.defaultWorld.entities.length = 0
  World.defaultWorld.entitiesToRemove.length = 0
  World.defaultWorld.entitiesWithComponentsToRemove.length = 0
  Engine.nextEntityId = 0

  // cleanup/unregister components
  Engine.components.length = 0
  // Engine.componentsMap = {}
  // Engine.numComponents = {}
  // Engine.componentPool = {}
  Engine.nextComponentId = 0

  // cleanup systems
  Engine.systems.forEach((system) => {
    system.dispose()
  })
  Engine.systems.length = 0
  Engine.activeSystems.clear()

  // cleanup queries
  Engine.queries.length = 0

  // cleanup events
  Engine.eventDispatcher.reset()

  // delete all what is left on scene
  if (Engine.scene) {
    disposeScene(Engine.scene)
    Engine.scene = null
  }
  Engine.sceneLoaded = false
  WorldScene.isLoading = false

  Engine.camera = null

  if (Engine.renderer) {
    Engine.renderer.clear(true, true, true)
    Engine.renderer.dispose()
    Engine.renderer = null
  }

  Network.instance.dispose()

  Vault.instance.clear()
  AssetLoader.Cache.clear()

  // Engine.enabled = false;
  Engine.inputState.clear()
  Engine.prevInputState.clear()
}*/

export const executeSystemBeforeReset = (world: World) => {
  Object.values(world.pipelines).forEach((pipeline) => {
    pipeline(world.ecsWorld)
  })
}

export const processLocationChange = async (): Promise<void> => {
  const entitiesToRemove = []
  const removedEntities = []
  const sceneObjectsToRemove = []

  World.defaultWorld.entities.forEach((entity) => {
    if (!hasComponent(entity, PersistTagComponent)) {
      removeAllComponents(entity)
      entitiesToRemove.push(entity)
      removedEntities.push(entity)
    }
  })

  executeSystemBeforeReset(World.defaultWorld)

  Engine.scene.background = new Color('black')
  Engine.scene.environment = null

  Engine.scene.traverse((o: any) => {
    if (!o.entity) return
    if (!removedEntities.includes(o.entity)) return

    sceneObjectsToRemove.push(o)
  })

  sceneObjectsToRemove.forEach((o) => Engine.scene.remove(o))

  entitiesToRemove.forEach((entity) => {
    removeEntity(entity)
  })

  executeSystemBeforeReset(World.defaultWorld)

  await resetPhysics()
}

export const resetPhysics = async (): Promise<void> => {
  Engine.physxWorker.terminate()
  Engine.workers.splice(Engine.workers.indexOf(Engine.physxWorker), 1)
  PhysX.PhysXInstance.instance.dispose()
  PhysX.PhysXInstance.instance = new PhysX.PhysXInstance()
  await PhysX.PhysXInstance.instance.initPhysX(
    Engine.initOptions.physics.physxWorker(),
    Engine.initOptions.physics.settings
  )
}
