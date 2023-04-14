import React, { Suspense } from 'react'

import { OpaqueType } from '@etherealengine/common/src/interfaces/OpaqueType'
import multiLogger from '@etherealengine/common/src/logger'
import { getMutableState, ReactorProps, ReactorRoot } from '@etherealengine/hyperflux'

import { nowMilliseconds } from '../../common/functions/nowMilliseconds'
import { IncomingActionSystem } from '../../networking/systems/IncomingActionSystem'
import { OutgoingActionSystem } from '../../networking/systems/OutgoingActionSystem'
import { TransformSystem } from '../../transform/systems/TransformSystem'
import { Engine } from '../classes/Engine'
import { EngineState } from '../classes/EngineState'
import { Entity } from '../classes/Entity'
import { defineQuery, EntityRemovedComponent, QueryComponents, useQuery } from './ComponentFunctions'
import { EntityReactorProps, removeEntity } from './EntityFunctions'
import { executeFixedPipeline } from './FixedPipelineSystem'

const logger = multiLogger.child({ component: 'engine:ecs:SystemFunctions' })

export type SystemUUID = OpaqueType<'SystemUUID'> & string
export interface System {
  uuid: SystemUUID | string
  execute: () => void // runs after preSystems, and before subSystems
  reactor: React.FC<ReactorProps> | null
  preSystems: SystemUUID[]
  subSystems: SystemUUID[]
  postSystems: SystemUUID[]
  enabled: boolean
}

export const SystemDefintions = new Map<SystemUUID, System>()

const wrapExecute = (system: System) => {
  let lastWarningTime = 0
  const warningCooldownDuration = 1000 * 10 // 10 seconds

  return () => {
    for (const preSystem of system.preSystems) {
      const preSystemInstance = SystemDefintions.get(preSystem)
      if (preSystemInstance) {
        preSystemInstance.execute()
      }
    }
    const startTime = nowMilliseconds()
    try {
      system.execute()
    } catch (e) {
      logger.error(`Failed to execute system ${system.uuid}`)
      logger.error(e)
    }
    const endTime = nowMilliseconds()
    const systemDuration = endTime - startTime
    if (systemDuration > 50 && lastWarningTime < endTime - warningCooldownDuration) {
      lastWarningTime = endTime
      logger.warn(`Long system execution detected. System: ${system.uuid} \n Duration: ${systemDuration}`)
    }
    for (const subSystem of system.subSystems) {
      const subSystemInstance = SystemDefintions.get(subSystem)
      if (subSystemInstance) {
        subSystemInstance.execute()
      }
    }
    for (const postSystem of system.postSystems) {
      const postSystemInstance = SystemDefintions.get(postSystem)
      if (postSystemInstance) {
        postSystemInstance.execute()
      }
    }
  }
}

export function defineSystem(systemConfig: Partial<System> & { uuid: string }) {
  if (SystemDefintions.has(systemConfig.uuid as SystemUUID)) {
    throw new Error(`System ${systemConfig.uuid} already exists.`)
  }

  const system = {
    uuid: systemConfig.uuid as SystemUUID,
    reactor: systemConfig.reactor ?? null,
    enabled: false,
    preSystems: systemConfig.preSystems ?? [],
    execute: systemConfig.execute ?? (() => {}),
    subSystems: systemConfig.subSystems ?? [],
    postSystems: systemConfig.postSystems ?? []
  } as Required<System>

  if (systemConfig.execute) system.execute = wrapExecute(system)

  SystemDefintions.set(systemConfig.uuid as SystemUUID, system)

  return systemConfig.uuid as SystemUUID
}

export function insertSystem(
  systemUUID,
  insert: {
    before?: SystemUUID
    with?: SystemUUID
    after?: SystemUUID
  }
) {
  const referenceSystem = SystemDefintions.get(systemUUID)
  if (!referenceSystem) throw new Error(`System ${systemUUID} does not exist.`)

  if (insert.before) {
    const referenceSystem = SystemDefintions.get(insert.before)
    if (!referenceSystem)
      throw new Error(
        `System ${insert.before} does not exist. You may have a circular dependency in your system definitions.`
      )
    referenceSystem.preSystems.push(systemUUID)
    referenceSystem.enabled = true
  }

  if (insert.with) {
    const referenceSystem = SystemDefintions.get(insert.with)
    if (!referenceSystem)
      throw new Error(
        `System ${insert.with} does not exist. You may have a circular dependency in your system definitions.`
      )
    referenceSystem.subSystems.push(systemUUID)
    referenceSystem.enabled = true
  }

  if (insert.after) {
    const referenceSystem = SystemDefintions.get(insert.after)
    if (!referenceSystem)
      throw new Error(
        `System ${insert.after} does not exist. You may have a circular dependency in your system definitions.`
      )
    referenceSystem.postSystems.push(systemUUID)
    referenceSystem.enabled = true
  }
}

export const insertSystems = (
  systems: SystemUUID[],
  insert: {
    before?: SystemUUID
    with?: SystemUUID
    after?: SystemUUID
  }
) => {
  for (const system of systems) {
    insertSystem(system, insert)
  }
}

export const enableSystems = (systemUUIDs: SystemUUID[]) => {
  for (const systemUUID of systemUUIDs) {
    const system = SystemDefintions.get(systemUUID)
    if (system) {
      system.enabled = true
    }
  }
}

export const disableSystems = (systemUUIDs: SystemUUID[]) => {
  for (const systemUUID of systemUUIDs) {
    const system = SystemDefintions.get(systemUUID)
    if (system) {
      system.enabled = false
    }
  }
}

export const unloadAllSystems = () => {}

export const unloadSystems = (uuids: string[]) => {
  // const systemsToUnload = uuids.map((uuid) => Engine.instance.systemsByUUID[uuid])
  // const promises = [] as Promise<void>[]
  // for (const system of systemsToUnload) {
  //   const pipeline = Engine.instance.pipelines[system.type]
  //   const i = pipeline.indexOf(system)
  //   pipeline.splice(i, 1)
  //   delete Engine.instance.systemsByUUID[system.uuid]
  //   promises.push(system.cleanup())
  // }
  // return promises
}

export const unloadSystem = (uuid: string) => {
  // const systemToUnload = Engine.instance.systemsByUUID[uuid]
  // const pipeline = Engine.instance.pipelines[systemToUnload.type]
  // const i = pipeline.indexOf(systemToUnload)
  // pipeline.splice(i, 1)
  // delete Engine.instance.systemsByUUID[systemToUnload.uuid]
  // return systemToUnload.cleanup()
}

// todo, move to client only somehow maybe??

export const InputSystemGroup = defineSystem({
  uuid: 'ee.engine.input-group'
})

/** Run inside of fixed pipeline */
export const SimulationSystemGroup = defineSystem({
  uuid: 'ee.engine.simulation-group',
  preSystems: [IncomingActionSystem],
  postSystems: [OutgoingActionSystem]
})

export const AnimationSystemGroup = defineSystem({
  uuid: 'ee.engine.animation-group'
})

export const PresentationSystemGroup = defineSystem({
  uuid: 'ee.engine.presentation-group'
})

/**
 * 1. input group
 * 2. fixed pipeline (simulation group)
 * 3. animation group
 * 4. transform system
 * 5. presentation group
 */
export const RootSystemGroup = defineSystem({
  uuid: 'ee.engine.root-group',
  preSystems: [InputSystemGroup],
  execute: executeFixedPipeline,
  subSystems: [AnimationSystemGroup, TransformSystem],
  postSystems: [PresentationSystemGroup]
})

const TimerConfig = {
  MAX_DELTA_SECONDS: 1 / 10
}

const entityRemovedQuery = defineQuery([EntityRemovedComponent])

/**
 * Execute systems on this world
 *
 * @param frameTime the current frame time in milliseconds (DOMHighResTimeStamp) relative to performance.timeOrigin
 */
export const executeSystems = (frameTime: number) => {
  const engineState = getMutableState(EngineState)
  engineState.frameTime.set(frameTime)

  const start = nowMilliseconds()
  const incomingActions = [...Engine.instance.store.actions.incoming]

  const worldElapsedSeconds = (frameTime - Engine.instance.startTime) / 1000
  engineState.deltaSeconds.set(
    Math.max(0.001, Math.min(TimerConfig.MAX_DELTA_SECONDS, worldElapsedSeconds - Engine.instance.elapsedSeconds))
  )
  engineState.elapsedSeconds.set(worldElapsedSeconds)

  const rootSystem = SystemDefintions.get(RootSystemGroup)!
  rootSystem.execute()

  for (const entity of entityRemovedQuery()) removeEntity(entity as Entity, true)

  for (const { query, result } of Engine.instance.reactiveQueryStates) {
    const entitiesAdded = query.enter().length
    const entitiesRemoved = query.exit().length
    if (entitiesAdded || entitiesRemoved) {
      result.set(query())
    }
  }

  const end = nowMilliseconds()
  const duration = end - start
  if (duration > 150) {
    logger.warn(`Long frame execution detected. Duration: ${duration}. \n Incoming actions: %o`, incomingActions)
  }
}

function QueryReactor(props: {
  root: ReactorRoot
  query: QueryComponents
  ChildEntityReactor: React.FC<EntityReactorProps>
}) {
  const entities = useQuery(props.query)
  return (
    <>
      {entities.map((entity) => (
        <QueryReactorErrorBoundary key={entity}>
          <Suspense fallback={null}>
            <props.ChildEntityReactor root={{ ...props.root, entity }} />
          </Suspense>
        </QueryReactorErrorBoundary>
      ))}
    </>
  )
}

export const createQueryReactor = (Components: QueryComponents, ChildEntityReactor: React.FC<EntityReactorProps>) => {
  if (!ChildEntityReactor.name) Object.defineProperty(ChildEntityReactor, 'name', { value: 'ChildEntityReactor' })
  return function HyperfluxQueryReactor({ root }: ReactorProps) {
    return <QueryReactor query={Components} ChildEntityReactor={ChildEntityReactor} root={root} />
  }
}

interface ErrorState {
  error: Error | null
}

class QueryReactorErrorBoundary extends React.Component<any, ErrorState> {
  public state: ErrorState = {
    error: null
  }

  public static getDerivedStateFromError(error: Error): ErrorState {
    // Update state so the next render will show the fallback UI.
    return { error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    return this.state.error ? null : this.props.children
  }
}

/** System template

const MySystemState = defineState({
  name: 'MySystemState',
  initial: () => {
    return {
    }
  }
})

const execute = () => {
  
}

const reactor = () => {
  useEffect(() => {
    return () => {

    }
  }, [])
  return null
}

export const MySystem = defineSystem({
  uuid: 'ee.engine.MySystem',
  execute,
  reactor
})

*/
