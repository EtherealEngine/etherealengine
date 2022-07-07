import { Downgraded } from '@speigg/hookstate'
import React, { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroller'

import ConfirmDialog from '@xrengine/client-core/src/admin/common/ConfirmDialog'
import {
  FileBrowserService,
  FileBrowserServiceReceptor,
  useFileBrowserState
} from '@xrengine/client-core/src/common/services/FileBrowserService'
import { ScenePrefabs } from '@xrengine/engine/src/scene/functions/registerPrefabs'
import { addActionReceptor, removeActionReceptor } from '@xrengine/hyperflux'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import { CircularProgress } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import { prefabIcons } from '../../functions/PrefabEditors'
import { unique } from '../../functions/utils'
import { ContextMenu, ContextMenuTrigger, MenuItem } from '../layout/ContextMenu'
import { ToolButton } from '../toolbar/ToolButton'
import { FileBrowserItem } from './FileBrowserGrid'
import { FileDataType } from './FileDataType'
import styles from './styles.module.scss'

/**
 * @author Abhishek Pathak
 */
export const PrefabFileType = {
  gltf: ScenePrefabs.model,
  'gltf-binary': ScenePrefabs.model,
  glb: ScenePrefabs.model,
  png: ScenePrefabs.image,
  jpeg: ScenePrefabs.image,
  jpg: ScenePrefabs.image,
  mp4: ScenePrefabs.video,
  mpeg: ScenePrefabs.audio,
  mp3: ScenePrefabs.audio,
  'model/gltf-binary': ScenePrefabs.model,
  'model/gltf': ScenePrefabs.model,
  'model/glb': ScenePrefabs.model,
  'image/png': ScenePrefabs.image,
  'image/jpeg': ScenePrefabs.image,
  'image/jpg': ScenePrefabs.image,
  'application/pdf': null,
  'video/mp4': ScenePrefabs.video,
  'audio/mpeg': ScenePrefabs.audio,
  'audio/mp3': ScenePrefabs.audio
}

const MemoFileGridItem = memo(FileBrowserItem)

type FileBrowserContentPanelProps = {
  onSelectionChanged: (AssetSelectionChangePropsType) => void
  disableDnD?: boolean
  selectedFile?: string
}

type DnDFileType = {
  dataTransfer: DataTransfer
  files: File[]
  items: DataTransferItemList
}

export function isFileDataType(value: any): value is FileDataType {
  return value && value.key
}

/**
 * FileBrowserPanel used to render view for AssetsPanel.
 * @author Abhishek Pathak
 * @constructor
 */
const FileBrowserContentPanel: React.FC<FileBrowserContentPanelProps> = (props) => {
  const { t } = useTranslation()
  const [isLoading, setLoading] = useState(true)
  const [selectedDirectory, setSelectedDirectory] = useState(
    `/projects/${props.selectedFile ? props.selectedFile + '/' : ''}`
  )
  const fileState = useFileBrowserState()
  const filesValue = fileState.files.attach(Downgraded).value
  const [fileProperties, setFileProperties] = useState<any>(null)
  const [files, setFiles] = useState<FileDataType[]>([])
  const [openProperties, setOpenPropertiesModal] = useState(false)
  const [openConfirm, setOpenConfirm] = useState(false)
  const [contentToDeletePath, setContentToDeletePath] = useState('')
  const [contentToDeleteType, setContentToDeleteType] = useState('')

  const breadcrumbs = selectedDirectory
    .slice(1, -1)
    .split('/')
    .map((file, index, arr) => {
      if (arr.length - 1 == index) {
        return (
          <Typography key={file} style={{ fontSize: '0.9rem' }}>
            {file}
          </Typography>
        )
      } else {
        return (
          <Link
            underline="hover"
            key={file}
            color="#5d646c"
            style={{ fontSize: '0.9rem' }}
            href="#"
            onClick={() => handleClick(file)}
          >
            {file}
          </Link>
        )
      }
    })

  useEffect(() => {
    addActionReceptor(FileBrowserServiceReceptor)
    return () => {
      removeActionReceptor(FileBrowserServiceReceptor)
    }
  }, [])

  const onSelect = (params: FileDataType) => {
    if (params.type !== 'folder') {
      props.onSelectionChanged({
        resourceUrl: params.url,
        name: params.name,
        contentType: params.type
      })
    } else {
      const newPath = `${selectedDirectory}${params.name}/`
      setSelectedDirectory(newPath)
    }
  }

  useEffect(() => {
    setLoading(false)
  }, [filesValue])

  useEffect(() => {
    setFiles(
      fileState.files.value.map((file) => {
        const prefabType = PrefabFileType[file.type]
        const isFolder = file.type === 'folder'
        const fullName = isFolder ? file.name : file.name + '.' + file.type

        return {
          ...file,
          path: isFolder ? file.key.split(file.name)[0] : file.key.split(fullName)[0],
          fullName,
          isFolder,
          prefabType,
          Icon: prefabIcons[prefabType]
        }
      })
    )
  }, [fileState])

  useEffect(() => {
    onRefreshDirectory()
  }, [selectedDirectory])

  const createNewFolder = async () => {
    await FileBrowserService.addNewFolder(`${selectedDirectory}New_Folder`)
    await onRefreshDirectory()
  }

  const dropItemsOnPanel = async (data: FileDataType | DnDFileType, dropOn?: FileDataType) => {
    if (isLoading) return

    setLoading(true)
    const path = dropOn?.isFolder ? dropOn.key : selectedDirectory

    if (isFileDataType(data)) {
      if (dropOn?.isFolder) {
        moveContent(data.fullName, data.fullName, data.path, path, false)
      }
    } else {
      await Promise.all(
        data.files.map(async (file) => {
          // If file is directory then it's type is going to be empty string
          if (!file.type) {
            await FileBrowserService.addNewFolder(`${path}${file.name}`)
          } else {
            await FileBrowserService.putContent(file.name, path, file as any, file.type)
          }
        })
      )
    }

    await onRefreshDirectory()
  }

  const onRefreshDirectory = async () => {
    await FileBrowserService.fetchFiles(selectedDirectory)
  }

  const onBackDirectory = () => {
    const pattern = /([^\/]+)/g
    const result = selectedDirectory.match(pattern)
    if (!result) return
    let newPath = '/'
    for (let i = 0; i < result.length - 1; i++) {
      newPath += result[i] + '/'
    }
    setSelectedDirectory(newPath)
  }

  const moveContent = async (
    oldName: string,
    newName: string,
    oldPath: string,
    newPath: string,
    isCopy = false
  ): Promise<void> => {
    if (isLoading) return
    setLoading(true)
    await FileBrowserService.moveContent(oldName, newName, oldPath, newPath, isCopy)
    await onRefreshDirectory()
  }

  const handleConfirmDelete = (contentPath: string, type: string) => {
    setContentToDeletePath(contentPath)
    setContentToDeleteType(type)
    setOpenConfirm(true)
  }

  const handleConfirmClose = () => {
    setContentToDeletePath('')
    setContentToDeleteType('')
    setOpenConfirm(false)
  }

  const deleteContent = async (): Promise<void> => {
    if (isLoading) return
    setLoading(true)
    setOpenConfirm(false)
    await FileBrowserService.deleteContent(contentToDeletePath, contentToDeleteType)
    props.onSelectionChanged({ resourceUrl: '', name: '', contentType: '' })
    await onRefreshDirectory()
  }

  const pasteContent = async () => {
    if (isLoading) return
    setLoading(true)

    await FileBrowserService.moveContent(
      currentContentRef.current.item.fullName,
      currentContentRef.current.item.fullName,
      currentContentRef.current.item.path,
      selectedDirectory,
      currentContentRef.current.isCopy
    )

    await onRefreshDirectory()
  }

  let currentContent = null! as { item: FileDataType; isCopy: boolean }
  const currentContentRef = useRef(currentContent)

  const headGrid = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px'
  }

  function handleClick(targetFolder: string) {
    const pattern = /([^\/]+)/g
    const result = selectedDirectory.match(pattern)
    if (!result) return
    let newPath = '/'
    for (const folder of result) {
      if (folder != targetFolder) {
        newPath += folder + '/'
      } else {
        newPath += folder + '/'
        break
      }
    }
    setSelectedDirectory(newPath)
  }

  return (
    <>
      <div style={headGrid}>
        <ToolButton
          tooltip={t('editor:layout.filebrowser.back')}
          icon={ArrowBackIcon}
          onClick={onBackDirectory}
          id="backDir"
        />
        <Breadcrumbs
          maxItems={3}
          classes={{ separator: styles.separator, li: styles.breadcrumb }}
          separator="›"
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
        <ToolButton
          tooltip={t('editor:layout.filebrowser.refresh')}
          icon={AutorenewIcon}
          onClick={onRefreshDirectory}
          id="refreshDir"
        />
      </div>

      <ContextMenuTrigger id={'uniqueId_current'} holdToDisplay={-1}>
        <div id="file-browser-panel" className={styles.panelContainer}>
          <div className={styles.contentContainer}>
            <InfiniteScroll
              pageStart={0}
              hasMore={false}
              loader={<CircularProgress />}
              threshold={100}
              useWindow={false}
              loadMore={() => {}}
            >
              {unique(files, (file) => file.key).map((file, i) => (
                <MemoFileGridItem
                  key={file.key}
                  contextMenuId={i.toString()}
                  item={file}
                  disableDnD={props.disableDnD}
                  onClick={onSelect}
                  moveContent={moveContent}
                  deleteContent={handleConfirmDelete}
                  currentContent={currentContentRef}
                  setOpenPropertiesModal={setOpenPropertiesModal}
                  setFileProperties={setFileProperties}
                  dropItemsOnPanel={dropItemsOnPanel}
                />
              ))}
            </InfiniteScroll>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenu id={'uniqueId_current'} hideOnLeave={true}>
        <MenuItem onClick={createNewFolder}>{t('editor:layout.filebrowser.addNewFolder')}</MenuItem>
        <MenuItem onClick={pasteContent}>{t('editor:layout.filebrowser.pasteAsset')}</MenuItem>
      </ContextMenu>
      {openProperties && fileProperties && (
        <Dialog
          open={openProperties}
          onClose={() => setOpenPropertiesModal(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{ paper: styles.paperDialog }}
        >
          <DialogTitle style={{ padding: '0', textTransform: 'capitalize' }} id="alert-dialog-title">
            {`${fileProperties?.name} ${fileProperties?.type == 'folder' ? 'folder' : 'file'} Properties`}
          </DialogTitle>
          <Grid container spacing={3} style={{ width: '100%', margin: '0' }}>
            <Grid item xs={4} style={{ paddingLeft: '10px', paddingTop: '10px', width: '100%' }}>
              <Typography className={styles.primatyText}>Name:</Typography>
              <Typography className={styles.primatyText}>Type:</Typography>
              <Typography className={styles.primatyText}>Size:</Typography>
              <Typography className={styles.primatyText}>URL:</Typography>
            </Grid>
            <Grid item xs={8} style={{ paddingLeft: '10px', paddingTop: '10px', width: '100%' }}>
              <Typography className={styles.secondaryText}>{fileProperties?.name}</Typography>
              <Typography className={styles.secondaryText}>{fileProperties?.type}</Typography>
              <Typography className={styles.secondaryText}>{fileProperties?.size}</Typography>
              <Typography className={styles.secondaryText}>{fileProperties?.url}</Typography>
            </Grid>
          </Grid>
        </Dialog>
      )}
      <ConfirmDialog
        open={openConfirm}
        description={`${t('editor:dialog.confirmContentDelete')} ${
          contentToDeleteType == 'folder' ? t('editor:dialog.folder') : t('editor:dialog.file')
        }?`}
        onClose={handleConfirmClose}
        onSubmit={deleteContent}
      />
    </>
  )
}

export default FileBrowserContentPanel
