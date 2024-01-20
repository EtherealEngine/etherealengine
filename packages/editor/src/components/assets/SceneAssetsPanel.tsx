/* eslint-disable no-case-declarations */
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
import Inventory2Icon from '@mui/icons-material/Inventory2'
import WebAssetIcon from '@mui/icons-material/WebAsset'
import { CircularProgress } from '@mui/material'
import { t } from 'i18next'
import { debounce } from 'lodash'
import DockLayout, { DockMode, TabData } from 'rc-dock'
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'

import { NO_PROXY, useHookstate } from '@etherealengine/hyperflux'

import { ShapeType } from '@dimforge/rapier3d-compat'
import {
  ComponentJsonType,
  StaticResourceType,
  staticResourcePath
} from '@etherealengine/common/src/schema.type.module'
import { AssetLoader } from '@etherealengine/engine/src/assets/classes/AssetLoader'
import { AssetClass } from '@etherealengine/engine/src/assets/enum/AssetClass'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { ColliderComponent } from '@etherealengine/engine/src/scene/components/ColliderComponent'
import { EnvmapComponent } from '@etherealengine/engine/src/scene/components/EnvmapComponent'
import { ModelComponent } from '@etherealengine/engine/src/scene/components/ModelComponent'
import { ShadowComponent } from '@etherealengine/engine/src/scene/components/ShadowComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { Vector3 } from 'three'
import { ItemTypes } from '../../constants/AssetTypes'
import { EditorControlFunctions } from '../../functions/EditorControlFunctions'
import { DockContainer } from '../EditorContainer'
import StringInput from '../inputs/StringInput'
import { PanelDragContainer, PanelIcon, PanelTitle } from '../layout/Panel'
import ImageNodeEditor from '../properties/ImageNodeEditor'
import ModelNodeEditor from '../properties/ModelNodeEditor'
import PositionalAudioNodeEditor from '../properties/PositionalAudioNodeEditor'
import VideoNodeEditor from '../properties/VideoNodeEditor'
import { AssetSelectionChangePropsType, AssetsPreviewPanel } from './AssetsPreviewPanel'
import styles from './styles.module.scss'

export type PrefabricatedComponentsType = {
  label: string
  components: ComponentJsonType[]
  type: typeof ItemTypes.PrefabComponents
}
type FolderType = { assetClass: string }
type ResourceItemType = StaticResourceType | PrefabricatedComponentsType

const ResourceIcons = {
  [AssetClass.Model]: ModelNodeEditor.iconComponent,
  [AssetClass.Image]: ImageNodeEditor.iconComponent,
  [AssetClass.Video]: VideoNodeEditor.iconComponent,
  [AssetClass.Audio]: PositionalAudioNodeEditor.iconComponent
}

const DEFAULT_PREFAB_COMPONENTS: PrefabricatedComponentsType[] = [
  {
    components: [{ name: ModelComponent.jsonID }, { name: ShadowComponent.jsonID }, { name: EnvmapComponent.jsonID }],
    label: 'Simple Model',
    type: ItemTypes.PrefabComponents
  },
  {
    components: [
      { name: ModelComponent.jsonID },
      {
        name: ColliderComponent.jsonID,
        props: {
          shape: ShapeType.TriMesh
        }
      }
    ],
    label: 'Mesh Collider',
    type: ItemTypes.PrefabComponents
  }
]

const FolderItem = ({
  data: { resources, onClick, selectedCategory },
  index
}: {
  data: {
    resources: FolderType[]
    onClick: (resource: FolderType) => void
    selectedCategory: string | null
  }
  index: number
}) => {
  const resource = resources[index]
  return (
    <div
      key={resource.assetClass}
      className={`${styles.resourceItemContainer} ${selectedCategory === resource.assetClass ? styles.selected : ''}`}
      onClick={() => onClick(resource)}
    >
      {resource.assetClass}
    </div>
  )
}

const PrefabComponentItem = ({ resource }: { resource: PrefabricatedComponentsType }) => {
  const [_, drag, preview] = useDrag(() => ({
    type: resource.type,
    item: resource,
    multiple: false
  }))
  useEffect(() => {
    if (preview) preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])
  return (
    <div
      ref={drag}
      key={resource.label}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        background: 'var(--dropdownMenuBackground)',
        marginBottom: '-30px',
        textAlign: 'center'
      }}
      onDoubleClick={() =>
        EditorControlFunctions.createObjectFromSceneElement([
          ...resource.components,
          { name: TransformComponent.jsonID, props: { position: new Vector3(0, 0, 0) } }
        ])
      }
    >
      <span>{resource.label}</span>
    </div>
  )
}

const StaticResourceItem = ({ resource }: { resource: StaticResourceType }) => {
  const { onAssetSelectionChanged } = useContext(AssetsPreviewContext)

  const assetType = AssetLoader.getAssetType(resource.key)
  const ResourceIcon = ResourceIcons[AssetLoader.getAssetClass(resource.key)] || WebAssetIcon
  const [_, drag, preview] = useDrag(() => ({
    type: assetType,
    item: {
      url: resource.url
    },
    multiple: false
  }))

  useEffect(() => {
    if (preview) preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  const fullName = resource.key.split('/').at(-1)!
  const name = fullName.length > 15 ? `${fullName.substring(0, 12)}...` : fullName

  return (
    <div
      ref={drag}
      key={resource.id}
      onClick={() =>
        onAssetSelectionChanged?.({
          contentType: assetType,
          name: fullName,
          resourceUrl: resource.url,
          size: 'unknown size'
        })
      }
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        marginTop: '10px',
        cursor: 'pointer'
      }}
    >
      <ResourceIcon style={{ marginBottom: '5px', height: '70px', width: '70px' }} />
      <span>{name}</span>
    </div>
  )
}

const SceneAssetsPanel = () => {
  const { t } = useTranslation()
  const categorizedStaticResources = useHookstate({} as Record<string, ResourceItemType[]>)
  const selectedCategory = useHookstate<string | null>(null)
  const loading = useHookstate(false)
  const searchText = useHookstate('')
  const searchTimeoutCancelRef = useRef<(() => void) | null>(null)
  const searchedStaticResources = useHookstate<ResourceItemType[]>([])

  useEffect(() => {
    const staticResourcesFindApi = () =>
      Engine.instance.api
        .service(staticResourcePath)
        .find({ query: { key: { $like: `%${searchText.value}%` || undefined }, $sort: { mimeType: 1 }, $limit: 100 } })
        .then((resources) => {
          if (searchText.value) {
            searchedStaticResources.set(resources.data)
            return
          }

          const categorizedResources: Record<string, ResourceItemType[]> = {
            'Default Prefabs': DEFAULT_PREFAB_COMPONENTS
          }

          resources.data.forEach((resource) => {
            const assetClass = AssetLoader.getAssetClass(resource.key)
            if (!(assetClass in categorizedResources)) {
              categorizedResources[assetClass] = []
            }
            categorizedResources[assetClass].push(resource)
          })

          categorizedStaticResources.set(categorizedResources)
        })
        .then(() => {
          loading.set(false)
        })

    loading.set(true)

    searchTimeoutCancelRef.current?.()
    const debouncedSearchQuery = debounce(staticResourcesFindApi, 500)
    debouncedSearchQuery()

    searchTimeoutCancelRef.current = debouncedSearchQuery.cancel

    return () => searchTimeoutCancelRef.current?.()
  }, [searchText])

  const ResourceList = useCallback(
    ({ height, width }) => {
      const folderTypes = Object.keys(categorizedStaticResources.value).map((assetClass) => ({ assetClass }))
      return (
        <FixedSizeList
          height={height}
          width={width}
          itemSize={32}
          itemCount={folderTypes.length}
          itemData={{
            resources: folderTypes,
            selectedCategory: selectedCategory.value,
            onClick: (resource: FolderType) => {
              selectedCategory.set(resource.assetClass)
              searchText.set('')
            }
          }}
          itemKey={(index) => index}
        >
          {FolderItem}
        </FixedSizeList>
      )
    },
    [selectedCategory, categorizedStaticResources]
  )

  const ResourceItems = () => {
    if (loading.value) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </div>
      )
    }
    if (searchText.value) {
      if (searchedStaticResources.length > 0)
        return (
          <>
            {searchedStaticResources.map((resource) =>
              'id' in resource.value ? (
                <StaticResourceItem key={resource.value.id} resource={resource.get(NO_PROXY) as StaticResourceType} />
              ) : (
                <PrefabComponentItem
                  key={resource.value.label}
                  resource={resource.get(NO_PROXY) as PrefabricatedComponentsType}
                />
              )
            )}
          </>
        )
      return <div>{t('editor:layout.scene-assets.no-search-results')}</div>
    }
    if (selectedCategory.value) {
      // prettier-ignore
      return (
        <>
          {categorizedStaticResources
            .get(NO_PROXY)[selectedCategory.value!]?.map((resource) =>
              'id' in resource ? (
                <StaticResourceItem key={resource.id} resource={resource} />
              ) : (
                <PrefabComponentItem key={resource.label} resource={resource} />
              )
            )}
        </>
      )
    }
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {t('editor:layout.scene-assets.no-category')}
      </div>
    )
  }

  return (
    <div style={{ margin: '1rem auto', height: '100%', width: '100%' }}>
      <div className={styles.searchContainer}>
        <StringInput
          placeholder={t('editor:layout.scene-assets.search-placeholder')}
          value={searchText.value}
          onChange={searchText.set}
        />
      </div>
      <div style={{ display: 'flex', height: '100%', width: '100%', margin: '1rem auto' }}>
        <div className={styles.hideScrollbar} style={{ height: '100%', width: '50%' }}>
          <AutoSizer onResize={ResourceList}>{ResourceList}</AutoSizer>
        </div>
        <div style={{ width: '50%', overflow: 'auto' }}>
          {selectedCategory.value && (
            <div
              style={{
                textAlign: 'center',
                fontStyle: 'italic',
                marginBottom: '1.5rem'
              }}
            >
              {t('editor:layout.scene-assets.info-drag-drop')}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gap: '40px 10px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gridAutoRows: '60px'
            }}
          >
            <ResourceItems />
          </div>
        </div>
      </div>
    </div>
  )
}

const AssetsPreviewContext = createContext({ onAssetSelectionChanged: (props: AssetSelectionChangePropsType) => {} })

export const SceneAssetsPanelContent = () => {
  const { t } = useTranslation()
  const assetsPreviewPanelRef = useRef()
  return (
    <AssetsPreviewContext.Provider
      value={{
        onAssetSelectionChanged: (props: AssetSelectionChangePropsType) =>
          (assetsPreviewPanelRef.current as any)?.onSelectionChanged(props)
      }}
    >
      <DockContainer id="sceneAssetsPanelContent" dividerAlpha={0.3}>
        <DockLayout
          onLayoutChange={() => (assetsPreviewPanelRef.current as any)?.onLayoutChanged?.()}
          style={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 5, right: 5, bottom: 5 }}
          defaultLayout={{
            dockbox: {
              mode: 'vertical' as DockMode,
              children: [
                {
                  size: 7,
                  mode: 'horizontal' as DockMode,
                  children: [
                    {
                      tabs: [
                        {
                          id: 'sceneAssetsPanel',
                          title: t('editor:tabs.project-assets') as string,
                          content: <SceneAssetsPanel />,
                          cached: true
                        }
                      ]
                    }
                  ]
                },
                {
                  size: 3,
                  tabs: [
                    {
                      id: 'previewPanel',
                      title: t('editor:layout.scene-assets.preview'),
                      cached: true,
                      content: <AssetsPreviewPanel ref={assetsPreviewPanelRef} />
                    }
                  ]
                }
              ]
            }
          }}
        />
      </DockContainer>
    </AssetsPreviewContext.Provider>
  )
}

export const SceneAssetsPanelTab: TabData = {
  id: 'sceneAssetsPanelTab',
  closable: true,
  cached: true,
  title: (
    <PanelDragContainer>
      <PanelIcon as={Inventory2Icon} size={12} />
      <PanelTitle>{t('editor:tabs.scene-assets')}</PanelTitle>
    </PanelDragContainer>
  ),
  content: <SceneAssetsPanelContent />
}

export default SceneAssetsPanel
