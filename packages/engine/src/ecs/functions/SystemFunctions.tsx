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

/** Functions to provide system level functionalities. */

import React, { Component, ErrorInfo, FC, memo, Suspense, useLayoutEffect, useMemo } from 'react'

import { OpaqueType } from '@etherealengine/common/src/interfaces/OpaqueType'
import multiLogger from '@etherealengine/engine/src/common/functions/logger'
import { getState, startReactor } from '@etherealengine/hyperflux'

import { MathUtils } from 'three'
import { nowMilliseconds } from '../../common/functions/nowMilliseconds'
import { Engine } from '../classes/Engine'
import { EngineState } from '../classes/EngineState'
import { Entity } from '../classes/Entity'
import { QueryComponents, useQuery } from './ComponentFunctions'
import { EntityContext } from './EntityFunctions'

const logger = multiLogger.child({ component: 'engine:ecs:SystemFunctions' })

export type SystemUUID = OpaqueType<'SystemUUID'> & string

export type InsertSystem = {
  before?: SystemUUID
  with?: SystemUUID
  after?: SystemUUID
}

export interface SystemArgs {
  uuid: string
  insert: InsertSystem
  execute?: () => void
  reactor?: FC
}

export interface System {
  uuid: SystemUUID
  reactor?: FC
  insert?: InsertSystem
  preSystems: SystemUUID[]
  /** runs after preSystems, and before subSystems */
  execute: () => void
  subSystems: SystemUUID[]
  postSystems: SystemUUID[]
  sceneSystem?: boolean
}

export const SystemDefinitions = new Map<SystemUUID, System>()
globalThis.SystemDefinitions = SystemDefinitions

const lastWarningTime = new Map<SystemUUID, number>()
const warningCooldownDuration = 1000 * 10 // 10 seconds

export function executeSystem(systemUUID: SystemUUID) {
  const system = SystemDefinitions.get(systemUUID)!
  if (!system) {
    console.warn(`System ${systemUUID} does not exist.`)
    return
  }

  for (let i = 0; i < system.preSystems.length; i++) {
    executeSystem(system.preSystems[i])
  }

  if (system.reactor && !Engine.instance.activeSystemReactors.has(system.uuid)) {
    const reactor = startReactor(system.reactor)
    Engine.instance.activeSystemReactors.set(system.uuid, reactor)
  }

  if (getState(EngineState).systemPerformanceProfilingEnabled) {
    const startTime = nowMilliseconds()

    try {
      Engine.instance.currentSystemUUID = systemUUID
      system.execute()
    } catch (e) {
      logger.error(`Failed to execute system ${system.uuid}`)
      logger.error(e)
    } finally {
      Engine.instance.currentSystemUUID = '__null__' as SystemUUID
    }

    const endTime = nowMilliseconds()

    const systemDuration = endTime - startTime
    if (systemDuration > 50 && (lastWarningTime.get(systemUUID) ?? 0) < endTime - warningCooldownDuration) {
      lastWarningTime.set(systemUUID, endTime)
      logger.warn(`Long system execution detected. System: ${system.uuid} \n Duration: ${systemDuration}`)
    }
  } else {
    try {
      Engine.instance.currentSystemUUID = systemUUID
      system.execute()
    } catch (e) {
      logger.error(`Failed to execute system ${system.uuid}`)
      logger.error(e)
    } finally {
      Engine.instance.currentSystemUUID = '__null__' as SystemUUID
    }
  }

  for (let i = 0; i < system.subSystems.length; i++) {
    executeSystem(system.subSystems[i])
  }
  for (let i = 0; i < system.postSystems.length; i++) {
    executeSystem(system.postSystems[i])
  }
}

/**
 * Defines a system
 * @param systemConfig
 * @returns
 */
export function defineSystem(systemConfig: SystemArgs) {
  if (SystemDefinitions.has(systemConfig.uuid as SystemUUID)) {
    throw new Error(`System ${systemConfig.uuid} already exists.`)
  }

  console.log(`Registered system ${systemConfig.uuid}`)

  const system = {
    preSystems: [],
    execute: () => {},
    subSystems: [],
    postSystems: [],
    sceneSystem: false,
    ...systemConfig,
    uuid: systemConfig.uuid as SystemUUID,
    enabled: false
  } as Required<System>

  SystemDefinitions.set(system.uuid, system)

  const insert = system.insert

  if (insert?.before) {
    const referenceSystem = SystemDefinitions.get(insert.before)!
    referenceSystem.preSystems.push(system.uuid)
  }

  if (insert?.with) {
    const referenceSystem = SystemDefinitions.get(insert.with)!
    referenceSystem.subSystems.push(system.uuid)
  }

  if (insert?.after) {
    const referenceSystem = SystemDefinitions.get(insert.after)!
    referenceSystem.postSystems.push(system.uuid)
  }

  return systemConfig.uuid as SystemUUID
}

export const useExecute = (execute: () => void, insert: InsertSystem) => {
  useLayoutEffect(() => {
    const handle = defineSystem({ uuid: MathUtils.generateUUID(), execute, insert })
    return () => {
      destroySystem(handle)
    }
  }, [])
}

/**
 * Disables a system
 * @param systemUUID
 * @todo Should this be async?
 */
export const destroySystem = (systemUUID: SystemUUID) => {
  const system = SystemDefinitions.get(systemUUID)
  if (!system) throw new Error(`System ${systemUUID} does not exist.`)

  for (const subSystem of system.subSystems) {
    destroySystem(subSystem)
  }

  const reactor = Engine.instance.activeSystemReactors.get(system.uuid as SystemUUID)!
  if (reactor) {
    Engine.instance.activeSystemReactors.delete(system.uuid as SystemUUID)
    reactor.stop()
  }

  for (const postSystem of system.postSystems) {
    destroySystem(postSystem)
  }

  for (const preSystem of system.preSystems) {
    destroySystem(preSystem)
  }

  const insert = system.insert

  if (insert?.before) {
    const referenceSystem = SystemDefinitions.get(insert.before)!
    referenceSystem.preSystems.splice(referenceSystem.preSystems.indexOf(system.uuid), 1)
  }

  if (insert?.with) {
    const referenceSystem = SystemDefinitions.get(insert.with)!
    referenceSystem.subSystems.splice(referenceSystem.subSystems.indexOf(system.uuid), 1)
  }

  if (insert?.after) {
    const referenceSystem = SystemDefinitions.get(insert.after)!
    referenceSystem.postSystems.splice(referenceSystem.postSystems.indexOf(system.uuid), 1)
  }

  SystemDefinitions.delete(systemUUID)
}

const QuerySubReactor = memo((props: { entity: Entity; ChildEntityReactor: FC }) => {
  return (
    <>
      <QueryReactorErrorBoundary>
        <Suspense fallback={null}>
          <EntityContext.Provider value={props.entity}>
            <props.ChildEntityReactor />
          </EntityContext.Provider>
        </Suspense>
      </QueryReactorErrorBoundary>
    </>
  )
})

export const QueryReactor = memo((props: { Components: QueryComponents; ChildEntityReactor: FC }) => {
  const entities = useQuery(props.Components)
  const MemoChildEntityReactor = useMemo(() => memo(props.ChildEntityReactor), [props.ChildEntityReactor])
  return (
    <>
      {entities.map((entity) => (
        <QuerySubReactor key={entity} entity={entity} ChildEntityReactor={MemoChildEntityReactor} />
      ))}
    </>
  )
})

/**
 * @deprecated use QueryReactor directly
 */
export const createQueryReactor = (Components: QueryComponents, ChildEntityReactor: FC) => {
  return () => <QueryReactor Components={Components} ChildEntityReactor={ChildEntityReactor} />
}

interface ErrorState {
  error: Error | null
}

class QueryReactorErrorBoundary extends Component<any, ErrorState> {
  public state: ErrorState = {
    error: null
  }

  public static getDerivedStateFromError(error: Error): ErrorState {
    // Update state so the next render will show the fallback UI.
    return { error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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
