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

import { BehaveGraphComponent } from '@etherealengine/engine/src/behave-graph/components/BehaveGraphComponent'
import { BehaveGraphState } from '@etherealengine/engine/src/behave-graph/state/BehaveGraphState'
import { getComponent, hasComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useQuery } from '@etherealengine/engine/src/ecs/functions/QueryFunctions'
import { getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'
import { isEqual } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import 'reactflow/dist/style.css'
import { EditorControlFunctions } from '../../functions/EditorControlFunctions'
import { SelectionState } from '../../services/SelectionServices'
import { PropertiesPanelButton } from '../inputs/Button'
import { commitProperty } from '../properties/Util'
import { Flow } from './ee-flow'
import './ee-flow/styles.css'

export const ActiveBehaveGraph = (props: { entity }) => {
  const { entity } = props

  // reactivity
  const behaveGraphState = getState(BehaveGraphState)

  // get underlying data, avoid hookstate error 202
  const graphComponent = getComponent(entity, BehaveGraphComponent)

  return (
    <Flow
      initialGraph={graphComponent.graph}
      examples={{}}
      registry={behaveGraphState.registries[graphComponent.domain]}
      onChangeGraph={
        (newGraph) => {
          if (!newGraph) return
          if (isEqual(graphComponent.graph, newGraph)) return
          commitProperty(BehaveGraphComponent, 'graph')(newGraph)
        }
        // need this to smoothen UX
      }
    />
  )
}

const BehaveFlow = () => {
  const entities = useHookstate(getMutableState(SelectionState).selectedEntities).value
  const entity = entities[entities.length - 1]
  const validEntity = typeof entity === 'number' && hasComponent(entity, BehaveGraphComponent)
  const { t } = useTranslation()

  const addGraph = () => EditorControlFunctions.addOrRemoveComponent([entity], BehaveGraphComponent, true)

  // ensure reactivity of adding new graph
  useQuery([BehaveGraphComponent])

  return (
    <AutoSizer>
      {({ width, height }) => (
        <div style={{ width, height }}>
          {entities.length && !validEntity && (
            <PropertiesPanelButton
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => {
                addGraph()
              }}
            >
              {t('editor:graphPanel.addGraph')}
            </PropertiesPanelButton>
          )}
          {validEntity && <ActiveBehaveGraph entity={entity} />}
        </div>
      )}
    </AutoSizer>
  )
}

export default BehaveFlow
