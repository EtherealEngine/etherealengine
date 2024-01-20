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

import { Downgraded } from '@hookstate/core'
import React, { useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useTranslation } from 'react-i18next'
import { saveAs } from 'save-as'

import ConfirmDialog from '@etherealengine/client-core/src/common/components/ConfirmDialog'
import LoadingView from '@etherealengine/client-core/src/common/components/LoadingView'
import {
  FileBrowserService,
  FileBrowserState,
  FILES_PAGE_LIMIT
} from '@etherealengine/client-core/src/common/services/FileBrowserService'
import { NotificationService } from '@etherealengine/client-core/src/common/services/NotificationService'
import { uploadToFeathersService } from '@etherealengine/client-core/src/util/upload'
import config from '@etherealengine/common/src/config'
import { processFileName } from '@etherealengine/common/src/utils/processFileName'
import { DndWrapper } from '@etherealengine/editor/src/components/dnd/DndWrapper'
import {
  ImageConvertDefaultParms,
  ImageConvertParms
} from '@etherealengine/engine/src/assets/constants/ImageConvertParms'
import { getMutableState, NO_PROXY, useHookstate } from '@etherealengine/hyperflux'

import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import DownloadIcon from '@mui/icons-material/Download'
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual'
import SettingsIcon from '@mui/icons-material/Settings'
import VideocamIcon from '@mui/icons-material/Videocam'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'

import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { Breadcrumbs, Link, Popover, TablePagination } from '@mui/material'

import InputSlider from '@etherealengine/client-core/src/common/components/InputSlider'
import { archiverPath, fileBrowserUploadPath, staticResourcePath } from '@etherealengine/common/src/schema.type.module'
import { CommonKnownContentTypes } from '@etherealengine/common/src/utils/CommonKnownContentTypes'
import { AssetLoader } from '@etherealengine/engine/src/assets/classes/AssetLoader'
import { useFind } from '@etherealengine/engine/src/common/functions/FeathersHooks'
import { SceneState } from '@etherealengine/engine/src/ecs/classes/Scene'
import Checkbox from '@etherealengine/ui/src/primitives/mui/Checkbox'
import FormControlLabel from '@etherealengine/ui/src/primitives/mui/FormControlLabel'
import { SupportedFileTypes } from '../../../constants/AssetTypes'
import { inputFileWithAddToScene } from '../../../functions/assetFunctions'
import { bytesToSize, unique } from '../../../functions/utils'
import StringInput from '../../inputs/StringInput'
import { ToolButton } from '../../toolbar/ToolButton'
import { AssetSelectionChangePropsType } from '../AssetsPreviewPanel'
import ImageCompressionPanel from '../ImageCompressionPanel'
import ImageConvertPanel from '../ImageConvertPanel'
import ModelCompressionPanel from '../ModelCompressionPanel'
import styles from '../styles.module.scss'
import { FileBrowserItem, FileTableWrapper } from './FileBrowserGrid'
import { availableTableColumns, FilesViewModeSettings, FilesViewModeState } from './FileBrowserState'
import { FileDataType } from './FileDataType'
import { FilePropertiesPanel } from './FilePropertiesPanel'

export const FileIconType = {
  gltf: ViewInArIcon,
  'gltf-binary': ViewInArIcon,
  glb: ViewInArIcon,
  vrm: AccessibilityNewIcon,
  usdz: ViewInArIcon,
  fbx: ViewInArIcon,
  png: PhotoSizeSelectActualIcon,
  jpeg: PhotoSizeSelectActualIcon,
  jpg: PhotoSizeSelectActualIcon,
  ktx2: PhotoSizeSelectActualIcon,
  m3u8: VideocamIcon,
  mp4: VideocamIcon,
  mpeg: VolumeUpIcon,
  mp3: VolumeUpIcon,
  'model/gltf-binary': ViewInArIcon,
  'model/gltf': ViewInArIcon,
  'model/glb': ViewInArIcon,
  'model/vrm': AccessibilityNewIcon,
  'model/usdz': ViewInArIcon,
  'model/fbx': ViewInArIcon,
  'image/png': PhotoSizeSelectActualIcon,
  'image/jpeg': PhotoSizeSelectActualIcon,
  'image/jpg': PhotoSizeSelectActualIcon,
  'application/pdf': null,
  'application/vnd.apple.mpegurl': VideocamIcon,
  'video/mp4': VideocamIcon,
  'audio/mpeg': VolumeUpIcon,
  'audio/mp3': VolumeUpIcon
}

type FileBrowserContentPanelProps = {
  onSelectionChanged: (assetSelectionChange: AssetSelectionChangePropsType) => void
  disableDnD?: boolean
  selectedFile?: string
  folderName?: string
  nestingDirectory?: string
}

type DnDFileType = {
  dataTransfer: DataTransfer
  files: File[]
  items: DataTransferItemList
}

export type FileType = {
  fullName: string
  isFolder: boolean
  key: string
  name: string
  path: string
  size: string
  type: string
  url: string
}

const fileConsistsOfContentType = function (file: FileType, contentType: string): boolean {
  if (file.isFolder) {
    return contentType.startsWith('image')
  } else {
    const guessedType: string = CommonKnownContentTypes[file.type]
    return guessedType?.startsWith(contentType)
  }
}

export function isFileDataType(value: any): value is FileDataType {
  return value && value.key
}

/**
 * FileBrowserPanel used to render view for AssetsPanel.
 */
const FileBrowserContentPanel: React.FC<FileBrowserContentPanelProps> = (props) => {
  const { t } = useTranslation()

  const originalPath = `/${props.folderName || 'projects'}/${props.selectedFile ? props.selectedFile + '/' : ''}`
  const selectedDirectory = useHookstate(originalPath)
  const nestingDirectory = useHookstate(props.nestingDirectory || 'projects')
  const fileProperties = useHookstate<FileType | null>(null)
  const isLoading = useHookstate(true)

  const openProperties = useHookstate(false)
  const openCompress = useHookstate(false)
  const openConvert = useHookstate(false)
  const convertProperties = useHookstate<ImageConvertParms>(ImageConvertDefaultParms)

  const openConfirm = useHookstate(false)
  const contentToDeletePath = useHookstate('')

  const activeScene = useHookstate(getMutableState(SceneState).activeScene)

  const filesViewMode = useHookstate(getMutableState(FilesViewModeState).viewMode)
  const viewModeSettingsAnchorPosition = useHookstate({ left: 0, top: 0 })

  const fileState = useHookstate(getMutableState(FileBrowserState))
  const filesValue = fileState.files.attach(Downgraded).value
  const { skip, total, retrieving } = fileState.value

  let page = skip / FILES_PAGE_LIMIT
  const files = fileState.files.value.map((file) => {
    const isFolder = file.type === 'folder'
    const fullName = isFolder ? file.name : file.name + '.' + file.type

    return {
      ...file,
      size: file.size ? bytesToSize(file.size) : '0',
      path: isFolder ? file.key.split(file.name)[0] : file.key.split(fullName)[0],
      fullName,
      isFolder,
      Icon: FileIconType[file.type]
    }
  })

  useEffect(() => {
    if (filesValue) {
      isLoading.set(false)
    }
  }, [filesValue])

  useEffect(() => {
    refreshDirectory()
  }, [selectedDirectory, activeScene])

  const refreshDirectory = async () => {
    await FileBrowserService.fetchFiles(selectedDirectory.value, page)
  }

  const changeDirectoryByPath = (path: string) => {
    selectedDirectory.set(path)
    FileBrowserService.resetSkip()
  }

  const onSelect = (params: FileDataType) => {
    if (params.type !== 'folder') {
      props.onSelectionChanged({
        resourceUrl: params.url,
        name: params.name,
        contentType: params.type,
        size: params.size
      })
    } else {
      const newPath = `${selectedDirectory.value}${params.name}/`
      changeDirectoryByPath(newPath)
    }
  }

  const handlePageChange = async (_event, newPage: number) => {
    await FileBrowserService.fetchFiles(selectedDirectory.value, newPage)
  }

  const createNewFolder = async () => {
    await FileBrowserService.addNewFolder(`${selectedDirectory.value}New_Folder`)
    page = 0 // more efficient than requesting the files again
    await refreshDirectory()
  }

  const dropItemsOnPanel = async (data: FileDataType | DnDFileType, dropOn?: FileDataType) => {
    if (isLoading.value) return

    const path = dropOn?.isFolder ? dropOn.key : selectedDirectory.value

    if (isFileDataType(data)) {
      if (dropOn?.isFolder) {
        moveContent(data.fullName, data.fullName, data.path, path, false)
      }
    } else {
      isLoading.set(true)
      await Promise.all(
        data.files.map(async (file) => {
          const assetType = !file.type ? AssetLoader.getAssetType(file.name) : file.type
          if (!assetType) {
            // file is directory
            await FileBrowserService.addNewFolder(`${path}${file.name}`)
          } else {
            const name = processFileName(file.name)
            await uploadToFeathersService(fileBrowserUploadPath, [file], {
              fileName: name,
              path,
              contentType: file.type
            }).promise
          }
        })
      )
    }

    await refreshDirectory()
  }

  const onBackDirectory = () => {
    const pattern = /([^/]+)/g
    const result = selectedDirectory.value.match(pattern)
    if (!result || result.length === 1) return
    let newPath = '/'
    for (let i = 0; i < result.length - 1; i++) {
      newPath += result[i] + '/'
    }
    changeDirectoryByPath(newPath)
  }

  const moveContent = async (
    oldName: string,
    newName: string,
    oldPath: string,
    newPath: string,
    isCopy = false
  ): Promise<void> => {
    if (isLoading.value) return
    isLoading.set(true)
    await FileBrowserService.moveContent(oldName, newName, oldPath, newPath, isCopy)
    await refreshDirectory()
  }

  const handleConfirmDelete = (contentPath: string, type: string) => {
    contentToDeletePath.set(contentPath)

    openConfirm.set(true)
  }

  const handleConfirmClose = () => {
    contentToDeletePath.set('')

    openConfirm.set(false)
  }

  const deleteContent = async (): Promise<void> => {
    if (isLoading.value) return
    isLoading.set(true)
    openConfirm.set(false)
    await FileBrowserService.deleteContent(contentToDeletePath.value)
    props.onSelectionChanged({ resourceUrl: '', name: '', contentType: '', size: '' })
    await refreshDirectory()
  }

  const currentContentRef = useRef(null! as { item: FileDataType; isCopy: boolean })

  const showUploadAndDownloadButtons =
    selectedDirectory.value.slice(1).startsWith('projects/') &&
    !['projects', 'projects/'].includes(selectedDirectory.value.slice(1))
  const showBackButton = selectedDirectory.value !== originalPath

  const handleDownloadProject = async () => {
    const url = selectedDirectory.value
    const data = await Engine.instance.api
      .service(archiverPath)
      .get(null, { query: { directory: url } })
      .catch((err: Error) => {
        NotificationService.dispatchNotify(err.message, { variant: 'warning' })
        return null
      })
    if (!data) return
    const blob = await (await fetch(`${config.client.fileServer}/${data}`)).blob()

    let fileName: string
    if (selectedDirectory.value[selectedDirectory.value.length - 1] === '/') {
      fileName = selectedDirectory.value.split('/').at(-2) as string
    } else {
      fileName = selectedDirectory.value.split('/').at(-1) as string
    }

    saveAs(blob, fileName + '.zip')
  }

  const BreadcrumbItems = () => {
    const handleBreadcrumbDirectoryClick = (targetFolder: string) => {
      const pattern = /([^/]+)/g
      const result = selectedDirectory.value.match(pattern)
      if (!result) return
      let newPath = '/'
      for (const folder of result) {
        newPath += folder + '/'
        if (folder === targetFolder) {
          break
        }
      }
      changeDirectoryByPath(newPath)
    }
    let breadcrumbDirectoryFiles = selectedDirectory.value.slice(1, -1).split('/')

    const nestedIndex = breadcrumbDirectoryFiles.indexOf(nestingDirectory.value)

    breadcrumbDirectoryFiles = breadcrumbDirectoryFiles.filter((file, idx) => {
      return idx >= nestedIndex
    })

    return (
      <Breadcrumbs
        style={{}}
        maxItems={3}
        classes={{ separator: styles.separator, li: styles.breadcrumb, ol: styles.breadcrumbList }}
        separator="›"
      >
        {breadcrumbDirectoryFiles.map((file, index, arr) =>
          arr.length - 1 == index ? (
            <Typography key={file} style={{ fontSize: '0.9rem' }}>
              {file}
            </Typography>
          ) : (
            <Link
              underline="hover"
              key={file}
              color="#5d646c"
              style={{ fontSize: '0.9rem' }}
              onClick={() => handleBreadcrumbDirectoryClick(file)}
            >
              {file}
            </Link>
          )
        )}
      </Breadcrumbs>
    )
  }

  const searchText = useHookstate('')
  const validFiles = useHookstate<typeof files>([])

  useEffect(() => {
    validFiles.set(files.filter((file) => file.fullName.toLowerCase().includes(searchText.value.toLowerCase())))
  }, [searchText.value, fileState.files])

  const DropArea = () => {
    const [{ isFileDropOver }, fileDropRef] = useDrop({
      accept: [...SupportedFileTypes],
      drop: (dropItem) => dropItemsOnPanel(dropItem as any),
      collect: (monitor) => ({ isFileDropOver: monitor.isOver() })
    })

    const isListView = filesViewMode.value === 'list'
    const staticResourceData = useFind(staticResourcePath, {
      query: {
        key: {
          $in: isListView ? validFiles.value.map((file) => file.key) : []
        },
        $select: ['key', 'updatedAt'] as any,
        $limit: FILES_PAGE_LIMIT
      }
    })
    const staticResourceModifiedDates = useHookstate<Record<string, string>>({})

    useEffect(() => {
      const modifiedDates: Record<string, string> = {}
      staticResourceData.data.forEach((data) => {
        modifiedDates[data.key] = new Date(data.updatedAt).toLocaleString()
      })
      staticResourceModifiedDates.set(modifiedDates)
    }, [staticResourceData.data])

    return (
      <div
        ref={fileDropRef}
        className={styles.panelContainer}
        style={{ border: isFileDropOver ? '3px solid #ccc' : '' }}
      >
        <div className={styles.contentContainer}>
          <FileTableWrapper wrap={isListView}>
            <>
              {unique(validFiles.get(NO_PROXY), (file) => file.key).map((file, i) => (
                <FileBrowserItem
                  key={file.key}
                  item={file}
                  disableDnD={props.disableDnD}
                  onClick={onSelect}
                  moveContent={moveContent}
                  deleteContent={handleConfirmDelete}
                  currentContent={currentContentRef}
                  setOpenPropertiesModal={openProperties.set}
                  setFileProperties={fileProperties.set}
                  setOpenCompress={openCompress.set}
                  setOpenConvert={openConvert.set}
                  dropItemsOnPanel={dropItemsOnPanel}
                  isFilesLoading={isLoading}
                  addFolder={createNewFolder}
                  refreshDirectory={refreshDirectory}
                  isListView={isListView}
                  staticResourceModifiedDates={staticResourceModifiedDates.value}
                />
              ))}
            </>
          </FileTableWrapper>

          {total > 0 && validFiles.value.length < total && (
            <TablePagination
              className={styles.pagination}
              component="div"
              count={total}
              page={page}
              rowsPerPage={FILES_PAGE_LIMIT}
              rowsPerPageOptions={[]}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    )
  }

  const ViewModeSettings = () => {
    const viewModeSettings = useHookstate(getMutableState(FilesViewModeSettings))
    return (
      <>
        <ToolButton
          tooltip={t('editor:layout.filebrowser.view-mode.settings.name')}
          icon={SettingsIcon}
          onClick={(event) => viewModeSettingsAnchorPosition.set({ left: event.clientX, top: event.clientY })}
          id="viewSettings"
        />
        <Popover
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          anchorPosition={viewModeSettingsAnchorPosition.get(NO_PROXY)}
          open={!!viewModeSettingsAnchorPosition.left.value}
          onClose={() => viewModeSettingsAnchorPosition.set({ left: 0, top: 0 })}
          anchorReference="anchorPosition"
        >
          <div className={styles.viewModeSettings}>
            <div style={{ display: 'flex', width: '200px', flexDirection: 'column' }}>
              {filesViewMode.value === 'icons' ? (
                <InputSlider
                  sx={{ width: '100%', marginTop: '15px' }}
                  min={10}
                  max={100}
                  displaySliderLabel={true}
                  value={viewModeSettings.icons.iconSize.value}
                  onChange={viewModeSettings.icons.iconSize.set}
                  label={t('editor:layout.filebrowser.view-mode.settings.iconSize')}
                />
              ) : (
                <>
                  <InputSlider
                    sx={{ width: '100%', marginTop: '15px' }}
                    min={5}
                    max={30}
                    displaySliderLabel={true}
                    value={viewModeSettings.list.fontSize.value}
                    onChange={viewModeSettings.list.fontSize.set}
                    label={t('editor:layout.filebrowser.view-mode.settings.fontSize')}
                  />
                  <div>
                    <div style={{ marginTop: '1rem' }}>
                      <label>{t('editor:layout.filebrowser.view-mode.settings.select-listColumns')}</label>
                    </div>
                    <div>
                      {availableTableColumns.map((column) => (
                        <FormControlLabel
                          key={column}
                          classes={{
                            label: styles.viewModeSettingsLabel
                          }}
                          label={t(`editor:layout.filebrowser.table-list.headers.${column}`)}
                          control={
                            <Checkbox
                              style={{ color: 'var(--textColor)' }}
                              checked={viewModeSettings.list.selectedTableColumns[column].value}
                              onChange={(_, checked) => viewModeSettings.list.selectedTableColumns[column].set(checked)}
                            />
                          }
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Popover>
      </>
    )
  }

  const Header = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}
    >
      <span
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}
      >
        {showBackButton && (
          <ToolButton
            tooltip={t('editor:layout.filebrowser.back')}
            icon={ArrowBackIcon}
            onClick={onBackDirectory}
            id="backDir"
          />
        )}
        <ToolButton
          tooltip={t('editor:layout.filebrowser.refresh')}
          icon={AutorenewIcon}
          onClick={refreshDirectory}
          id="refreshDir"
        />
        <ViewModeSettings />
        <select
          value={filesViewMode.value}
          onChange={(event) => filesViewMode.set(event.target.value as 'icons' | 'list')}
          style={{
            all: 'unset',
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: 'var(--inputBackground)',
            lineHeight: 'normal',
            margin: '5px',
            padding: '5px',
            paddingTop: '7px',
            borderRadius: '10%',
            cursor: 'pointer'
          }}
        >
          <option value={'icons'}>{t('editor:layout.filebrowser.view-mode.icons')}</option>
          <option value={'list'}>{t('editor:layout.filebrowser.view-mode.list')}</option>
        </select>
      </span>
      <BreadcrumbItems />
      <span
        style={{
          display: 'flex',
          flexDirection: 'row-reverse',
          flexWrap: 'wrap'
        }}
      >
        <ToolButton
          tooltip={t('editor:layout.filebrowser.addNewFolder')}
          icon={CreateNewFolderIcon}
          onClick={createNewFolder}
          id="refreshDir"
        />
        {showUploadAndDownloadButtons && (
          <ToolButton
            tooltip={t('editor:layout.filebrowser.downloadProject')}
            onClick={handleDownloadProject}
            icon={DownloadIcon}
            id="downloadProject"
          />
        )}
        {showUploadAndDownloadButtons && (
          <ToolButton
            tooltip={t('editor:layout.filebrowser.uploadAsset')}
            onClick={() => {
              inputFileWithAddToScene({ directoryPath: selectedDirectory.value }).then(refreshDirectory)
            }}
            icon={AddIcon}
            id="uploadAsset"
          />
        )}
      </span>
    </div>
  )

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: 'var(--textColor)',
        fontFamily: 'var(--lato)',
        fontSize: '12px'
      }}
    >
      <Header />
      <div className={styles.searchContainer}>
        <StringInput
          placeholder={t('editor:layout.filebrowser.search-placeholder')}
          value={searchText.value}
          onChange={searchText.set}
        />
      </div>
      {retrieving && (
        <LoadingView
          className={styles.filesLoading}
          title={t('editor:layout.filebrowser.loadingFiles')}
          variant="body2"
        />
      )}
      <div id="file-browser-panel" style={{ overflowY: 'auto', height: '100%' }}>
        <DndWrapper id="file-browser-panel">
          <DropArea />
        </DndWrapper>
      </div>

      {openConvert.value && fileProperties.value && (
        <ImageConvertPanel
          openConvert={openConvert}
          fileProperties={fileProperties}
          convertProperties={convertProperties}
          onRefreshDirectory={refreshDirectory}
        />
      )}

      {openCompress.value && fileProperties.value && fileConsistsOfContentType(fileProperties.value, 'model') && (
        <ModelCompressionPanel
          openCompress={openCompress}
          fileProperties={fileProperties as any}
          onRefreshDirectory={refreshDirectory}
        />
      )}

      {openCompress.value && fileProperties.value && fileConsistsOfContentType(fileProperties.value, 'image') && (
        <ImageCompressionPanel
          openCompress={openCompress}
          fileProperties={fileProperties as any}
          onRefreshDirectory={refreshDirectory}
        />
      )}

      {openProperties.value && fileProperties.value && (
        <FilePropertiesPanel openProperties={openProperties} fileProperties={fileProperties} />
      )}
      <ConfirmDialog
        open={openConfirm.value}
        description={t('editor:dialog.delete.confirm-content', {
          content: contentToDeletePath.value.split('/').at(-1)
        })}
        onClose={handleConfirmClose}
        onSubmit={deleteContent}
      />
    </div>
  )
}

export default FileBrowserContentPanel
