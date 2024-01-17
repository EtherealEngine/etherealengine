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

// Generates node specs based on provided configuration,
// and caches the results.

import {
  IRegistry,
  NodeConfigurationJSON,
  NodeSpecJSON,
  writeDefaultNodeSpecsToJSON,
  writeNodeSpecToJSON
} from '@behave-graph/core'
import { BehaveGraphComponent } from '@etherealengine/engine/src/behave-graph/components/BehaveGraphComponent'
import {
  EngineVariableGet,
  EngineVariableSet
} from '@etherealengine/engine/src/behave-graph/nodes/Profiles/Engine/Values/VariableNodes'
import { getComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useEffect, useState } from 'react'
import { SelectionState } from '../../../../services/SelectionServices'

export class NodeSpecGenerator {
  private specsWithoutConfig?: NodeSpecJSON[]
  private specsCache: { [cacheKey: string]: NodeSpecJSON } = {}

  constructor(private registry: IRegistry) {}

  getNodeTypes(): string[] {
    return Object.keys(this.registry.nodes)
  }

  getNodeSpec(nodeTypeName: string, configuration: NodeConfigurationJSON): NodeSpecJSON {
    const entity = SelectionState.getSelectedEntity()
    const graphComponent = getComponent(entity, BehaveGraphComponent)

    const generateCacheKey = () => {
      let cacheKey = nodeTypeName + '\x01' + JSON.stringify(configuration)
      if (nodeTypeName === EngineVariableSet.typeName || nodeTypeName === EngineVariableGet.typeName) {
        const variable = graphComponent.graph.variables?.find(
          (variable) => variable.name === configuration.variableName
        )
        if (variable === undefined) return cacheKey
        cacheKey = nodeTypeName + '\x01' + JSON.stringify(configuration) + '\x01' + variable.valueTypeName
      }
      return cacheKey
    }

    const cacheKey = generateCacheKey()
    if (!this.specsCache[cacheKey]) {
      const variableNodeAdjustSpec = () => {
        if (nodeTypeName !== EngineVariableSet.typeName && nodeTypeName !== EngineVariableGet.typeName) return
        const variable = graphComponent.graph.variables?.find(
          (variable) => variable.name === configuration.variableName
        )
        if (variable === undefined) return
        let sockets = specJson.inputs
        switch (nodeTypeName) {
          case EngineVariableSet.typeName: {
            sockets = specJson.inputs
            break
          }
          case EngineVariableGet.typeName: {
            sockets = specJson.outputs
            break
          }
        }
        let valueSocket = sockets.find((socket) => socket.name === 'value')
        valueSocket = {
          ...valueSocket!,
          valueType: variable!.valueTypeName!
        }
        sockets = sockets.filter((socket) => socket.name !== 'value')
        sockets = [...sockets, valueSocket]
        switch (nodeTypeName) {
          case EngineVariableSet.typeName: {
            specJson.inputs = sockets
            break
          }
          case EngineVariableGet.typeName: {
            specJson.outputs = sockets
            break
          }
        }
        return
      }
      const specJson = writeNodeSpecToJSON(this.registry, nodeTypeName, configuration)
      variableNodeAdjustSpec()
      this.specsCache[cacheKey] = specJson
    }

    return this.specsCache[cacheKey]
  }

  getAllNodeSpecs(): NodeSpecJSON[] {
    if (!this.specsWithoutConfig) {
      this.specsWithoutConfig = writeDefaultNodeSpecsToJSON(this.registry)
    }

    return this.specsWithoutConfig
  }
}

export const useNodeSpecGenerator = (registry: IRegistry) => {
  const [specGenerator, setSpecGenerator] = useState<NodeSpecGenerator>()

  useEffect(() => {
    setSpecGenerator(new NodeSpecGenerator(registry))
  }, [registry.nodes, registry.values, registry.dependencies])

  return specGenerator
}
