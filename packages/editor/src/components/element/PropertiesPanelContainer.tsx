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
import { useTranslation } from 'react-i18next'

import { Entity, UndefinedEntity } from '@etherealengine/engine/src/ecs/classes/Entity'
import {
  useAllComponents,
  useComponent,
  useOptionalComponent
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { getMutableState } from '@etherealengine/hyperflux'

import { Popover } from '@mui/material'
import { EntityNodeEditor } from '../../functions/ComponentEditors'
import { EditorState } from '../../services/EditorServices'
import { SelectionState } from '../../services/SelectionServices'
import { PropertiesPanelButton } from '../inputs/Button'
import MaterialEditor from '../materials/MaterialEditor'
import { MaterialSelectionState } from '../materials/MaterialLibraryState'
import { CoreNodeEditor } from '../properties/CoreNodeEditor'
import { EntityComponentEditor } from './ComponentTab'
import ElementList from './ElementList'
import { PopoverContext } from './PopoverContext'

const EntityEditor = ({ entity }: { entity: Entity }) => {
  const anchorEl = useHookstate<HTMLButtonElement | null>(null)
  const { t } = useTranslation()

  const uuid = useComponent(entity, UUIDComponent)

  const components = useAllComponents(entity).filter((c) => EntityNodeEditor.has(c))

  const open = !!anchorEl.value

  return (
    <PopoverContext.Provider
      value={{
        handlePopoverClose: () => {
          anchorEl.set(null)
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
        <PropertiesPanelButton onClick={(event) => anchorEl.set(event.currentTarget)}>
          {t('editor:properties.lbl-addComponent')}
        </PropertiesPanelButton>
      </div>
      <Popover
        id={open ? 'add-component-popover' : undefined}
        open={open}
        anchorEl={anchorEl.value}
        onClose={() => anchorEl.set(null)}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right'
        }}
      >
        <ElementList />
      </Popover>
      <CoreNodeEditor entity={entity} key={uuid.value} />
      {components.map((c) => (
        <EntityComponentEditor key={`${uuid.value}-${c.name}`} entity={entity} component={c} />
      ))}
    </PopoverContext.Provider>
  )
}

/**
 * PropertiesPanelContainer used to render editor view to customize property of selected element.
 */
export const PropertiesPanelContainer = () => {
  const selectionState = useHookstate(getMutableState(SelectionState))
  const editorState = useHookstate(getMutableState(EditorState))
  const entity = useHookstate<Entity>(UndefinedEntity)

  const { t } = useTranslation()

  useEffect(() => {
    const selectedEntities = selectionState.selectedEntities.value
    const lockedNode = editorState.lockPropertiesPanel.value
    entity.set(
      lockedNode
        ? UUIDComponent.getEntityByUUID(lockedNode) ?? lockedNode
        : selectedEntities[selectedEntities.length - 1]
    )
  }, [selectionState.selectedEntities])

  const materialID = useHookstate(getMutableState(MaterialSelectionState)).selectedMaterial.value

  return (
    <div
      style={{
        overflowY: 'auto',
        height: '100%'
      }}
    >
      {materialID ? (
        <MaterialEditor materialID={materialID} />
      ) : entity.value ? (
        <EntityEditor entity={entity.value} key={entity.value} />
      ) : (
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'var(--textColor)'
          }}
        >
          {t('editor:properties.noNodeSelected')}
        </div>
      )}
    </div>
  )
}

export default PropertiesPanelContainer
