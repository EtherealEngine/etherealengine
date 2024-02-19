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

import { t } from 'i18next'
import React, { useEffect, useState } from 'react'

import Button from '@etherealengine/client-core/src/common/components/Button'
import Menu from '@etherealengine/client-core/src/common/components/Menu'
import { none, State, useHookstate } from '@etherealengine/hyperflux'
import CircularProgress from '@etherealengine/ui/src/primitives/mui/CircularProgress'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import BooleanInput from '../inputs/BooleanInput'
import InputGroup from '../inputs/InputGroup'
import styles from './styles.module.scss'

import { FileBrowserService } from '@etherealengine/client-core/src/common/services/FileBrowserService'
import { modelTransformPath } from '@etherealengine/common/src/schema.type.module'
import { setComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import {
  DefaultModelTransformParameters as defaultParams,
  ModelTransformParameters
} from '@etherealengine/engine/src/assets/classes/ModelTransform'
import { transformModel as clientSideTransformModel } from '@etherealengine/engine/src/assets/compression/ModelTransformFunctions'
import { ModelComponent } from '@etherealengine/engine/src/scene/components/ModelComponent'
import { VariantComponent } from '@etherealengine/engine/src/scene/components/VariantComponent'
import { createSceneEntity } from '@etherealengine/engine/src/scene/functions/createSceneEntity'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import exportGLTF from '../../functions/exportGLTF'

import { removeEntityNodeRecursively } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { Box, ListItemButton, ListItemText, MenuItem, Modal, PopoverPosition } from '@mui/material'
import { LODList, LODVariantDescriptor } from '../../constants/GLTFPresets'
import { ContextMenu } from '../layout/ContextMenu'
import { List, ListItem } from '../layout/List'
import GLTFTransformProperties from '../properties/GLTFTransformProperties'
import { FileType } from './FileBrowser/FileBrowserContentPanel'

export const createLODVariants = async (
  lods: LODVariantDescriptor[],
  clientside: boolean,
  heuristic: 'DISTANCE' | 'SCENE_SCALE' | 'MANUAL' | 'DEVICE',
  exportCombined = false
) => {
  const lodVariantParams: ModelTransformParameters[] = lods.map((lod) => ({
    ...lod.params
  }))

  for (const variant of lodVariantParams) {
    if (clientside) {
      await clientSideTransformModel(variant)
    } else {
      await Engine.instance.api.service(modelTransformPath).create(variant)
    }
  }

  if (exportCombined) {
    const result = createSceneEntity('container')
    setComponent(result, ModelComponent)
    const variant = createSceneEntity('LOD Variant', result)
    setComponent(variant, ModelComponent)
    setComponent(variant, VariantComponent, {
      levels: lods
        .map((lod, lodIndex) =>
          lod.variantMetadata.map((metadata) => ({
            src: lod.params.dst,
            metadata
          }))
        )
        .flat(),
      heuristic
    })

    await exportGLTF(result, lods[0].params.src.replace(/\.[^.]*$/, `-integrated.gltf`))
    removeEntityNodeRecursively(result)
  }
}

export default function ModelCompressionPanel({
  openCompress,
  fileProperties,
  onRefreshDirectory
}: {
  openCompress: State<boolean>
  fileProperties: State<FileType>
  onRefreshDirectory: () => Promise<void>
}) {
  const [compressionLoading, setCompressionLoading] = useState<boolean>(false)
  const [isClientside, setIsClientSide] = useState<boolean>(true)
  const [isIntegratedPrefab, setIsIntegratedPrefab] = useState<boolean>(true)
  const [selectedLODIndex, setSelectedLODIndex] = useState<number>(0)
  const [variantSelectedLODIndex, setVariantSelectedLODIndex] = useState<number>(0)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [selectedPreset, setSelectedPreset] = useState<ModelTransformParameters>(defaultParams)
  const [presetList, setPresetList] = useState<LODVariantDescriptor[]>(LODList)

  useEffect(() => {
    const presets = localStorage.getItem('presets')
    if (presets !== null) {
      setPresetList(JSON.parse(presets))
    }
  }, [])

  const lods = useHookstate<LODVariantDescriptor[]>([])

  const compressContentInBrowser = async () => {
    setCompressionLoading(true)
    await compressModel()
    await onRefreshDirectory()
    setCompressionLoading(false)
    openCompress.set(false)
  }

  const applyPreset = (preset: ModelTransformParameters) => {
    setSelectedPreset(preset)
    setModalOpen(true)
  }

  const confirmPreset = () => {
    const lastSuffix = lods[selectedLODIndex].suffix.value
    const nextSuffix = `-${selectedPreset.dst.replace(/\s/g, '').toLowerCase()}`
    lods[selectedLODIndex].suffix.set(nextSuffix)

    const params = lods[selectedLODIndex].params
    let newDST = params.dst.value
    if (lastSuffix != null) {
      newDST = newDST.replace(new RegExp(lastSuffix + '$'), '')
    }
    newDST += nextSuffix
    params.dst.set(newDST)
    params.maxTextureSize.set(selectedPreset.maxTextureSize)
    setModalOpen(false)
  }

  const savePresetList = (deleting: boolean) => {
    if (!deleting) {
      setPresetList([...presetList, lods[selectedLODIndex].value])
    }
    localStorage.setItem('presets', JSON.stringify(presetList))
  }

  const compressModel = async () => {
    const modelSrc = fileProperties.url.value
    const clientside = isClientside
    const exportCombined = isIntegratedPrefab

    const heuristic = 'DEVICE'
    await createLODVariants(lods.value, clientside, heuristic, exportCombined)

    const [_, directoryToRefresh, __] = /.*\/(projects\/.*)\/([\w\d\s\-_.]*)$/.exec(modelSrc)!
    await FileBrowserService.fetchFiles(directoryToRefresh)
  }

  const deletePreset = (idx: number) => {
    const newList = [...presetList]
    newList.splice(idx, 1)
    setPresetList(newList)
  }

  useEffect(() => {
    const fullSrc = fileProperties.url.value
    const fileName = fullSrc.split('/').pop()!.split('.').shift()!

    const defaultLODParams: ModelTransformParameters = {
      ...defaultParams,
      src: fullSrc,
      modelFormat: fileProperties.url.value.endsWith('.gltf')
        ? 'gltf'
        : fileProperties.url.value.endsWith('.vrm')
        ? 'vrm'
        : 'glb'
    }

    lods.set(
      ['Desktop - Medium', 'Mobile - Low', 'XR - Medium']
        .map((dst) => LODList.find((preset) => preset.params.dst === dst)!)
        .map((preset): LODVariantDescriptor => {
          const suffix = `-${preset.params.dst.replace(/\s/g, '').toLowerCase()}`
          return {
            params: {
              ...defaultLODParams,
              dst: fileName + suffix,
              maxTextureSize: preset.params.maxTextureSize
            },
            suffix,
            variantMetadata: [variantMetadataPresets.get(preset.params.dst.split(' ')[0].toUpperCase()!)!]
          }
        })
    )
  }, [fileProperties.url])

  const handleLODSelect = (index) => {
    setSelectedLODIndex(index)
  }

  const handleLODDelete = (index) => {
    lods[index].set(none)
    setSelectedLODIndex(Math.min(selectedLODIndex, lods.length - 1))
  }

  const handleLODAdd = () => {
    lods.merge([
      {
        params: JSON.parse(JSON.stringify(lods[selectedLODIndex].params.value)),
        suffix: lods[selectedLODIndex].suffix.value,
        variantMetadata: []
      }
    ])
    setSelectedLODIndex(lods.length - 1)
  }

  const handleVariantMetadataDelete = (lodIndex, metadataIndex) => {
    lods[lodIndex].variantMetadata[metadataIndex].set(none)
  }

  const handleVariantMetadataAdd = (lodIndex, variantMetadata: Record<string, any>) => {
    lods[lodIndex].variantMetadata.merge([variantMetadata])
  }

  const variantMetadataPresets: Map<string, Record<string, any>> = new Map([
    ['DESKTOP', { device: 'DESKTOP' }],
    ['XR', { device: 'XR' }],
    ['MOBILE', { device: 'MOBILE' }]
  ])

  const [anchorPosition, setAnchorPosition] = React.useState<undefined | PopoverPosition>(undefined)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const showVariantMetadataMenu = (event, lodIndex) => {
    setVariantSelectedLODIndex(lodIndex)
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

  return (
    <Menu
      open={openCompress.value}
      onClose={() => openCompress.set(false)}
      showCloseButton={true}
      maxWidth={'lg'}
      header={fileProperties.value.name}
      actions={
        <>
          {!compressionLoading ? (
            <Button type="gradient" className={styles.horizontalCenter} onClick={compressContentInBrowser}>
              {t('editor:properties.model.transform.compress') as string}
            </Button>
          ) : (
            <CircularProgress style={{ margin: '1rem auto' }} className={styles.horizontalCenter} />
          )}
        </>
      }
    >
      <div className={styles.modelMenu}>
        <Box>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={styles.headerContainer}>LOD Levels</div>
            <List>
              {lods.map((lod, lodIndex) => (
                <ListItem>
                  <ListItemButton
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start'
                    }}
                    selected={selectedLODIndex === lodIndex}
                    onClick={() => handleLODSelect(lodIndex)}
                  >
                    <ListItemText
                      primary={`LOD Level ${lodIndex}`}
                      secondary={lod.params.dst.value}
                      style={{ color: 'white' }}
                    />
                    <List>
                      {lod.variantMetadata.map((metadata, metadataIndex) => (
                        <ListItem>
                          <ListItemButton>
                            {' '}
                            <ListItemText
                              style={{ fontSize: '0.5rem' }}
                              primary={Object.entries(metadata.value)
                                .map((a) => a.join(': '))
                                .join(', ')}
                            />
                          </ListItemButton>
                          <IconButton
                            onClick={() => handleVariantMetadataDelete(lodIndex, metadataIndex)}
                            icon={<Icon type="Close" style={{ color: 'var(--iconButtonColor)' }} />}
                          ></IconButton>
                        </ListItem>
                      ))}
                    </List>
                    <IconButton
                      onClick={(event) => showVariantMetadataMenu(event, lodIndex)}
                      icon={<Icon type="Add" style={{ color: 'var(--iconButtonColor)' }} />}
                    ></IconButton>
                  </ListItemButton>
                  {lods.length > 1 && (
                    <IconButton
                      onClick={() => handleLODDelete(lodIndex)}
                      icon={<Icon type="Delete" style={{ color: 'var(--iconButtonColor)' }} />}
                    ></IconButton>
                  )}
                </ListItem>
              ))}
            </List>
            <ContextMenu open={open} anchorEl={anchorEl} anchorPosition={anchorPosition} onClose={handleClose}>
              {Array.from(variantMetadataPresets.entries()).map(([label, value]) => (
                <MenuItem
                  onClick={() => {
                    handleVariantMetadataAdd(variantSelectedLODIndex, value)
                    handleClose()
                  }}
                >
                  {label}
                </MenuItem>
              ))}
            </ContextMenu>
            <div>
              <IconButton
                onClick={() => handleLODAdd()}
                icon={<Icon type="Add" style={{ color: 'var(--iconButtonColor)' }} />}
              ></IconButton>
            </div>
          </div>
        </Box>
        <Box>
          <InputGroup name="fileType" label={fileProperties.value?.isFolder ? 'Directory' : 'File'}>
            <Typography variant="body2">{t('editor:properties.model.transform.compress') as string}</Typography>
          </InputGroup>
          <>
            <GLTFTransformProperties transformParms={lods[selectedLODIndex].params} onChange={() => {}} />
            <InputGroup name="Clientside Transform" label="Clientside Transform">
              <BooleanInput
                value={
                  true
                  // isClientside.value
                }
                onChange={(val: boolean) => {
                  // isClientside.set(val)
                }}
                disabled={true}
              />
            </InputGroup>
            <InputGroup name="Generate Integrated Variant Prefab" label="Generate Integrated Variant Prefab">
              <BooleanInput
                value={isIntegratedPrefab}
                onChange={(val: boolean) => {
                  setIsIntegratedPrefab(val)
                }}
              />
            </InputGroup>
          </>
        </Box>
        <Box className={styles.presetBox}>
          <Typography className={styles.presetHeader} align="center">
            LOD Presets
          </Typography>
          <Box display="flex" alignItems="center">
            <List>
              {presetList.map((lodItem: LODVariantDescriptor, idx) => (
                <Box>
                  <ListItemButton className={styles.presetButton} onClick={() => applyPreset(lodItem.params)}>
                    <ListItemText>{lodItem.params.dst}</ListItemText>
                  </ListItemButton>
                  {!LODList.find((l) => l.params.dst === lodItem.params.dst) && (
                    <ListItemButton onClick={() => deletePreset(idx)}>x</ListItemButton>
                  )}
                </Box>
              ))}
            </List>
          </Box>
          <Button onClick={() => savePresetList(false)}>Save Preset</Button>
        </Box>
      </div>
      <Modal open={modalOpen}>
        <Box className={styles.confirmModal}>
          <Typography>Would you like to apply this preset?</Typography>
          <Typography>{selectedPreset.dst}</Typography>
          <Box className={styles.confirmModalButtons}>
            <Button onClick={() => confirmPreset()}>Yes</Button>
            <Button onClick={() => setModalOpen(false)}>Close</Button>
          </Box>
        </Box>
      </Modal>
    </Menu>
  )
}
