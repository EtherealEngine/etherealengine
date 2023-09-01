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

import matches, { Validator } from 'ts-matches'

import { GraphJSON } from '@behave-graph/core'
import { config } from '@etherealengine/common/src/config'

import { NO_PROXY, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { uniqueId } from 'lodash'
import { useEffect } from 'react'
import { cleanStorageProviderURLs, parseStorageProviderURLs } from '../../common/functions/parseSceneJSON'
import { defineComponent, useComponent } from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { fetchBehaviorGraphJson, useGraphRunner } from '../functions/useGraphRunner'
import DefaultGraph from '../graph/default.graph.json'
import { BehaveGraphState } from '../state/BehaveGraphState'

export enum BehaveGraphDomain {
  'ECS' = 'ECS'
}

export const BehaveGraphComponent = defineComponent({
  name: 'EE_behaveGraph',

  jsonID: 'BehaveGraph',

  onInit: (entity) => {
    const domain = BehaveGraphDomain.ECS
    const graph = parseStorageProviderURLs(DefaultGraph) as unknown as GraphJSON
    const filepath = `${config.client.fileServer}/projects/assets/graphs/${uniqueId('new_graph')}.graph.json` // "${project_dir}/assets/graphs/randomUUID"
    return {
      filepath: filepath,
      domain: domain,
      graph: graph,
      run: false,
      disabled: false
    }
  },

  toJSON: (entity, component) => {
    // save the graph json into file and not in scene
    return {
      filepath: component.filepath.value,
      domain: component.domain.value,
      graph: cleanStorageProviderURLs(JSON.parse(JSON.stringify(component.graph.get(NO_PROXY)))), // this goes away
      run: false,
      disabled: component.disabled.value
    }
  },

  onSet: (entity, component, json) => {
    // if filepath exists and is valid, use that to load the graph json
    if (!json) return
    if (typeof json.filepath === 'string' && json.filepath.endsWith('graph.json')) component.filepath.set(json.filepath)
    if (typeof json.disabled === 'boolean') component.disabled.set(json.disabled)
    if (typeof json.run === 'boolean') component.run.set(json.run)
    const domainValidator = matches.string as Validator<unknown, BehaveGraphDomain>
    if (domainValidator.test(json.domain)) {
      component.domain.value !== json.domain && component.domain.set(json.domain!)
    }
    /*
    const graphValidator = matches.object as Validator<unknown, GraphJSON>
    if (graphValidator.test(json.graph)) {
      component.graph.set(parseStorageProviderURLs(json.graph)!) // load from file instead
    }*/
  },

  // we make reactor for each component handle the engine
  reactor: () => {
    const entity = useEntityContext()
    const graphComponent = useComponent(entity, BehaveGraphComponent)
    const behaveGraphState = useHookstate(getMutableState(BehaveGraphState))

    const canPlay = graphComponent.run && !graphComponent.disabled
    const registry = behaveGraphState.registries[graphComponent.domain.value].get(NO_PROXY)
    const graphRunner = useGraphRunner({ graphJson: graphComponent.graph.get(NO_PROXY), autoRun: canPlay, registry })
    useEffect(() => {
      // create the path and save the graph there
      ;(async () => {})()
    }, [])
    useEffect(() => {
      if (graphComponent.filepath.value.split('.').slice(-2, -1)[0] !== 'graph')
        return // dont set if json not of type graph
      ;(async () => {
        const graphJson = await fetchBehaviorGraphJson(graphComponent.filepath.value)
        graphComponent.graph.set(graphJson)
      })()
    }, [graphComponent.filepath])

    useEffect(() => {
      if (graphComponent.disabled.value) return
      graphComponent.run.value ? graphRunner.play() : graphRunner.pause()
    }, [graphComponent.run])

    useEffect(() => {
      if (!graphComponent.disabled.value) return
      graphComponent.run.set(false)
    }, [graphComponent.disabled])

    return null
  }
})
