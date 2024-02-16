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

import { useCallback, useEffect, useState } from 'react'
import { useEdgesState, useNodesState } from 'reactflow'

import { GraphJSON } from '@behave-graph/core'

import { behaveToFlow } from '../transformers/behaveToFlow'
import { flowToBehave } from '../transformers/flowToBehave'
import { autoLayout } from '../util/autoLayout'
import { hasPositionMetaData } from '../util/hasPositionMetaData'
import { useCustomNodeTypes } from './useCustomNodeTypes'
import { NodeSpecGenerator } from './useNodeSpecGenerator'

/**
 * Hook that returns the nodes and edges for react-flow, and the graphJson for the behave-graph.
 * If nodes or edges are changes, the graph json is updated automatically.
 * The graph json can be set manually, in which case the nodes and edges are updated to match the graph json.
 * @param param0
 * @returns
 */
export const useBehaveGraphFlow = ({
  initialGraphJson,
  specGenerator
}: {
  initialGraphJson: GraphJSON
  specGenerator: NodeSpecGenerator | undefined
}) => {
  const [graphJson, setStoredGraphJson] = useState<GraphJSON | undefined>()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const setGraphJson = useCallback(
    (graphJson: GraphJSON) => {
      if (!graphJson) return

      const [nodes, edges] = behaveToFlow(graphJson)

      if (hasPositionMetaData(graphJson) === false) {
        autoLayout(nodes, edges)
      }

      setNodes(nodes)
      setEdges(edges)
      setStoredGraphJson(graphJson)
    },
    [setEdges, setNodes]
  )

  useEffect(() => {
    if (!initialGraphJson) return
    setGraphJson(initialGraphJson)
  }, [initialGraphJson, setGraphJson])

  useEffect(() => {
    if (!specGenerator) return
    // when nodes and edges are updated, update the graph json with the flow to behave behavior
    const graphJson = flowToBehave(nodes, edges, specGenerator)
    setStoredGraphJson(graphJson)
  }, [nodes, edges, specGenerator])

  const nodeTypes = useCustomNodeTypes({
    specGenerator
  })

  return {
    nodes,
    edges,
    onEdgesChange,
    onNodesChange,
    setGraphJson,
    graphJson,
    nodeTypes
  }
}
