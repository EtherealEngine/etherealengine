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

import styles from '@etherealengine/editor/src/components/layout/styles.module.scss'
import { AssetLoader } from '@etherealengine/engine/src/assets/classes/AssetLoader'
import createReadableTexture from '@etherealengine/engine/src/assets/functions/createReadableTexture'
import { MaterialLibraryState } from '@etherealengine/engine/src/renderer/materials/MaterialLibrary'
import { BoolArg, FloatArg } from '@etherealengine/engine/src/renderer/materials/constants/DefaultArgs'
import { LibraryEntryType } from '@etherealengine/engine/src/renderer/materials/constants/LibraryEntry'
import {
  changeMaterialPrototype,
  entryId,
  materialFromId,
  prototypeFromId
} from '@etherealengine/engine/src/renderer/materials/functions/MaterialLibraryFunctions'
import { removeMaterialPlugin } from '@etherealengine/engine/src/renderer/materials/functions/MaterialPluginFunctions'
import { State, getMutableState, getState, none, useState } from '@etherealengine/hyperflux'
import React, { useCallback, useEffect } from 'react'
import { Material, Texture } from 'three'

import { Box, Divider, Stack } from '@mui/material'

import { EditorControlFunctions } from '../../functions/EditorControlFunctions'
import { SelectionState } from '../../services/SelectionServices'
import { Button } from '../inputs/Button'
import { InputGroup } from '../inputs/InputGroup'
import ParameterInput from '../inputs/ParameterInput'
import SelectInput from '../inputs/SelectInput'
import StringInput from '../inputs/StringInput'
import PaginatedList from '../layout/PaginatedList'

type ThumbnailData = {
  src: string
  blob: string
}

const toBlobs = (thumbnails: Record<string, ThumbnailData>): Record<string, string> => {
  const blobs = {}
  Object.entries(thumbnails).map(([k, { blob }]) => {
    blobs[k] = blob
  })
  return blobs
}

export default function MaterialEditor({ material, ...rest }: { material: Material }) {
  if (material === undefined) return <></>
  const materialLibrary = useState(getMutableState(MaterialLibraryState))
  const materialComponent = materialLibrary.materials[material.uuid]
  let prototypeComponent = materialLibrary.prototypes[materialComponent.prototype.value].value

  const loadingData = useState(false)
  const prototypes = Object.values(materialLibrary.prototypes.value).map((prototype) => ({
    label: prototype.prototypeId,
    value: prototype.prototypeId
  }))
  const thumbnails = useState<Record<string, ThumbnailData>>({})

  const createThumbnail = async (field: string, texture: Texture) => {
    if (texture?.isTexture) {
      try {
        const blob: string = (await createReadableTexture(texture, {
          maxDimensions: { width: 256, height: 256 },
          url: true
        })) as string
        const thumbData: ThumbnailData = {
          src: texture.image?.src ?? 'BLOB',
          blob
        }
        thumbnails[field].set(thumbData)
        return Promise.resolve()
      } catch (e) {
        console.warn('failed loading thumbnail: ' + e)
      }
    }
  }

  const createThumbnails = async () => {
    const promises = Object.entries(material).map(([field, texture]: [string, Texture]) =>
      createThumbnail(field, texture)
    )
    return Promise.all(promises)
  }

  const checkThumbs = async () => {
    thumbnails.promised && (await thumbnails.promise)
    const thumbnailVals = thumbnails.value
    Object.entries(thumbnailVals).map(([k, { blob }]) => {
      if (!material[k]) {
        URL.revokeObjectURL(blob)
        thumbnails[k].set(none)
      }
    })
    loadingData.set(true)
    await Promise.all(
      Object.entries(material).map(async ([field, texture]: [string, Texture]) => {
        if (texture?.isTexture) {
          if (!thumbnails[field]?.value || thumbnails[field]?.value?.src !== texture.image?.src)
            await createThumbnail(field, texture)
        }
      })
    )
    loadingData.set(false)
  }

  const clearThumbs = useCallback(async () => {
    Object.values(thumbnails.value).map(({ blob }) => URL.revokeObjectURL(blob))
    thumbnails.set({})
  }, [])

  useEffect(() => {
    loadingData.set(true)
    clearThumbs()
      .then(createThumbnails)
      .then(() => {
        loadingData.set(false)
      })
  }, [materialComponent.prototype, materialComponent.material.uuid])

  useEffect(() => {
    if (loadingData.value) return
    checkThumbs()
  }, [materialComponent.parameters, materialComponent.material])

  const selectedPlugin = useState('vegetation')

  return (
    <div {...rest}>
      <InputGroup name="Name" label="Name">
        <StringInput value={materialComponent.material.name.value} onChange={materialComponent.material.name.set} />
      </InputGroup>
      <InputGroup name="Source" label="Source">
        <div className={styles.contentContainer}>
          <Box className="Box" sx={{ padding: '8px', overflow: 'scroll' }}>
            <Stack className="Stack" spacing={2} direction="column" alignContent={'center'}>
              <Stack className="Stack" spacing={2} direction="row" alignContent={'flex-start'}>
                <div>
                  <label>Type:</label>
                </div>
                <div>{materialComponent.src.type.value}</div>
              </Stack>
              <Stack className="Stack" spacing={2} direction="row">
                <div>
                  <label>Path:</label>
                </div>
                <div>{materialComponent.src.value.path}</div>
              </Stack>
            </Stack>
          </Box>
        </div>
      </InputGroup>
      <br />
      {!loadingData.value && (
        <InputGroup name="Prototype" label="Prototype">
          <SelectInput
            value={materialComponent.prototype.value}
            options={prototypes}
            onChange={(protoId) => {
              const nuMat = changeMaterialPrototype(material, protoId)
              materialComponent.set(materialFromId(nuMat!.uuid))
              prototypeComponent = prototypeFromId(materialComponent.prototype.value)
            }}
          />
        </InputGroup>
      )}
      <Divider className={styles.divider} />
      <br />
      {loadingData.value && <div>Loading...</div>}
      {!loadingData.value && (
        <>
          <ParameterInput
            entity={material.uuid}
            values={materialComponent.parameters.value}
            onChange={(k) => async (val) => {
              let prop
              if (prototypeComponent.arguments[k].type === 'texture' && typeof val === 'string') {
                if (val) {
                  prop = await AssetLoader.loadAsync(val)
                } else {
                  prop = null
                }
              } else {
                prop = val
              }
              EditorControlFunctions.modifyMaterial(
                getState(SelectionState).selectedEntities.filter((val) => typeof val === 'string') as string[],
                entryId(materialComponent.value, LibraryEntryType.MATERIAL),
                [{ [k]: prop }]
              )
              materialComponent.parameters[k].set(prop)
            }}
            defaults={prototypeComponent.arguments}
            thumbnails={toBlobs(thumbnails.value)}
          />
          <br />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #fff',
              borderRadius: '4px',
              padding: '4px'
            }}
          >
            <SelectInput
              value={selectedPlugin.value}
              options={Object.keys(materialLibrary.plugins.value).map((key) => ({ label: key, value: key }))}
              onChange={selectedPlugin.set}
            />
            <Button
              onClick={() => {
                materialComponent.plugins.set(materialComponent.plugins.value.concat(selectedPlugin.value))
              }}
            >
              Add Plugin
            </Button>
          </div>
          <PaginatedList
            list={materialComponent.plugins}
            element={(plugin: State<string>) => {
              return (
                <div className={styles.contentContainer}>
                  <InputGroup name="Plugin" label="Plugin">
                    <SelectInput
                      value={plugin.value}
                      options={Object.keys(materialLibrary.plugins.value).map((key) => ({ label: key, value: key }))}
                      onChange={plugin.set}
                    />
                  </InputGroup>
                  <div>
                    <h2>Parameter Values</h2>
                    {/*<pre>{JSON.stringify(plugin.value, null, 2)}</pre>*/}
                    <pre>
                      {JSON.stringify(getState(MaterialLibraryState).plugins[plugin.value].plugin.parameter, null, 2)}
                    </pre>
                  </div>

                  <ParameterInput
                    entity={getState(MaterialLibraryState).plugins[plugin.value].plugin.id}
                    values={getState(MaterialLibraryState).plugins[plugin.value].plugin.parameter}
                    defaults={{
                      parameter1: BoolArg,
                      parameter2: { ...FloatArg, default: 0.01 },
                      parameter3: { ...FloatArg, default: 1 }
                      //emissiveMultiplier: { ...FloatArg, default: 1 },
                      //lightMapSize: { ...FloatArg, default: 1024 },
                      //texelsPerUnit: { ...FloatArg, default: 16 }
                    }}
                    onChange={() => {
                      return (val) => {
                        1
                      }
                    }}
                  />

                  <Button
                    onClick={() => {
                      removeMaterialPlugin(material, plugin.value)
                      materialComponent.plugins.set(
                        materialComponent.plugins.value.filter((val) => val !== plugin.value)
                      )
                    }}
                    style={{ backgroundColor: '#f00' }}
                  >
                    x
                  </Button>
                </div>
              )
            }}
          />
        </>
      )}
    </div>
  )
}
