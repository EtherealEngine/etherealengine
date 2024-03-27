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

import { DockLayout, DockMode, LayoutData, PanelData, TabData } from 'rc-dock'

import 'rc-dock/dist/rc-dock.css'

import React, { useEffect, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { RouterState } from '@etherealengine/client-core/src/common/services/RouterService'
import multiLogger from '@etherealengine/common/src/logger'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'

import Dialog from '@mui/material/Dialog'

import { NotificationService } from '@etherealengine/client-core/src/common/services/NotificationService'
import { SceneDataType, scenePath } from '@etherealengine/common/src/schema.type.module'
import { useQuery } from '@etherealengine/ecs/src/QueryFunctions'
import { SceneServices, SceneState } from '@etherealengine/engine/src/scene/Scene'
import { SceneAssetPendingTagComponent } from '@etherealengine/engine/src/scene/components/SceneAssetPendingTagComponent'
import CircularProgress from '@etherealengine/ui/src/primitives/mui/CircularProgress'
import { t } from 'i18next'
import { inputFileWithAddToScene } from '../functions/assetFunctions'
import { onNewScene, saveScene, setSceneInState } from '../functions/sceneFunctions'
import { cmdOrCtrlString } from '../functions/utils'
import { EditorErrorState } from '../services/EditorErrorServices'
import { EditorState } from '../services/EditorServices'
import { SelectionState } from '../services/SelectionServices'
import './EditorContainer.css'
import AssetDropZone from './assets/AssetDropZone'
import ImportSettingsPanel from './assets/ImportSettingsPanel'
import { ProjectBrowserPanelTab } from './assets/ProjectBrowserPanel'
import { SceneAssetsPanelTab } from './assets/SceneAssetsPanel'
import { ScenePanelTab } from './assets/ScenesPanel'
import { ControlText } from './controlText/ControlText'
import CopySceneDialog from './dialogs/CopySceneDialog'
import { DialogState } from './dialogs/DialogState'
import ErrorDialog from './dialogs/ErrorDialog'
import { ProgressDialog } from './dialogs/ProgressDialog'
import SaveNewSceneDialog from './dialogs/SaveNewSceneDialog'
import SaveSceneDialog from './dialogs/SaveSceneDialog'
import { DndWrapper } from './dnd/DndWrapper'
import DragLayer from './dnd/DragLayer'
import { PropertiesPanelTab } from './element/PropertiesPanel'
import { HierarchyPanelTab } from './hierarchy/HierarchyPanel'
import { MaterialLibraryPanelTab } from './materials/MaterialLibraryPanel'
import { ViewportPanelTab } from './panels/ViewportPanel'
import * as styles from './styles.module.scss'
import ToolBar from './toolbar/ToolBar'
import { VisualScriptPanelTab } from './visualScript/VisualScriptPanel'

const logger = multiLogger.child({ component: 'editor:EditorContainer' })

/**
 *component used as dock container.
 */
export const DockContainer = ({ children, id = 'editor-dock', dividerAlpha = 0 }) => {
  const dockContainerStyles = {
    '--dividerAlpha': dividerAlpha
  }

  return (
    <div id={id} className="dock-container" style={dockContainerStyles as React.CSSProperties}>
      {children}
    </div>
  )
}

const SceneLoadingProgress = () => {
  const sceneAssetPendingTagQuery = useQuery([SceneAssetPendingTagComponent])
  const loadingProgress = useHookstate(getMutableState(SceneState).loadingProgress).value
  return (
    <div style={{ top: '50px', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          height: '100%',
          width: '100%',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            // default values will be overridden by theme
            fontFamily: 'Lato',
            fontSize: '12px',
            color: 'white',
            padding: '16px'
          }}
        >
          {`Scene Loading... ${loadingProgress}% - ${sceneAssetPendingTagQuery.length} assets left`}
        </div>
        <CircularProgress />
      </div>
    </div>
  )
}

/**
 * Scene Event Handlers
 */

const onEditorError = (error) => {
  logger.error(error)
  if (error['aborted']) {
    DialogState.setDialog(null)
    return
  }

  DialogState.setDialog(
    <ErrorDialog
      title={error.title || t('editor:error')}
      message={error.message || t('editor:errorMsg')}
      error={error}
    />
  )
}

const onCloseProject = () => {
  const editorState = getMutableState(EditorState)
  const sceneState = getMutableState(SceneState)
  sceneState.sceneModified.set(false)
  editorState.projectName.set(null)
  editorState.sceneID.set(null)
  editorState.sceneName.set(null)
  RouterState.navigate('/studio')

  const parsed = new URL(window.location.href)
  const query = parsed.searchParams

  query.delete('project')
  query.delete('scenePath')

  parsed.search = query.toString()
  if (typeof history.pushState !== 'undefined') {
    window.history.replaceState({}, '', parsed.toString())
  }
}

const onSaveAs = async () => {
  const { projectName, sceneName } = getState(EditorState)
  const { sceneLoaded, sceneModified } = getState(SceneState)

  // Do not save scene if scene is not loaded or some error occured while loading the scene to prevent data lose
  if (!sceneLoaded) {
    DialogState.setDialog(<ErrorDialog title={t('editor:savingError')} message={t('editor:savingSceneErrorMsg')} />)
    return
  }

  const abortController = new AbortController()
  try {
    if (sceneName || sceneModified) {
      const result: { name: string } | void = await new Promise((resolve) => {
        DialogState.setDialog(
          <SaveNewSceneDialog initialName={Engine.instance.scene.name} onConfirm={resolve} onCancel={resolve} />
        )
      })
      DialogState.setDialog(null)
      if (result?.name && projectName) {
        await saveScene(projectName, result.name, abortController.signal)
        getMutableState(SceneState).sceneModified.set(false)
        const newSceneData = (await Engine.instance.api
          .service(scenePath)
          .get('', { query: { project: projectName, name: result.name, metadataOnly: true } })) as SceneDataType
        setSceneInState(newSceneData.scenePath)
      }
    }
  } catch (error) {
    logger.error(error)
    DialogState.setDialog(
      <ErrorDialog title={t('editor:savingError')} message={error?.message || t('editor:savingErrorMsg')} />
    )
  }
}

const onCopyScene = async () => {
  const { projectName, sceneName } = getState(EditorState)
  const abortController = new AbortController()
  const result = await new Promise((resolve) => {
    DialogState.setDialog(
      <CopySceneDialog
        currentSceneName={sceneName}
        currentProjectName={projectName}
        onConfirm={resolve}
        onCancel={resolve}
      />
    )
  })
  DialogState.setDialog(null)
  if (result?.name && result?.projectName) {
    await saveScene(result?.projectName, result.name, abortController.signal)
  }
}

const onImportSettings = () => {
  DialogState.setDialog(<ImportSettingsPanel />)
}

const onImportAsset = async () => {
  const { projectName } = getState(EditorState)

  if (projectName) {
    try {
      await inputFileWithAddToScene({ projectName })
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  }
}

const onSaveScene = async () => {
  const { projectName, sceneName } = getState(EditorState)
  const { sceneModified, sceneLoaded } = getState(SceneState)

  if (!projectName) return

  // Do not save scene if scene is not loaded or some error occured while loading the scene to prevent data lose
  if (!sceneLoaded) {
    DialogState.setDialog(<ErrorDialog title={t('editor:savingError')} message={t('editor:savingSceneErrorMsg')} />)
    return
  }

  if (!sceneName) {
    if (sceneModified) {
      onSaveAs()
    }
    return
  }

  const result = (await new Promise((resolve) => {
    DialogState.setDialog(<SaveSceneDialog onConfirm={resolve} onCancel={resolve} />)
  })) as any

  if (!result) {
    DialogState.setDialog(null)
    return
  }

  const abortController = new AbortController()

  DialogState.setDialog(
    <ProgressDialog
      message={t('editor:saving')}
      cancelable={true}
      onCancel={() => {
        abortController.abort()
        DialogState.setDialog(null)
      }}
    />
  )

  // Wait for 5ms so that the ProgressDialog shows up.
  await new Promise((resolve) => setTimeout(resolve, 5))

  try {
    await saveScene(projectName, sceneName, abortController.signal)

    getMutableState(SceneState).sceneModified.set(false)

    DialogState.setDialog(null)
  } catch (error) {
    logger.error(error)

    DialogState.setDialog(
      <ErrorDialog title={t('editor:savingError')} message={error.message || t('editor:savingErrorMsg')} />
    )
  }
}

const generateToolbarMenu = () => {
  return [
    {
      name: t('editor:menubar.newScene'),
      action: onNewScene
    },
    {
      name: t('editor:menubar.saveScene'),
      hotkey: `${cmdOrCtrlString}+s`,
      action: onSaveScene
    },
    {
      name: t('editor:menubar.saveAs'),
      action: onSaveAs
    },
    {
      name: t('editor:menubar.copyScene'),
      action: onCopyScene
    },
    {
      name: t('editor:menubar.importSettings'),
      action: onImportSettings
    },
    {
      name: t('editor:menubar.importAsset'),
      action: onImportAsset
    },
    {
      name: t('editor:menubar.quit'),
      action: onCloseProject
    }
  ]
}

const toolbarMenu = generateToolbarMenu()

//const defaultLayout: LayoutData = useHookstate(getMutableState(EditorState).panelLayout).value

const defaultLayout: LayoutData = {
  dockbox: {
    mode: 'horizontal' as DockMode,
    children: [
      {
        mode: 'vertical' as DockMode,
        size: 3,
        children: [
          {
            tabs: [ScenePanelTab, ProjectBrowserPanelTab, SceneAssetsPanelTab]
          }
        ]
      },
      {
        mode: 'vertical' as DockMode,
        size: 8,
        children: [
          {
            id: '+5',
            tabs: [ViewportPanelTab],
            size: 1
          }
        ]
      },
      {
        mode: 'vertical' as DockMode,
        size: 2,
        children: [
          {
            tabs: [HierarchyPanelTab, MaterialLibraryPanelTab]
          },
          {
            tabs: [PropertiesPanelTab, VisualScriptPanelTab]
          }
        ]
      }
    ]
  }
}

const tabs = [
  HierarchyPanelTab,
  PropertiesPanelTab,
  VisualScriptPanelTab,
  MaterialLibraryPanelTab,
  ViewportPanelTab,
  ProjectBrowserPanelTab,
  ScenePanelTab
]

/**
 * EditorContainer class used for creating container for Editor
 */
const EditorContainer = () => {
  const { sceneName, projectName, sceneID } = useHookstate(getMutableState(EditorState))
  const { sceneLoaded, sceneModified } = useHookstate(getMutableState(SceneState))
  const { scenes } = useHookstate(getMutableState(SceneState))

  const sceneLoading = sceneID.value && !sceneLoaded.value

  const errorState = useHookstate(getMutableState(EditorErrorState).error)

  const dialogComponent = useHookstate(getMutableState(DialogState).dialog).value
  const dockPanelRef = useRef<DockLayout>(null)

  const panelMenu = tabs.map((tab) => {
    return {
      name: tab.title,
      action: () => {
        const currentLayout = dockPanelRef?.current?.getLayout()
        if (!currentLayout) return
        if (dockPanelRef.current!.find(tab.id!)) {
          return
        }
        //todo: add support for multiple instances of a panel type
        // let panelId = panel.id!
        // while (dockPanelRef.current!.find(panelId)) {
        //   if (/\d+$/.test(panelId)) {
        //     panelId = panelId.replace(/\d+$/, (match) => {
        //       return (parseInt(match) + 1).toString()
        //     })
        //   } else {
        //     panelId += '1'
        //   }
        // }
        // panel.id = panelId
        const targetId = tab.parent!.id! ?? currentLayout.dockbox.children[0].id
        const targetPanel = dockPanelRef.current!.find(targetId) as PanelData
        targetPanel.tabs.push(tab)
        dockPanelRef?.current?.loadLayout(currentLayout)
      }
    }
  })

  useHotkeys(`${cmdOrCtrlString}+s`, () => onSaveScene() as any)

  useEffect(() => {
    if (!sceneModified.value) return
    const onBeforeUnload = (e) => {
      alert('You have unsaved changes. Please save before leaving.')
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [sceneModified])

  useEffect(() => {
    if (!sceneID.value) return
    return SceneServices.setCurrentScene(sceneID.value)
  }, [sceneID])

  useEffect(() => {
    return () => {
      getMutableState(SelectionState).selectedEntities.set([])
    }
  }, [sceneID])

  useEffect(() => {
    if (!sceneID.value) return
    const scene = getState(SceneState).scenes[sceneID.value]
    if (!scene) return
    sceneName.set(scene.name)
    projectName.set(scene.project)
  }, [sceneID.value, scenes.keys])

  useEffect(() => {
    if (!dockPanelRef.current) return
    const activePanel = sceneLoaded.value ? 'filesPanel' : 'scenePanel'
    dockPanelRef.current.updateTab(activePanel, dockPanelRef.current.find(activePanel) as TabData, true)
  }, [sceneLoaded])

  useEffect(() => {
    if (errorState.value) {
      onEditorError(errorState.value)
    }
  }, [errorState])

  return (
    <>
      <div
        id="editor-container"
        className={styles.editorContainer}
        style={sceneID.value ? { background: 'transparent' } : {}}
      >
        <DndWrapper id="editor-container">
          <DragLayer />
          <ToolBar menu={toolbarMenu} panels={panelMenu} />
          <ControlText />
          {sceneLoading && <SceneLoadingProgress />}
          <div className={styles.workspaceContainer}>
            <AssetDropZone />
            <DockContainer>
              <DockLayout
                ref={dockPanelRef}
                defaultLayout={defaultLayout}
                style={{ position: 'absolute', left: 5, top: 55, right: 5, bottom: 5 }}
              />
            </DockContainer>
          </div>
          <Dialog
            open={!!dialogComponent}
            onClose={() => DialogState.setDialog(null)}
            classes={{ root: styles.dialogRoot, paper: styles.dialogPaper }}
          >
            {getState(DialogState).dialog}
          </Dialog>
        </DndWrapper>
      </div>
    </>
  )
}

export default EditorContainer
