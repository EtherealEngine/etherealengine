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

import React, { MouseEventHandler, MutableRefObject, useEffect, useState } from 'react'
import { ConnectDragSource, ConnectDropTarget, useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useTranslation } from 'react-i18next'

import { FileBrowserService } from '@etherealengine/client-core/src/common/services/FileBrowserService'
import { StateMethods, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'

import InputBase from '@mui/material/InputBase'
import MenuItem from '@mui/material/MenuItem'
import { PopoverPosition } from '@mui/material/Popover'
import { FileIcon } from './FileIcon'

import Paper from '@etherealengine/ui/src/primitives/mui/Paper'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Vector3 } from 'three'
import { SupportedFileTypes } from '../../../constants/AssetTypes'
import { addMediaNode } from '../../../functions/addMediaNode'
import { getSpawnPositionAtCenter } from '../../../functions/screenSpaceFunctions'
import { ContextMenu } from '../../layout/ContextMenu'
import styles from '../styles.module.scss'
import { FilesViewModeSettings, availableTableColumns } from './FileBrowserState'
import { FileDataType } from './FileDataType'

const RenameInput = ({ fileName, onNameChanged }: { fileName: string; onNameChanged: (newName: string) => void }) => {
  const newFileName = useHookstate(fileName)
  return (
    <Paper component="div" className={styles.inputContainer}>
      <InputBase
        autoFocus={true}
        className={styles.input}
        name="name"
        autoComplete="off"
        value={newFileName.value}
        onChange={(event) => newFileName.set(event.target.value)}
        onKeyUp={async (e) => {
          if (e.key == 'Enter') {
            onNameChanged(newFileName.value)
          }
        }}
      />
    </Paper>
  )
}

/**
 * if `wrap` is enabled, wraps the `children` inside a `TableBody` with Table Heading and Table Component attached
 */
export const FileTableWrapper = ({ wrap, children }: { wrap: boolean; children: JSX.Element }): JSX.Element => {
  if (!wrap) {
    return children
  }
  const { t } = useTranslation()
  const selectedTableColumns = useHookstate(getMutableState(FilesViewModeSettings).list.selectedTableColumns).value
  const fontSize = useHookstate(getMutableState(FilesViewModeSettings).list.fontSize).value
  return (
    <TableContainer component="div">
      <Table size="small" className={styles.table}>
        <TableHead>
          <TableRow className={styles.tableHeaderRow} style={{ height: fontSize * 3 }}>
            {availableTableColumns
              .filter((header) => selectedTableColumns[header])
              .map((header) => (
                <TableCell key={header} className={styles.tableCell} style={{ fontSize }}>
                  {t(`editor:layout.filebrowser.table-list.headers.${header}`)}
                </TableCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  )
}

export const FileTableListBody = ({
  file,
  onContextMenu,
  isRenaming,
  onNameChanged,
  onClick,
  onDoubleClick,
  modifiedDate,
  drop,
  isOver,
  drag
}: {
  file: FileDataType
  onContextMenu: React.MouseEventHandler
  isRenaming: boolean
  onNameChanged: (newName: string) => void
  onClick?: MouseEventHandler<HTMLDivElement>
  onDoubleClick?: MouseEventHandler<HTMLDivElement>
  modifiedDate?: string
  drop?: ConnectDropTarget
  isOver: boolean
  drag?: ConnectDragSource
}) => {
  const selectedTableColumns = useHookstate(getMutableState(FilesViewModeSettings).list.selectedTableColumns).value
  const fontSize = useHookstate(getMutableState(FilesViewModeSettings).list.fontSize).value
  const dragFn = drag ?? ((input) => input)
  const dropFn = drop ?? ((input) => input)
  const tableColumns = {
    name: (
      <span className={styles.cellName}>
        <FileIcon file={file} />
        {isRenaming ? <RenameInput fileName={file.name} onNameChanged={onNameChanged} /> : file.fullName}
      </span>
    ),
    type: file.type.toUpperCase(),
    dateModified: modifiedDate || '',
    size: file.size
  }
  return (
    <TableRow
      key={file.key}
      sx={{ border: file.isFolder ? (isOver ? '3px solid #ccc' : '') : '', height: fontSize * 3 }}
      onContextMenu={onContextMenu}
      onClick={isRenaming ? () => {} : onClick}
      onDoubleClick={isRenaming ? () => {} : onDoubleClick}
      hover
      ref={(ref) => dragFn(dropFn(ref))}
    >
      {availableTableColumns
        .filter((header) => selectedTableColumns[header])
        .map((header, idx) => (
          <TableCell key={idx} className={styles.tableCell} style={{ fontSize }}>
            {tableColumns[header]}
          </TableCell>
        ))}
    </TableRow>
  )
}

type FileGridItemProps = {
  item: FileDataType
  isRenaming: boolean
  onDoubleClick?: MouseEventHandler<HTMLDivElement>
  onClick?: MouseEventHandler<HTMLDivElement>
  onNameChanged: (newName: string) => void
}

export const FileGridItem: React.FC<FileGridItemProps> = (props) => {
  const iconSize = useHookstate(getMutableState(FilesViewModeSettings).icons.iconSize).value
  return (
    <div
      className={styles.fileListItemContainer}
      onDoubleClick={props.item.isFolder ? props.onDoubleClick : undefined}
      onClick={props.item.isFolder ? undefined : props.onClick}
      style={{
        fontSize: 0.2 * iconSize,
        width: iconSize + 10,
        margin: 0.1 * iconSize
      }}
    >
      <div
        className={styles.fileNameContainer}
        style={{
          height: iconSize,
          width: iconSize,
          fontSize: iconSize
        }}
      >
        <FileIcon file={props.item} showRibbon />
      </div>
      {props.isRenaming ? (
        <RenameInput fileName={props.item.name} onNameChanged={props.onNameChanged} />
      ) : (
        props.item.fullName
      )}
    </div>
  )
}

type FileBrowserItemType = {
  item: FileDataType
  disableDnD?: boolean
  currentContent: MutableRefObject<{ item: FileDataType; isCopy: boolean }>
  setFileProperties: any
  setOpenPropertiesModal: any
  setOpenCompress: any
  setOpenConvert: any
  isFilesLoading: StateMethods<boolean>
  deleteContent: (contentPath: string, type: string) => void
  onClick: (params: FileDataType) => void
  dropItemsOnPanel: (data: any, dropOn?: FileDataType) => void
  moveContent: (oldName: string, newName: string, oldPath: string, newPath: string, isCopy?: boolean) => Promise<void>
  addFolder: () => void
  refreshDirectory: () => Promise<void>
  isListView: boolean
  staticResourceModifiedDates: Record<string, string>
}

export function FileBrowserItem({
  item,
  disableDnD,
  currentContent,
  setOpenPropertiesModal,
  setFileProperties,
  setOpenCompress,
  setOpenConvert,
  deleteContent,
  onClick,
  dropItemsOnPanel,
  moveContent,
  isFilesLoading,
  addFolder,
  refreshDirectory,
  isListView,
  staticResourceModifiedDates
}: FileBrowserItemType) {
  const { t } = useTranslation()
  const [anchorPosition, setAnchorPosition] = React.useState<undefined | PopoverPosition>(undefined)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const [renamingAsset, setRenamingAsset] = useState(false)

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    setAnchorEl(event.currentTarget)
    setAnchorPosition({
      left: event.clientX + 2,
      top: event.clientY - 6
    })
  }

  const handleClose = () => {
    setAnchorEl(null)
    setAnchorPosition(undefined)
  }

  const onClickItem = (_) => onClick(item)

  const placeObjectAtOrigin = () => {
    addMediaNode(item.url)

    handleClose()
  }

  const placeObject = async () => {
    const vec3 = new Vector3()
    getSpawnPositionAtCenter(vec3)
    addMediaNode(item.url, undefined, undefined, [{ name: TransformComponent.jsonID, props: { position: vec3 } }])

    handleClose()
  }

  const copyURL = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.url)
    }

    handleClose()
  }

  const openURL = () => {
    window.open(item.url)

    handleClose()
  }

  const Copy = () => {
    currentContent.current = { item: item, isCopy: true }

    handleClose()
  }

  const Cut = () => {
    currentContent.current = { item: item, isCopy: false }

    handleClose()
  }

  const pasteContent = async () => {
    handleClose()

    if (isFilesLoading.value) return
    isFilesLoading.set(true)

    await FileBrowserService.moveContent(
      currentContent.current.item.fullName,
      currentContent.current.item.fullName,
      currentContent.current.item.path,
      item.isFolder ? item.path + item.fullName : item.path,
      currentContent.current.isCopy
    )

    await refreshDirectory()
  }

  const viewAssetProperties = () => {
    setFileProperties(item)

    setOpenPropertiesModal(true)

    handleClose()
  }

  const viewCompress = () => {
    setFileProperties(item)
    setOpenCompress(true)

    handleClose()
  }

  const viewConvert = () => {
    setFileProperties(item)
    setOpenConvert(true)

    handleClose()
  }

  const deleteContentCallback = () => {
    deleteContent(item.key, item.type)

    handleClose()
  }

  const onNameChanged = async (fileName: string): Promise<void> => {
    setRenamingAsset(false)

    await moveContent(item.fullName, item.isFolder ? fileName : `${fileName}.${item.type}`, item.path, item.path, false)
  }

  const rename = () => {
    setRenamingAsset(true)
    handleClose()
  }

  const [_dragProps, drag, preview] = disableDnD
    ? [undefined, undefined, undefined]
    : useDrag(() => ({
        type: item.type,
        item,
        multiple: false
      }))

  const [{ isOver }, drop] = disableDnD
    ? [{ isOver: false }, undefined]
    : useDrop({
        accept: [...SupportedFileTypes],
        drop: (dropItem) => dropItemsOnPanel(dropItem, item),
        collect: (monitor) => ({
          isOver: monitor.isOver(),
          canDrop: !!monitor.canDrop(),
          moni: monitor.getItemType()
        })
      })

  //showing the object in viewport once it drag and droped
  useEffect(() => {
    if (preview) preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  return (
    <>
      {isListView ? (
        <FileTableListBody
          file={item}
          onContextMenu={handleContextMenu}
          onClick={onClickItem}
          onDoubleClick={onClickItem}
          isRenaming={renamingAsset}
          onNameChanged={onNameChanged}
          modifiedDate={staticResourceModifiedDates[item.key]}
          drop={drop}
          isOver={isOver}
          drag={drag}
        />
      ) : (
        <div ref={drop} style={{ border: item.isFolder ? (isOver ? '3px solid #ccc' : '') : '' }}>
          <div ref={drag}>
            <div onContextMenu={handleContextMenu}>
              <FileGridItem
                item={item}
                onClick={onClickItem}
                onDoubleClick={onClickItem}
                isRenaming={renamingAsset}
                onNameChanged={onNameChanged}
              />
            </div>
          </div>
        </div>
      )}

      <ContextMenu open={open} anchorEl={anchorEl} anchorPosition={anchorPosition} onClose={handleClose}>
        <MenuItem onClick={addFolder}>{t('editor:layout.filebrowser.addNewFolder')}</MenuItem>
        {!item.isFolder && <MenuItem onClick={placeObject}>{t('editor:layout.assetGrid.placeObject')}</MenuItem>}
        {!item.isFolder && (
          <MenuItem onClick={placeObjectAtOrigin}>{t('editor:layout.assetGrid.placeObjectAtOrigin')}</MenuItem>
        )}
        {!item.isFolder && <MenuItem onClick={openURL}>{t('editor:layout.assetGrid.openInNewTab')}</MenuItem>}
        <MenuItem onClick={copyURL}>{t('editor:layout.assetGrid.copyURL')}</MenuItem>
        <MenuItem onClick={Cut}>{t('editor:layout.filebrowser.cutAsset')}</MenuItem>
        <MenuItem onClick={Copy}>{t('editor:layout.filebrowser.copyAsset')}</MenuItem>
        <MenuItem disabled={!currentContent.current} onClick={pasteContent}>
          {t('editor:layout.filebrowser.pasteAsset')}
        </MenuItem>
        <MenuItem onClick={rename}>{t('editor:layout.filebrowser.renameAsset')}</MenuItem>
        <MenuItem onClick={deleteContentCallback}>{t('editor:layout.assetGrid.deleteAsset')}</MenuItem>
        <MenuItem onClick={viewAssetProperties}>{t('editor:layout.filebrowser.viewAssetProperties')}</MenuItem>
        <MenuItem onClick={viewCompress}>{t('editor:layout.filebrowser.compress')}</MenuItem>
        <MenuItem onClick={viewConvert}>{t('editor:layout.filebrowser.convert')}</MenuItem>
      </ContextMenu>
    </>
  )
}
