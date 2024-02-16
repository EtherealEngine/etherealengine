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

import React, { useMemo, useRef, useState } from 'react'
import { useEdges, useNodes } from 'reactflow'

import { BehaveGraphComponent } from '@etherealengine/engine/src/behave-graph/components/BehaveGraphComponent'

import { Entity, useComponent } from '@etherealengine/ecs'
import { getMutableState } from '@etherealengine/hyperflux'
import { useHookstate } from '@hookstate/core'
import { SelectionState } from '../../../../../services/SelectionServices'
import { uploadGraphFilefromJson } from '../../../../properties/BehaveGraphNodeEditor'
import { NodeSpecGenerator } from '../../hooks/useNodeSpecGenerator'
import { flowToBehave } from '../../transformers/flowToBehave'
import { Modal } from './Modal'

export type SaveModalProps = {
  open?: boolean
  onClose: () => void
  specGenerator: NodeSpecGenerator
}

export const SaveModal: React.FC<SaveModalProps> = ({ open = false, onClose, specGenerator }) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  const edges = useEdges()
  const nodes = useNodes()

  const flow = useMemo(() => flowToBehave(nodes, edges, specGenerator), [nodes, edges, specGenerator])

  const jsonString = JSON.stringify(flow, null, 2)
  const selectionState = useHookstate(getMutableState(SelectionState))
  const entities = selectionState.selectedEntities.value
  const entity = entities[entities.length - 1]
  const behaveGraphComponent = useComponent(entity as Entity, BehaveGraphComponent)

  const handleCopy = () => {
    ref.current?.select()
    document.execCommand('copy')
    ref.current?.blur()
    setCopied(true)
    setInterval(() => {
      setCopied(false)
    }, 1000)
  }

  const handleSave = async () => {
    await uploadGraphFilefromJson(behaveGraphComponent.filepath.value, flow)
  }

  return (
    <Modal
      title="Save Graph"
      actions={[
        { label: 'Cancel', onClick: onClose },
        { label: 'Save', onClick: handleSave }
      ]}
      open={open}
      onClose={onClose}
    >
      <textarea
        ref={ref}
        style={{
          border: '1px solid #cbd5e0',
          width: '100%',
          padding: '0.5rem',
          height: '8rem',
          margin: 0
        }}
        defaultValue={jsonString}
      ></textarea>
    </Modal>
  )
}
