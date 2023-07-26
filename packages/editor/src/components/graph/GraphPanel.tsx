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

import { useHookstate } from '@hookstate/core'
import React, { useEffect } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'

import { BehaveGraphComponent } from '@etherealengine/engine/src/behave-graph/components/BehaveGraphComponent'
import { getMutableComponent, hasComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { getMutableState } from '@etherealengine/hyperflux'

import { SelectionState } from '../../services/SelectionServices'
import hierarchyStyles from '../hierarchy/styles.module.scss'
import { Flow } from './ee-flow'

import { useForceUpdate } from '@etherealengine/common/src/utils/useForceUpdate'
import { UndefinedEntity } from '@etherealengine/engine/src/ecs/classes/Entity'
import 'reactflow/dist/style.css'
import './ee-flow/styles.css'

export const GraphPanel = () => {
  const selectionState = useHookstate(getMutableState(SelectionState))
  const entities = selectionState.selectedEntities.value
  const entity = entities[entities.length - 1]
  const validEntity = typeof entity === 'number' && hasComponent(entity, BehaveGraphComponent)
  const graphState = getMutableComponent(validEntity ? entity : UndefinedEntity, BehaveGraphComponent)
  const forceUpdate = useForceUpdate()

  // force react to re-render upon any object changing
  useEffect(() => {
    forceUpdate()
  }, [selectionState.objectChangeCounter])

  return (
    <>
      <div className={hierarchyStyles.panelContainer}>
        <div className={hierarchyStyles.panelSection}>
          <AutoSizer>
            {({ width, height }) => (
              <div style={{ width, height }}>
                {validEntity && (
                  <Flow
                    initialGraph={graphState?.value?.graph ?? {}}
                    examples={{}}
                    onChangeGraph={(newGraph) => {
                      if (!graphState.graph) return
                      graphState.graph.set(newGraph)
                    }}
                  />
                )}
              </div>
            )}
          </AutoSizer>
        </div>
      </div>
    </>
  )
}
export default GraphPanel
