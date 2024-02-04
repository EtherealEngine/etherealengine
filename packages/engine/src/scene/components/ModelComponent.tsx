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

import { useEffect } from 'react'
import { AnimationMixer, Group, Scene } from 'three'

import { NO_PROXY, createState, getMutableState, getState, none, useHookstate } from '@etherealengine/hyperflux'

import {
  defineComponent,
  getComponent,
  getOptionalComponent,
  hasComponent,
  removeComponent,
  serializeComponent,
  setComponent,
  useComponent,
  useOptionalComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { Entity } from '@etherealengine/ecs/src/Entity'
import { useEntityContext } from '@etherealengine/ecs/src/EntityFunctions'
import { useQuery } from '@etherealengine/ecs/src/QueryFunctions'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import { CameraComponent } from '@etherealengine/spatial/src/camera/components/CameraComponent'
import { UUIDComponent } from '@etherealengine/spatial/src/common/UUIDComponent'
import { EngineRenderer } from '@etherealengine/spatial/src/renderer/WebGLRendererSystem'
import { GroupComponent, addObjectToGroup } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { MeshComponent } from '@etherealengine/spatial/src/renderer/components/MeshComponent'
import { VRM } from '@pixiv/three-vrm'
import React from 'react'
import { AssetLoader } from '../../assets/classes/AssetLoader'
import { AssetType } from '../../assets/enum/AssetType'
import { GLTF } from '../../assets/loaders/gltf/GLTFLoader'
import { AnimationComponent } from '../../avatar/components/AnimationComponent'
import { AvatarRigComponent } from '../../avatar/components/AvatarAnimationComponent'
import { autoconvertMixamoAvatar, isAvaturn } from '../../avatar/functions/avatarFunctions'
import { SourceType } from '../../scene/materials/components/MaterialSource'
import { removeMaterialSource } from '../../scene/materials/functions/MaterialLibraryFunctions'
import { addError, removeError } from '../functions/ErrorFunctions'
import { parseGLTFModel, proxifyParentChildRelationships } from '../functions/loadGLTFModel'
import { getModelSceneID } from '../functions/loaders/ModelFunctions'
import { EnvmapComponent } from './EnvmapComponent'
import { ObjectGridSnapComponent } from './ObjectGridSnapComponent'
import { SceneAssetPendingTagComponent } from './SceneAssetPendingTagComponent'
import { SceneObjectComponent } from './SceneObjectComponent'
import { ShadowComponent } from './ShadowComponent'
import { SourceComponent } from './SourceComponent'
import { VariantComponent } from './VariantComponent'

function clearMaterials(src: string) {
  try {
    removeMaterialSource({ type: SourceType.MODEL, path: src ?? '' })
  } catch (e) {
    if (e?.name === 'MaterialNotFound') {
      console.warn('could not find material in source ' + src)
    } else {
      throw e
    }
  }
}

const entitiesInModelHierarchy = {} as Record<Entity, Entity[]>

export const ModelComponent = defineComponent({
  name: 'Model Component',
  jsonID: 'gltf-model',

  onInit: (entity) => {
    return {
      src: '',
      cameraOcclusion: true,
      //optional, only for bone matchable avatars
      convertToVRM: false as boolean,
      // internal
      scene: null as Scene | null,
      asset: null as VRM | GLTF | null
    }
  },

  toJSON: (entity, component) => {
    return {
      src: component.src.value,
      cameraOcclusion: component.cameraOcclusion.value,
      convertToVRM: component.convertToVRM.value
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    if (typeof json.src === 'string') component.src.set(json.src)
    if (typeof (json as any).avoidCameraOcclusion === 'boolean')
      component.cameraOcclusion.set(!(json as any).avoidCameraOcclusion)
    if (typeof json.cameraOcclusion === 'boolean') component.cameraOcclusion.set(json.cameraOcclusion)
    if (typeof json.convertToVRM === 'boolean') component.convertToVRM.set(json.convertToVRM)

    /**
     * Add SceneAssetPendingTagComponent to tell scene loading system we should wait for this asset to load
     */
    if (
      !getState(SceneState).sceneLoaded &&
      hasComponent(entity, SceneObjectComponent) &&
      component.src.value &&
      !component.scene.value
    )
      setComponent(entity, SceneAssetPendingTagComponent)
  },

  errors: ['LOADING_ERROR', 'INVALID_SOURCE'],

  reactor: ModelReactor,

  /** Tracks all child entities loaded by this model */
  entitiesInModelHierarchyState: createState(entitiesInModelHierarchy),
  entitiesInModelHierarchy: entitiesInModelHierarchy as Readonly<typeof entitiesInModelHierarchy>
})

function ModelReactor(): JSX.Element {
  const entity = useEntityContext()
  const modelComponent = useComponent(entity, ModelComponent)
  const uuidComponent = useComponent(entity, UUIDComponent)
  const variantComponent = useOptionalComponent(entity, VariantComponent)

  useEffect(() => {
    let aborted = false
    if (variantComponent && !variantComponent.calculated.value) return
    const model = modelComponent.value
    if (!model.src) {
      modelComponent.scene.set(null)
      modelComponent.asset.set(null)
      return
    }

    if (!hasComponent(entity, GroupComponent)) {
      const obj3d = new Group()
      obj3d.entity = entity
      addObjectToGroup(entity, obj3d)
      proxifyParentChildRelationships(obj3d)
    }

    /** @todo this is a hack */
    const override = !isAvaturn(model.src) ? undefined : AssetType.glB

    AssetLoader.load(
      modelComponent.src.value,
      {
        forceAssetType: override,
        ignoreDisposeGeometry: modelComponent.cameraOcclusion.value
      },
      (loadedAsset) => {
        if (variantComponent && !variantComponent.calculated.value) return
        if (aborted) return
        if (typeof loadedAsset !== 'object') {
          addError(entity, ModelComponent, 'INVALID_SOURCE', 'Invalid URL')
          return
        }
        const boneMatchedAsset = modelComponent.convertToVRM.value
          ? (autoconvertMixamoAvatar(loadedAsset) as GLTF)
          : loadedAsset
        /**if we've loaded or converted to vrm, create animation component whose mixer's root is the normalized rig */
        if (boneMatchedAsset instanceof VRM)
          setComponent(entity, AnimationComponent, {
            animations: loadedAsset.animations,
            mixer: new AnimationMixer(boneMatchedAsset.humanoid.normalizedHumanBonesRoot)
          })
        modelComponent.asset.set(boneMatchedAsset)
      },
      (onprogress) => {
        if (aborted) return
        if (hasComponent(entity, SceneAssetPendingTagComponent))
          SceneAssetPendingTagComponent.loadingProgress.merge({
            [entity]: {
              loadedAmount: onprogress.loaded,
              totalAmount: onprogress.total
            }
          })
      },
      (err: Error) => {
        if (aborted) return
        console.error(err)
        addError(entity, ModelComponent, 'INVALID_SOURCE', err.message)
        removeComponent(entity, SceneAssetPendingTagComponent)
      }
    )
    return () => {
      aborted = true
    }
  }, [modelComponent.src, modelComponent.convertToVRM, variantComponent?.calculated])

  useEffect(() => {
    const model = modelComponent.get(NO_PROXY)!
    const asset = model.asset as GLTF | null
    if (!asset) return
    const group = getOptionalComponent(entity, GroupComponent)
    if (!group) return
    removeError(entity, ModelComponent, 'INVALID_SOURCE')
    removeError(entity, ModelComponent, 'LOADING_ERROR')
    const sceneObj = group[0] as Scene

    sceneObj.userData.src = model.src
    sceneObj.userData.sceneID = getModelSceneID(entity)
    //sceneObj.userData.type === 'glb' && delete asset.scene.userData.type
    modelComponent.scene.set(sceneObj)
  }, [modelComponent.asset])

  // update scene
  useEffect(() => {
    const scene = getComponent(entity, ModelComponent).scene
    const asset = getComponent(entity, ModelComponent).asset

    if (!scene || !asset) return

    if (EngineRenderer.instance)
      EngineRenderer.instance.renderer
        .compileAsync(scene, getComponent(Engine.instance.cameraEntity, CameraComponent), Engine.instance.scene)
        .catch(() => {
          addError(entity, ModelComponent, 'LOADING_ERROR', 'Error compiling model')
        })
        .finally(() => {
          removeComponent(entity, SceneAssetPendingTagComponent)
        })
    else removeComponent(entity, SceneAssetPendingTagComponent)

    /**hotfix for gltf animations being stored in the root and not scene property */
    if (!asset.scene.animations.length && !(asset instanceof VRM)) asset.scene.animations = asset.animations

    const sceneID = getModelSceneID(entity)
    const loadedJsonHierarchy = parseGLTFModel(entity, asset.scene as Scene, sceneID)

    SceneState.loadScene(sceneID, {
      scene: {
        entities: loadedJsonHierarchy,
        root: getComponent(entity, UUIDComponent),
        version: 0
      },
      scenePath: sceneID,
      name: '',
      project: '',
      thumbnailUrl: ''
    })
    const src = modelComponent.src.value
    if (!hasComponent(entity, AvatarRigComponent)) {
      //if this is not an avatar, add bbox snap
      setComponent(entity, ObjectGridSnapComponent)
    }

    return () => {
      if (!(asset instanceof VRM)) clearMaterials(src) // [TODO] Replace with hooks and refrence counting
      getMutableState(SceneState).scenes[sceneID].set(none)
    }
  }, [modelComponent.scene])

  const childQuery = useQuery([SourceComponent])
  useEffect(() => {
    const modelSceneID = getModelSceneID(entity)
    ModelComponent.entitiesInModelHierarchyState[entity].set(
      childQuery.filter((e) => getComponent(e, SourceComponent) === modelSceneID)
    )
  }, [JSON.stringify(childQuery)])

  const childEntities = useHookstate(ModelComponent.entitiesInModelHierarchyState[entity])

  return (
    <>
      {childEntities.value?.map((childEntity: Entity) => (
        <ChildReactor key={childEntity} entity={childEntity} parentEntity={entity} />
      ))}
    </>
  )
}

const ChildReactor = (props: { entity: Entity; parentEntity: Entity }) => {
  const isMesh = useOptionalComponent(props.entity, MeshComponent)

  const shadowComponent = useOptionalComponent(props.parentEntity, ShadowComponent)
  useEffect(() => {
    if (!isMesh) return
    if (shadowComponent)
      setComponent(props.entity, ShadowComponent, serializeComponent(props.parentEntity, ShadowComponent))
    else removeComponent(props.entity, ShadowComponent)
  }, [isMesh, shadowComponent?.cast, shadowComponent?.receive])

  const envmapComponent = useOptionalComponent(props.parentEntity, EnvmapComponent)
  useEffect(() => {
    if (!isMesh) return
    if (envmapComponent)
      setComponent(props.entity, EnvmapComponent, serializeComponent(props.parentEntity, EnvmapComponent))
    else removeComponent(props.entity, EnvmapComponent)
  }, [
    isMesh,
    envmapComponent,
    envmapComponent?.envMapIntensity,
    envmapComponent?.envmap,
    envmapComponent?.envMapSourceColor,
    envmapComponent?.envMapSourceURL,
    envmapComponent?.envMapTextureType,
    envmapComponent?.envMapSourceEntityUUID
  ])

  return null
}

/**
 * Returns true if the entity is a mesh not a part of a model, or a model
 * @param entity
 * @returns
 */
export const useMeshOrModel = (entity: Entity) => {
  const meshComponent = useOptionalComponent(entity, MeshComponent)
  const modelComponent = useOptionalComponent(entity, ModelComponent)
  const sourceComponent = useOptionalComponent(entity, SourceComponent)
  const isEntityHierarchyOrMesh = (!sourceComponent && !!meshComponent) || !!modelComponent
  return isEntityHierarchyOrMesh
}

export const useContainsMesh = (entity: Entity) => {
  const meshComponent = useOptionalComponent(entity, MeshComponent)
  const childEntities = useHookstate(ModelComponent.entitiesInModelHierarchyState[entity])
  return !!meshComponent || !!childEntities.value?.find((e: Entity) => getComponent(e, MeshComponent))
}
