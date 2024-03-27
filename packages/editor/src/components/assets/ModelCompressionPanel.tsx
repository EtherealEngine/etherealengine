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
import { getState, NO_PROXY, State, useHookstate } from '@etherealengine/hyperflux'
import CircularProgress from '@etherealengine/ui/src/primitives/mui/CircularProgress'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import BooleanInput from '../inputs/BooleanInput'
import InputGroup from '../inputs/InputGroup'
import styles from './styles.module.scss'

import { FileBrowserService } from '@etherealengine/client-core/src/common/services/FileBrowserService'
import { modelTransformPath } from '@etherealengine/common/src/schema.type.module'
import { getComponent, hasComponent, setComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import {
  DefaultModelTransformParameters as defaultParams,
  ModelTransformParameters
} from '@etherealengine/engine/src/assets/classes/ModelTransform'
import { transformModel as clientSideTransformModel } from '@etherealengine/engine/src/assets/compression/ModelTransformFunctions'
import { ModelComponent } from '@etherealengine/engine/src/scene/components/ModelComponent'
import { Heuristic, VariantComponent } from '@etherealengine/engine/src/scene/components/VariantComponent'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import exportGLTF from '../../functions/exportGLTF'

import { createEntity, Entity, generateEntityUUID, UndefinedEntity, UUIDComponent } from '@etherealengine/ecs'
import { SourceComponent } from '@etherealengine/engine/src/scene/components/SourceComponent'
import { proxifyParentChildRelationships } from '@etherealengine/engine/src/scene/functions/loadGLTFModel'
import { TransformComponent } from '@etherealengine/spatial'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { addObjectToGroup } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { Object3DComponent } from '@etherealengine/spatial/src/renderer/components/Object3DComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import {
  EntityTreeComponent,
  removeEntityNodeRecursively
} from '@etherealengine/spatial/src/transform/components/EntityTree'
import { Box, List, ListItem, ListItemButton, ListItemText, Modal } from '@mui/material'
import { Group, LoaderUtils } from 'three'
import { defaultLODs, LODList, LODVariantDescriptor } from '../../constants/GLTFPresets'
import { EditorState } from '../../services/EditorServices'
import GLTFTransformProperties from '../properties/GLTFTransformProperties'
import { FileType } from './FileBrowser/FileBrowserContentPanel'

const createTempEntity = (name: string, parentEntity: Entity = UndefinedEntity): Entity => {
  const entity = createEntity()
  setComponent(entity, NameComponent, name)
  setComponent(entity, VisibleComponent)
  setComponent(entity, TransformComponent)
  setComponent(entity, EntityTreeComponent, { parentEntity })

  let sceneID = getState(EditorState).sceneID!
  if (hasComponent(parentEntity, SourceComponent)) {
    sceneID = getComponent(parentEntity, SourceComponent)
  }
  setComponent(entity, SourceComponent, sceneID)

  const uuid = generateEntityUUID()
  setComponent(entity, UUIDComponent, uuid)

  // These additional properties and relations are required for
  // the current GLTF exporter to successfully generate a GLTF.
  const obj3d = new Group()
  obj3d.entity = entity
  addObjectToGroup(entity, obj3d)
  proxifyParentChildRelationships(obj3d)
  setComponent(entity, Object3DComponent, obj3d)

  return entity
}

export const createLODVariants = async (
  lods: LODVariantDescriptor[],
  clientside: boolean,
  heuristic: Heuristic,
  exportCombined = false
) => {
  const lodVariantParams: ModelTransformParameters[] = lods.map((lod) => ({
    ...lod.params
  }))

  const transformMetadata = [] as Record<string, any>[]
  for (const [i, variant] of lodVariantParams.entries()) {
    if (clientside) {
      await clientSideTransformModel(variant, (key, data) => {
        if (!transformMetadata[i]) transformMetadata[i] = {}
        transformMetadata[i][key] = data
      })
    } else {
      await Engine.instance.api.service(modelTransformPath).create(variant)
    }
  }

  if (exportCombined) {
    const modelSrc = `${LoaderUtils.extractUrlBase(lods[0].params.src)}${lods[0].params.dst}.${
      lods[0].params.modelFormat
    }`
    const result = createTempEntity('container')
    setComponent(result, ModelComponent)
    const variant = createTempEntity('LOD Variant', result)
    setComponent(variant, ModelComponent, { src: modelSrc })
    setComponent(variant, VariantComponent, {
      levels: lods.map((lod, lodIndex) => {
        return {
          src: `${LoaderUtils.extractUrlBase(lod.params.src)}${lod.params.dst}.${lod.params.modelFormat}`,
          metadata: {
            ...lod.variantMetadata,
            ...transformMetadata[lodIndex]
          }
        }
      }),
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
    const lod = lods[selectedLODIndex].get(NO_PROXY)
    const src = lod.params.src
    const dst = lod.params.dst
    const modelFormat = lod.params.modelFormat
    const uri = lod.params.resourceUri

    const presetParams = JSON.parse(JSON.stringify(selectedPreset)) as ModelTransformParameters
    presetParams.src = src
    presetParams.dst = dst
    presetParams.modelFormat = modelFormat
    presetParams.resourceUri = uri

    lods[selectedLODIndex].params.set(presetParams)

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

    const heuristic = Heuristic.BUDGET
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

    const defaults = defaultLODs.map((defaultLOD) => {
      const lod = JSON.parse(JSON.stringify(defaultLOD)) as LODVariantDescriptor
      lod.params.src = fullSrc
      lod.params.dst = fileName + lod.suffix
      lod.params.modelFormat = fullSrc.endsWith('.gltf') ? 'gltf' : fullSrc.endsWith('.vrm') ? 'vrm' : 'glb'
      lod.params.resourceUri = ''
      return lod
    })

    lods.set(defaults)
  }, [fileProperties.url])

  const handleLODSelect = (index) => {
    setSelectedLODIndex(Math.min(index, lods.length - 1))
  }

  const handleLODAdd = () => {
    const params = JSON.parse(JSON.stringify(lods[selectedLODIndex].params.value)) as ModelTransformParameters
    const suffix = '-LOD' + lods.length
    params.dst = params.dst.replace(lods[selectedLODIndex].suffix.value, suffix)
    lods.merge([
      {
        params: params,
        suffix: suffix,
        variantMetadata: {}
      }
    ])
    setSelectedLODIndex(lods.length - 1)
  }

  const handleLodRemove = () => {
    lods.set((lods) => {
      lods.pop()
      return lods
    })
    setSelectedLODIndex(Math.min(selectedLODIndex, lods.length - 1))
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
                <ListItem key={lodIndex}>
                  <ListItemButton
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'start'
                    }}
                    selected={selectedLODIndex === lodIndex}
                    onClick={() => handleLODSelect(lodIndex)}
                  >
                    <ListItemText primary={`LOD Level ${lodIndex}`} style={{ color: 'white' }} />
                    {lods.length > 1 && lodIndex == lods.length - 1 && (
                      <IconButton
                        onClick={handleLodRemove}
                        icon={<Icon type="Close" style={{ color: 'var(--iconButtonColor)' }} />}
                      ></IconButton>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
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
                <Box key={idx}>
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
