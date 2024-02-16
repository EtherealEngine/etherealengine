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

import { Engine, GraphJSON, GraphNodes, ILifecycleEventEmitter, IRegistry, readGraphFromJSON } from '@behave-graph/core'
import { useCallback, useEffect, useState } from 'react'

export const fetchBehaviorGraphJson = async (url: string) => (await (await fetch(url)).json()) as GraphJSON

/** Runs the behavior graph by building the execution
 * engine and triggering start on the lifecycle event emitter.
 */
export const useGraphRunner = ({
  graphJson,
  autoRun = false,
  registry
}: {
  graphJson: GraphJSON | undefined
  autoRun?: boolean
  registry: IRegistry
}) => {
  const [engine, setEngine] = useState<Engine>()
  const [run, setRun] = useState(autoRun)

  const play = useCallback(() => {
    setRun(true)
  }, [])

  const pause = useCallback(() => {
    setRun(false)
  }, [])

  const togglePlay = useCallback(() => {
    setRun((existing) => !existing)
  }, [])

  useEffect(() => {
    if (!graphJson || !registry.values || !run || !registry.dependencies) return
    let graphNodes: GraphNodes
    try {
      graphNodes = readGraphFromJSON({
        graphJson,
        registry
      }).nodes
    } catch (e) {
      console.error(e)
      return
    }
    const engine = new Engine(graphNodes)

    setEngine(engine)

    return () => {
      engine.dispose()
      setEngine(undefined)
    }
  }, [graphJson, registry.values, run, registry.nodes, registry.dependencies])

  useEffect(() => {
    if (!engine || !run) return

    engine.executeAllSync()

    let timeout: NodeJS.Timeout

    const eventEmitter = registry.dependencies?.ILifecycleEventEmitter as ILifecycleEventEmitter

    const onTick = async () => {
      eventEmitter.tickEvent.emit()

      // eslint-disable-next-line no-await-in-loop
      await engine.executeAllAsync(500)

      timeout = setTimeout(onTick, 50)
    }

    ;(async () => {
      if (eventEmitter.startEvent.listenerCount) {
        eventEmitter.startEvent.emit()

        await engine.executeAllAsync(5)
      } else {
        console.log('has no listener count')
      }
      onTick()
    })() // start up

    return () => {
      clearTimeout(timeout)
    }
  }, [engine, registry.dependencies?.ILifecycleEventEmitter, run])

  return {
    engine,
    playing: run,
    play,
    togglePlay,
    pause
  }
}
