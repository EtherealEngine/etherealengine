import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { areEqual, FixedSizeList } from 'react-window'
import { MeshBasicMaterial } from 'three'

import exportMaterialsGLTF from '@xrengine/engine/src/assets/functions/exportMaterialsGLTF'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { materialFromId, registerMaterial } from '@xrengine/engine/src/renderer/materials/functions/Utilities'
import { MaterialLibrary } from '@xrengine/engine/src/renderer/materials/MaterialLibrary'
import { useHookEffect, useHookstate, useState } from '@xrengine/hyperflux'

import { Divider, Grid, Stack } from '@mui/material'

import { executeCommandWithHistory } from '../../classes/History'
import EditorCommands from '../../constants/EditorCommands'
import { uploadProjectFiles } from '../../functions/assetFunctions'
import { useEditorState } from '../../services/EditorServices'
import { useSelectionState } from '../../services/SelectionServices'
import { HeirarchyTreeCollapsedNodeType } from '../hierarchy/HeirarchyTreeWalker'
import styles from '../hierarchy/styles.module.scss'
import { Button } from '../inputs/Button'
import MaterialLibraryEntry, { MaterialLibraryEntryType } from './MaterialLibraryEntry'

export default function MaterialLibraryPanel() {
  const { t } = useTranslation()
  const editorState = useEditorState()
  const selectionState = useSelectionState()
  const MemoMatLibEntry = memo(MaterialLibraryEntry, areEqual)

  const nodeChanges = useHookstate(0)
  const createNodes = useCallback(() => {
    const result = [...MaterialLibrary.materials.values()].map(({ material, prototype, src }) => ({
      uuid: material.uuid,
      material,
      prototype,
      source: src,
      selected: selectionState.selectedEntities.value.some(
        (selectedEntity) => typeof selectedEntity === 'string' && selectedEntity === material.uuid
      ),
      active: selectionState.selectedEntities.value.at(selectionState.selectedEntities.length - 1) === material.uuid
    }))
    return result
  }, [])

  const nodes = useHookstate(createNodes())

  const onClick = useCallback((e: MouseEvent, node: MaterialLibraryEntryType) => {
    if (!editorState.lockPropertiesPanel.get()) {
      executeCommandWithHistory({
        type: EditorCommands.REPLACE_SELECTION,
        affectedNodes: [node.material.uuid]
      })
    }
  }, [])

  useHookEffect(() => {
    nodes.set(createNodes())
  }, [nodeChanges, selectionState.selectedEntities])

  return (
    <>
      <div className={styles.panelContainer}>
        <div className={styles.panelSection} style={{ height: 'auto' }}>
          <Grid container spacing={1} columns={16}>
            <Grid item xs={1}></Grid>
            <Grid item xs={3}>
              <b>Name</b>
            </Grid>
            <Grid item xs={3}>
              <b>Prototype</b>
            </Grid>
            <Grid item xs={3}>
              <b>Source</b>
            </Grid>
            <Grid item xs={3}>
              <b>Uuid</b>
            </Grid>
          </Grid>
          <div className={styles.divider} />
        </div>
        <div className={styles.panelSection}>
          <AutoSizer>
            {({ width, height }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemSize={32}
                itemCount={nodes.length}
                itemData={{
                  nodes: nodes.get(),
                  onClick
                }}
                itemKey={(index, _) => index}
                innerElementType="ul"
              >
                {MemoMatLibEntry}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
        <div className={styles.panelSection} style={{ height: 'auto', padding: '8px' }}>
          <div className={styles.divider} />
          <Stack direction={'column'} spacing={2}>
            <Button
              onClick={() => {
                registerMaterial(new MeshBasicMaterial(), { path: '', type: 'Editor Session' })
                nodeChanges.set(nodeChanges.get() + 1)
              }}
            >
              New
            </Button>
            <Button
              onClick={async () => {
                const materials = selectionState.selectedEntities
                  .filter(
                    (selected) => typeof selected.value === 'string' && MaterialLibrary.materials.has(selected.value)
                  )
                  .map((selected) => materialFromId(selected.value as string))
                const gltf = (await exportMaterialsGLTF(materials, {
                  binary: false,
                  path: 'material-test.gltf'
                })!) as /*ArrayBuffer*/ { [key: string]: any }
                const pName = editorState.projectName.value!
                const blob = [JSON.stringify(gltf)]
                const file = new File(blob, 'material-test.gltf')
                /*const pName = editorState.projectName.value!
                const blob = [gltf]
                const file = new File(blob, "material-test.glb")*/
                const urls = await Promise.all(uploadProjectFiles(pName, [file], true).promises)
                console.log('exported material data to ', ...urls)
              }}
            >
              Save
            </Button>
          </Stack>
        </div>
      </div>
    </>
  )
}
