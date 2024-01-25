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

import React, { PropsWithChildren, Suspense } from 'react'

import { LoadingCircle } from '@etherealengine/client-core/src/components/LoadingCircle'
import { hasComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { BehaveGraphComponent } from '@etherealengine/engine/src/behave-graph/components/BehaveGraphComponent'
import { getState } from '@etherealengine/hyperflux'
import { EditorControlFunctions } from '../../functions/EditorControlFunctions'
import { SelectionState } from '../../services/SelectionServices'
import { COMPONENT_PROPERTIES_TAB, useDockPanel } from '../EditorDockContainer'
import { generateComponentPanelTab } from '../element/ComponentTab'
import { GraphPanelTab } from '../graph/GraphPanel'
import PropertyGroup from './PropertyGroup'
import { EditorPropType } from './Util'

interface NodeErrorProps {
  name?: string
  children?: React.ReactNode
}

interface NodeErrorState {
  error: Error | null
}

class NodeEditorErrorBoundary extends React.Component<NodeErrorProps, NodeErrorState> {
  public state: NodeErrorState = {
    error: null
  }

  public static getDerivedStateFromError(error: Error): NodeErrorState {
    // Update state so the next render will show the fallback UI.
    return { error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.error) {
      return (
        <div style={{ margin: 10, color: '#ff0000', overflow: 'auto', backgroundColor: '#222222' }}>
          <h1 style={{ fontSize: '100%', fontWeight: 'normal' }}>
            <b>
              [{this.props.name}] {this.state.error.message}`
            </b>
          </h1>
          <pre>{this.state.error.stack}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

//declaring NodeEditorProps
type NodeEditorProps = EditorPropType & {
  description?: string
  name?: string
}

export const NodeEditor: React.FC<PropsWithChildren<NodeEditorProps>> = ({
  description,
  children,
  name,
  entity,
  component
}) => {
  const dockPanel = useDockPanel()
  return (
    <PropertyGroup
      name={name}
      description={description}
      openDetails={component && !!dockPanel?.find(component.name)}
      onClose={
        component && hasComponent(entity, component)
          ? () => {
              const nodes = getState(SelectionState).selectedEntities
              EditorControlFunctions.addOrRemoveComponent(nodes, component, false)
            }
          : undefined
      }
      onOpenInPanelClick={
        component && hasComponent(entity, component)
          ? () => {
              if (component.jsonID === BehaveGraphComponent.jsonID) {
                dockPanel?.dockMove(GraphPanelTab, COMPONENT_PROPERTIES_TAB, 'middle')
              } else {
                dockPanel?.dockMove(generateComponentPanelTab(component, entity), COMPONENT_PROPERTIES_TAB, 'middle')
              }
            }
          : undefined
      }
    >
      <Suspense fallback={<LoadingCircle message={`Loading ${name} Editor...`} />}>
        <NodeEditorErrorBoundary name={name}>{children}</NodeEditorErrorBoundary>
      </Suspense>
    </PropertyGroup>
  )
}

export default NodeEditor
