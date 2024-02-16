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

import React, { useCallback, useEffect, useState } from 'react'
import { useReactFlow } from 'reactflow'

import { GraphJSON } from '@behave-graph/core'

import { Modal } from './Modal'

export type Examples = {
  [key: string]: GraphJSON
}

export type LoadModalProps = {
  open?: boolean
  onClose: () => void
  setBehaviorGraph: (value: GraphJSON) => void
  examples: Examples
}

export const LoadModal: React.FC<LoadModalProps> = ({ open = false, onClose, setBehaviorGraph, examples }) => {
  const [value, setValue] = useState<string>()
  const [selected, setSelected] = useState('')

  const instance = useReactFlow()

  useEffect(() => {
    if (selected) {
      setValue(JSON.stringify(examples[selected], null, 2))
    }
  }, [selected, examples])

  const handleLoad = useCallback(() => {
    let graph
    if (value !== undefined) {
      graph = JSON.parse(value) as GraphJSON
    } else if (selected !== '') {
      graph = examples[selected]
    }

    if (graph === undefined) return

    setBehaviorGraph(graph)

    // TODO better way to call fit vew after edges render
    setTimeout(() => {
      instance.fitView()
    }, 100)

    handleClose()
  }, [setBehaviorGraph, value, instance])

  const handleClose = () => {
    setValue(undefined)
    setSelected('')
    onClose()
  }

  return (
    <Modal
      title="Load Graph"
      actions={[
        { label: 'Cancel', onClick: handleClose },
        { label: 'Load', onClick: handleLoad }
      ]}
      open={open}
      onClose={onClose}
    >
      <textarea
        autoFocus
        style={{
          border: '1px solid #cbd5e0',
          width: '100%',
          padding: '0.5rem',
          height: '8rem',
          verticalAlign: 'top',
          margin: 0
        }}
        placeholder="Paste JSON here"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
      ></textarea>
      <div style={{ padding: '1rem', textAlign: 'center', color: '#4a5568' }}>or</div>
      <select
        style={{
          backgroundColor: '#f7fafc',
          border: '1px solid #cbd5e0',
          color: '#1a202c',
          fontSize: '14px',
          borderRadius: '0.25rem',
          display: 'block',
          width: '100%',
          padding: '0.75rem',
          margin: 0
        }}
        onChange={(e) => setSelected(e.target.value)}
        value={selected}
      >
        <option disabled value="">
          Select a graph
        </option>
        {Object.keys(examples).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </Modal>
  )
}
