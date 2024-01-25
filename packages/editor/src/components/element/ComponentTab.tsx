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

import React, { useEffect, useState } from 'react'
import hierarchyStyles from '../hierarchy/styles.module.scss'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import {
  Component,
  hasComponent,
  useOptionalComponent
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { getMutableState } from '@etherealengine/hyperflux'
import { useHookstate } from '@hookstate/core'
import { CircularProgress } from '@mui/material'
import { TabData } from 'rc-dock'
import { SelectionState } from '../../services/SelectionServices'
import { PanelDragContainer, PanelIcon, PanelTitle } from '../layout/Panel'
import { EditorComponentType } from '../properties/Util'
import styles from '../styles.module.scss'

/**import EntityNodeEditor dynamically (useful in circular import preventions) */
const useDynamicEntityNodeEditor = () => {
  const [EntityNodeEditor, setEntityNodeEditor] = useState<Map<Component, EditorComponentType> | null>(null)
  useEffect(() => {
    import('../../functions/ComponentEditors').then((imported) => setEntityNodeEditor(imported.EntityNodeEditor))
  }, [])
  return EntityNodeEditor
}

export const EntityComponentEditor = ({ entity, component }: { entity: Entity; component: Component }) => {
  const componentMounted = useOptionalComponent(entity, component)
  if (!componentMounted || !hasComponent(entity, component)) return null
  const selectedEntities = useHookstate(getMutableState(SelectionState).selectedEntities).value
  const EntityNodeEditor = useDynamicEntityNodeEditor()
  const Editor = EntityNodeEditor?.get(component)

  return Editor ? (
    <Editor
      key={`${entity}-${Editor.name}`}
      multiEdit={selectedEntities.length > 1}
      entity={entity}
      component={component}
    />
  ) : (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '1rem' }}>
      <CircularProgress style={{ color: 'var(--textColor)' }} />
    </div>
  )
}

export const ComponentPanelTitle = ({ title, component }: { title: string; component: Component }) => {
  const EntityNodeEditor = useDynamicEntityNodeEditor()
  return (
    <div className={styles.dockableTab}>
      <PanelDragContainer>
        {EntityNodeEditor && <PanelIcon as={EntityNodeEditor.get(component)?.iconComponent} size={12} />}
        <PanelTitle>{title}</PanelTitle>
      </PanelDragContainer>
    </div>
  )
}

const ComponentPanelContent = ({ entity, component }: { entity: Entity; component: Component }) => {
  return (
    <div className={hierarchyStyles.panelContainer}>
      <div className={hierarchyStyles.panelSection}>
        <EntityComponentEditor entity={entity} component={component} />
      </div>
    </div>
  )
}

export const generateComponentPanelTab = (component: Component, entity: Entity): TabData => {
  return {
    id: component.name,
    closable: true,
    title: (
      <ComponentPanelTitle
        title={
          component?.jsonID
            ?.split('-')
            .map((name) => name[0].toUpperCase() + name.slice(1))
            .join(' ') || component.name
        }
        component={component}
      />
    ),
    content: <ComponentPanelContent entity={entity} component={component} />
  }
}
