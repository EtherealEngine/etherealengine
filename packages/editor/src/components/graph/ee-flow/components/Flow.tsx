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

import React, { useEffect, useRef } from 'react'
import { Background, BackgroundVariant, ReactFlow, XYPosition, useReactFlow } from 'reactflow'

import { GraphJSON, IRegistry } from '@behave-graph/core'

import { useGraphRunner } from '@etherealengine/engine/src/behave-graph/functions/useGraphRunner.js'
import { UndefinedEntity } from '@etherealengine/engine/src/ecs/classes/Entity.js'
import { useHookstate } from '@hookstate/core'
import { Button } from '@mui/material'
import { v4 as uuidv4 } from 'uuid'
import PaginatedList from '../../../layout/PaginatedList.js'
import Panel from '../../../layout/Panel.js'
import NodeEditor from '../../../properties/NodeEditor.js'
import { useBehaveGraphFlow } from '../hooks/useBehaveGraphFlow.js'
import { useFlowHandlers } from '../hooks/useFlowHandlers.js'
import { useNodeSpecGenerator } from '../hooks/useNodeSpecGenerator.js'
import { useSelectionHandler } from '../hooks/useSelectionHandler.js'
import CustomControls from './Controls.js'
import { NodePicker } from './NodePicker.js'
import { Examples } from './modals/LoadModal.js'

type FlowProps = {
  initialGraph: GraphJSON
  examples: Examples
  registry: IRegistry
  onChangeGraph: (nuGraph: GraphJSON) => void
}

export const Flow: React.FC<FlowProps> = ({ initialGraph: graph, examples, registry, onChangeGraph }) => {
  const specGenerator = useNodeSpecGenerator(registry)

  const reactFlow = useReactFlow()
  const flowRef = useRef(null)
  const dragging = useHookstate(false)
  const mouseOver = useHookstate(false)

  const { nodes, edges, onNodesChange, onEdgesChange, graphJson, setGraphJson, nodeTypes } = useBehaveGraphFlow({
    initialGraphJson: graph,
    specGenerator
  })

  const {
    onConnect,
    handleStartConnect,
    handleStopConnect,
    handlePaneClick,
    handlePaneContextMenu,
    nodePickerVisibility,
    handleAddNode,
    lastConnectStart,
    closeNodePicker,
    nodePickFilters
  } = useFlowHandlers({
    nodes,
    onEdgesChange,
    onNodesChange,
    specGenerator
  })

  const { togglePlay, playing } = useGraphRunner({
    graphJson,
    registry
  })

  const { selectedNodes, onSelectionChange } = useSelectionHandler({
    nodes,
    onNodesChange,
    onEdgesChange
  })

  useEffect(() => {
    if (dragging.value || !mouseOver.value) return
    onChangeGraph(graphJson ?? graph)
  }, [graphJson]) // change in node position triggers reactor

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
      <div
        style={{
          width: '25%',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '150px',
          backgroundColor: 'var(--panelBackground)',
          padding: '10px'
        }}
      >
        <div style={{ flex: '35%' }}>
          <NodeEditor entity={UndefinedEntity} name={'Nodes'} description={'collecton of Nodes'}>
            <PaginatedList
              options={{ countPerPage: 10 }}
              list={Object.keys(registry.nodes)}
              element={(node: string, index) => {
                return (
                  <div>
                    <Button
                      style={{ width: '100%', textTransform: 'lowercase', padding: '0px' }}
                      onClick={() => {
                        //const avgX = nodes.reduce((acc, node) => acc + node.position.x, 0) / nodes.length
                        //const avgY = nodes.reduce((acc, node) => acc + node.position.y, 0) / nodes.length

                        const bounds = (flowRef.current! as any).getBoundingClientRect()
                        const centerX = bounds.left + bounds.width / 2
                        const centerY = bounds.top + bounds.height / 2
                        const viewportCenter = reactFlow.screenToFlowPosition({ x: centerX, y: centerY } as XYPosition)
                        const position: XYPosition = viewportCenter // need a way to get viewport
                        const newNode = {
                          id: uuidv4(),
                          type: node,
                          position,
                          data: { configuration: {}, values: {} } //fill with default values here
                        }
                        onNodesChange([
                          {
                            type: 'add',
                            item: newNode
                          }
                        ])
                      }}
                    >
                      <Panel title={node}></Panel>
                    </Button>
                  </div>
                )
              }}
            ></PaginatedList>
          </NodeEditor>
        </div>

        <div style={{ flex: '35%', overflow: 'scroll' }}>
          <NodeEditor entity={UndefinedEntity} name={'Templates'} description={'collecton of Templates'}></NodeEditor>
        </div>

        <div style={{ flex: '30%', overflow: 'scroll' }}>
          <NodeEditor entity={UndefinedEntity} name={'variables'} description={'collection of variables'}>
            <Button onClick={() => {}}>Add Variable</Button>
          </NodeEditor>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <ReactFlow
          ref={flowRef}
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodeDragStart={() => dragging.set(true)}
          onNodeDragStop={() => dragging.set(false)}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={handleStartConnect}
          onConnectEnd={handleStopConnect}
          onPaneMouseEnter={() => mouseOver.set(true)}
          onPaneMouseLeave={() => mouseOver.set(false)}
          fitView
          fitViewOptions={{ maxZoom: 1 }}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={handlePaneContextMenu}
          onSelectionChange={onSelectionChange}
          multiSelectionKeyCode={'Shift'}
          deleteKeyCode={'Backspace'}
        >
          <CustomControls
            playing={playing}
            togglePlay={togglePlay}
            onSaveGraph={onChangeGraph}
            setBehaviorGraph={setGraphJson}
            examples={examples}
            specGenerator={specGenerator}
          />
          <Background variant={BackgroundVariant.Lines} color="#2a2b2d" style={{ backgroundColor: '#1E1F22' }} />
          {nodePickerVisibility && (
            <NodePicker
              flowRef={flowRef}
              position={nodePickerVisibility}
              filters={nodePickFilters}
              onPickNode={handleAddNode}
              onClose={closeNodePicker}
              specJSON={specGenerator?.getAllNodeSpecs()}
            />
          )}
          {
            //selectedNodes.length !== 0 && ()
          }
        </ReactFlow>
      </div>
    </div>
  )
}
