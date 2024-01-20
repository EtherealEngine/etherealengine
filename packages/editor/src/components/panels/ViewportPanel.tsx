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

import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { TabData } from 'rc-dock'
import React from 'react'
import { useDrop } from 'react-dnd'
import { useTranslation } from 'react-i18next'
import { Vector2, Vector3 } from 'three'
import { ItemTypes } from '../../constants/AssetTypes'
import { EditorControlFunctions } from '../../functions/EditorControlFunctions'
import { getCursorSpawnPosition } from '../../functions/screenSpaceFunctions'
import { EditorState } from '../../services/EditorServices'
import { PrefabricatedComponentsType } from '../assets/SceneAssetsPanel'
import { SceneElementType } from '../element/ElementList'
import * as styles from '../styles.module.scss'

const ViewportDnD = () => {
  const [{ isDragging, isOver }, dropRef] = useDrop({
    accept: [ItemTypes.Component, ItemTypes.PrefabComponents],
    collect: (monitor) => ({
      isDragging: monitor.getItem() !== null && monitor.canDrop(),
      isOver: monitor.isOver()
    }),
    drop(item: SceneElementType | PrefabricatedComponentsType, monitor) {
      const vec3 = new Vector3()
      getCursorSpawnPosition(monitor.getClientOffset() as Vector2, vec3)
      if (item.type === ItemTypes.PrefabComponents) {
        EditorControlFunctions.createObjectFromSceneElement([
          ...(item as PrefabricatedComponentsType).components,
          { name: TransformComponent.jsonID, props: { position: vec3 } }
        ])
      } else {
        EditorControlFunctions.createObjectFromSceneElement([
          { name: (item as SceneElementType).componentJsonID },
          { name: TransformComponent.jsonID, props: { position: vec3 } }
        ])
      }
    }
  })

  return (
    <div
      id="viewport-panel"
      ref={dropRef}
      style={{
        pointerEvents: isDragging ? 'all' : 'none',
        border: isDragging && isOver ? '5px solid white' : 'none',
        width: '100%',
        height: '100%'
      }}
    />
  )
}

const ViewPortPanelContent = () => {
  const { t } = useTranslation()
  const sceneName = useHookstate(getMutableState(EditorState).sceneName).value
  return sceneName ? (
    <ViewportDnD />
  ) : (
    <div className={styles.bgImageBlock}>
      <img src="/static/etherealengine.png" alt="" />
      <h2>{t('editor:selectSceneMsg')}</h2>
    </div>
  )
}

export const ViewportPanelTab: TabData = {
  id: 'viewPanel',
  closable: true,
  title: 'Viewport',
  content: <ViewPortPanelContent />
}
