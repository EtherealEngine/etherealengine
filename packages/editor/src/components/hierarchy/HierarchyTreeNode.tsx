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

import React, { KeyboardEvent, StyleHTMLAttributes, useCallback, useEffect } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import {
  getAllComponents,
  getComponent,
  getOptionalComponent,
  useOptionalComponent
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { entityExists } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { EntityTreeComponent } from '@etherealengine/engine/src/ecs/functions/EntityTree'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import { ErrorComponent } from '@etherealengine/engine/src/scene/components/ErrorComponent'
import { SceneAssetPendingTagComponent } from '@etherealengine/engine/src/scene/components/SceneAssetPendingTagComponent'
import CircularProgress from '@etherealengine/ui/src/primitives/mui/CircularProgress'
import { ItemTypes, SupportedFileTypes } from '../../constants/AssetTypes'
import { EntityNodeEditor } from '../../functions/ComponentEditors'
import { EditorControlFunctions } from '../../functions/EditorControlFunctions'
import { addMediaNode } from '../../functions/addMediaNode'
import { isAncestor } from '../../functions/getDetachedObjectsRoots'
import { SelectionState } from '../../services/SelectionServices'
import useUpload from '../assets/useUpload'
import { HeirarchyTreeNodeType } from './HeirarchyTreeWalker'
import NodeIssuesIcon from './NodeIssuesIcon'
import styles from './styles.module.scss'

/**
 * getNodeElId function provides id for node.
 *
 * @param  {object} node
 * @return {string}
 */
export const getNodeElId = (node: HeirarchyTreeNodeType) => {
  return 'hierarchy-node-' + node.entity
}

export type RenameNodeData = {
  entity: Entity
  name: string
}

export type HierarchyTreeNodeData = {
  nodes: HeirarchyTreeNodeType[]
  renamingNode: RenameNodeData
  onToggle: (e: Event, node: HeirarchyTreeNodeType) => void
  onKeyDown: (e: Event, node: HeirarchyTreeNodeType) => void
  onMouseDown: (e: MouseEvent, node: HeirarchyTreeNodeType) => void
  onClick: (e: MouseEvent, node: HeirarchyTreeNodeType) => void
  onChangeName: (node: HeirarchyTreeNodeType, name: string) => void
  onRenameSubmit: (node: HeirarchyTreeNodeType, name: string) => void
  onUpload: ReturnType<typeof useUpload>
}

export type HierarchyTreeNodeProps = {
  index: number
  data: HierarchyTreeNodeData
  style: StyleHTMLAttributes<HTMLLIElement>
  onContextMenu: (event: React.MouseEvent<HTMLElement>, item: HeirarchyTreeNodeType) => void
}

export const HierarchyTreeNode = (props: HierarchyTreeNodeProps) => {
  const node = props.data.nodes[props.index]
  const data = props.data
  const selectionState = useHookstate(getMutableState(SelectionState))

  const nodeName = useOptionalComponent(node.entity, NameComponent)?.value

  const errors = node.entity ? useOptionalComponent(node.entity, ErrorComponent) : undefined

  const sceneAssetLoading = useOptionalComponent(node.entity, SceneAssetPendingTagComponent)

  const onClickToggle = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      if (data.onToggle) data.onToggle(e, node)
    },
    [data.onToggle, node]
  )

  const onNodeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.stopPropagation()
      if (data.onKeyDown) data.onKeyDown(e as any, node)
    },
    [data.onKeyDown, node]
  )

  const onKeyDownNameInput = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') data.onRenameSubmit(node, null!)
      else if (e.key === 'Enter') data.onRenameSubmit(node, (e.target as any).value)
    },
    [data.onRenameSubmit, node]
  )

  const onClickNode = useCallback((e) => data.onClick(e, node), [node, data.onClick])
  const onMouseDownNode = useCallback((e) => data.onMouseDown(e, node), [node, data.onMouseDown])

  const onChangeNodeName = useCallback((e) => data.onChangeName(node, e.target.value), [node, data.onChangeName])

  const [_dragProps, drag, preview] = useDrag({
    type: ItemTypes.Node,
    item() {
      const selectedEntities = selectionState.selectedEntities.value
      const multiple = selectedEntities.length > 1

      return {
        type: ItemTypes.Node,
        multiple,
        value: multiple ? selectedEntities : selectedEntities[0]
      }
    },
    canDrag() {
      return !selectionState.selectedEntities.value.some(
        (entity) => !(typeof entity === 'string' || getOptionalComponent(entity, EntityTreeComponent)?.parentEntity)
      )
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  })

  const dropItem = (node: HeirarchyTreeNodeType, place: 'On' | 'Before' | 'After') => {
    let parentNode: Entity | undefined
    let beforeNode: Entity

    if (place === 'Before') {
      const entityTreeComponent = getOptionalComponent(node.entity, EntityTreeComponent)
      parentNode = entityTreeComponent?.parentEntity
      beforeNode = node.entity
    } else if (place === 'After') {
      const entityTreeComponent = getOptionalComponent(node.entity, EntityTreeComponent)
      parentNode = entityTreeComponent?.parentEntity
      const parentTreeComponent = getOptionalComponent(entityTreeComponent?.parentEntity!, EntityTreeComponent)
      if (
        parentTreeComponent &&
        !node.lastChild &&
        parentNode &&
        parentTreeComponent?.children.length > node.childIndex + 1
      ) {
        beforeNode = parentTreeComponent.children[node.childIndex + 1]
      }
    } else {
      parentNode = node.entity
    }

    if (!parentNode)
      return () => {
        console.warn('parent is not defined')
      }

    return (item: any, monitor): void => {
      if (parentNode && typeof parentNode !== 'string' && typeof beforeNode !== 'string') {
        if (item.files) {
          const dndItem: any = monitor.getItem()
          const entries = Array.from(dndItem.items).map((item: any) => item.webkitGetAsEntry())

          //uploading files then adding as media to the editor
          data.onUpload(entries).then((assets) => {
            if (!assets) return
            for (const asset of assets) {
              addMediaNode(asset, parentNode, beforeNode)
            }
          })
          return
        }

        if (item.url) {
          addMediaNode(item.url, parentNode, beforeNode)
          return
        }

        if (item.type === ItemTypes.Component) {
          EditorControlFunctions.createObjectFromSceneElement([{ name: item!.componentJsonID }], parentNode, beforeNode)
          return
        } else if (item.type === ItemTypes.PrefabComponents) {
          EditorControlFunctions.createObjectFromSceneElement(item.components, parentNode, beforeNode)
          return
        }
      }

      EditorControlFunctions.reparentObject(
        Array.isArray(item.value) ? item.value : [item.value],
        beforeNode,
        parentNode === null ? undefined : parentNode
      )
    }
  }

  const canDropItem = (entityNode: Entity, dropOn?: boolean) => {
    return (item, monitor): boolean => {
      //check if monitor is over or object is not parent element
      if (!monitor.isOver()) return false

      if (!dropOn) {
        const entityTreeComponent = getComponent(entityNode, EntityTreeComponent)
        if (!entityTreeComponent) return false
      }
      if (item.type === ItemTypes.Node) {
        const entityTreeComponent = getComponent(entityNode, EntityTreeComponent)
        return (
          (dropOn || !!entityTreeComponent.parentEntity) &&
          !(item.multiple
            ? item.value.some((otherObject) => isAncestor(otherObject, entityNode))
            : isAncestor(item.value, entityNode))
        )
      }
      return true
    }
  }

  const [{ canDropBefore, isOverBefore }, beforeDropTarget] = useDrop({
    accept: [ItemTypes.Node, ItemTypes.File, ItemTypes.Component, ItemTypes.PrefabComponents, ...SupportedFileTypes],
    drop: dropItem(node, 'Before'),
    canDrop: canDropItem(node.entity),
    collect: (monitor) => ({
      canDropBefore: monitor.canDrop(),
      isOverBefore: monitor.isOver()
    })
  })

  const [{ canDropAfter, isOverAfter }, afterDropTarget] = useDrop({
    accept: [ItemTypes.Node, ItemTypes.File, ItemTypes.Component, ItemTypes.PrefabComponents, ...SupportedFileTypes],
    drop: dropItem(node, 'After'),
    canDrop: canDropItem(node.entity),
    collect: (monitor) => ({
      canDropAfter: monitor.canDrop(),
      isOverAfter: monitor.isOver()
    })
  })

  const [{ canDropOn, isOverOn }, onDropTarget] = useDrop({
    accept: [ItemTypes.Node, ItemTypes.File, ItemTypes.Component, ItemTypes.PrefabComponents, ...SupportedFileTypes],
    drop: dropItem(node, 'On'),
    canDrop: canDropItem(node.entity, true),
    collect: (monitor) => ({
      canDropOn: monitor.canDrop(),
      isOverOn: monitor.isOver()
    })
  })

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  const editors = entityExists(node.entity)
    ? getAllComponents(node.entity)
        .map((c) => EntityNodeEditor.get(c)!)
        .filter((c) => !!c)
    : []
  const IconComponent = editors.reduce((acc, c) => c.iconComponent || acc, null)
  const renaming = data.renamingNode && data.renamingNode.entity === node.entity
  const marginLeft = node.depth > 0 ? node.depth * 8 + 20 : 0

  return (
    <li style={props.style}>
      <div
        ref={drag}
        id={getNodeElId(node)}
        tabIndex={0}
        onKeyDown={onNodeKeyDown}
        className={
          styles.treeNodeContainer +
          (node.depth === 0 ? ' ' + styles.rootNode : '') +
          (node.selected ? ' ' + styles.selected : '') +
          (node.active ? ' ' + styles.active : '')
        }
        onMouseDown={onMouseDownNode}
        onClick={onClickNode}
        onContextMenu={(event) => props.onContextMenu(event, node)}
      >
        <div
          className={styles.nodeDropTraget}
          style={{ marginLeft, borderTopWidth: isOverBefore && canDropBefore ? 2 : 0 }}
          ref={beforeDropTarget}
        />
        <div className={styles.nodeContent} style={{ paddingLeft: node.depth * 8 + 'px' }} ref={onDropTarget}>
          {node.isLeaf ? (
            <div className={styles.spacer} />
          ) : (
            <button
              type="button"
              className={styles.collapseButton}
              onClick={onClickToggle as any}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {node.isCollapsed ? <ArrowRightIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
            </button>
          )}

          <div className={styles.selectTarget}>
            {IconComponent ? <IconComponent className={styles.nodeIcon} /> : null}
            <div className={styles.labelContainer}>
              {renaming ? (
                <div className={styles.renameInputContainer}>
                  <input
                    type="text"
                    className={styles.renameInput}
                    onChange={onChangeNodeName}
                    onKeyDown={onKeyDownNameInput}
                    value={data.renamingNode.name}
                    autoFocus
                  />
                </div>
              ) : (
                <div className={styles.nodelabel + (isOverOn && canDropOn ? ' ' + styles.dropTarget : '')}>
                  {nodeName}
                </div>
              )}
            </div>
            {errors?.value && <NodeIssuesIcon errors={errors.value} />}
            {sceneAssetLoading?.value && <CircularProgress className={styles.assetLoadingIndicator} />}
          </div>
        </div>

        <div
          className={styles.nodeDropTraget}
          style={{ marginLeft, borderBottomWidth: isOverAfter && canDropAfter ? 2 : 0 }}
          ref={afterDropTarget}
        />
      </div>
    </li>
  )
}
