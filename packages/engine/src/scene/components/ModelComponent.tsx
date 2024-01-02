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
import { AnimationMixer, Scene } from 'three'

import { NO_PROXY, createState, getMutableState, getState, none, useHookstate } from '@etherealengine/hyperflux'

import { VRM } from '@pixiv/three-vrm'
import React from 'react'
import { AssetLoader } from '../../assets/classes/AssetLoader'
import { AssetType } from '../../assets/enum/AssetType'
import { GLTF } from '../../assets/loaders/gltf/GLTFLoader'
import { AnimationComponent } from '../../avatar/components/AnimationComponent'
import { SkinnedMeshComponent } from '../../avatar/components/SkinnedMeshComponent'
import { autoconvertMixamoAvatar, isAvaturn } from '../../avatar/functions/avatarFunctions'
import { CameraComponent } from '../../camera/components/CameraComponent'
import { Engine } from '../../ecs/classes/Engine'
import { EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import { SceneState } from '../../ecs/classes/Scene'
import {
  defineComponent,
  getComponent,
  hasComponent,
  removeComponent,
  serializeComponent,
  setComponent,
  useComponent,
  useOptionalComponent,
  useQuery
} from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { EngineRenderer } from '../../renderer/WebGLRendererSystem'
import { SourceType } from '../../renderer/materials/components/MaterialSource'
import { removeMaterialSource } from '../../renderer/materials/functions/MaterialLibraryFunctions'
import { ObjectLayers } from '../constants/ObjectLayers'
import { addError, removeError } from '../functions/ErrorFunctions'
import { generateMeshBVH } from '../functions/bvhWorkerPool'
import { parseGLTFModel } from '../functions/loadGLTFModel'
import { getModelSceneID } from '../functions/loaders/ModelFunctions'
import { enableObjectLayer } from '../functions/setObjectLayers'
import { EnvmapComponent } from './EnvmapComponent'
import { GroupComponent } from './GroupComponent'
import { MeshComponent } from './MeshComponent'
import { SceneAssetPendingTagComponent } from './SceneAssetPendingTagComponent'
import { SceneObjectComponent } from './SceneObjectComponent'
import { ShadowComponent } from './ShadowComponent'
import { SourceComponent } from './SourceComponent'
import { UUIDComponent } from './UUIDComponent'
import { VisibleComponent } from './VisibleComponent'

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
      !getState(EngineState).sceneLoaded &&
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
  const uuid = useComponent(entity, UUIDComponent)

  useEffect(() => {
    let aborted = false

    const model = modelComponent.value
    if (!model.src) {
      // const dudScene = new Scene() as Scene & Object3D
      // dudScene.entity = entity
      // addObjectToGroup(entity, dudScene)
      // proxifyParentChildRelationships(dudScene)
      modelComponent.scene.set(null)
      modelComponent.asset.set(null)
      return
    }

    /** @todo this is a hack */
    const override = !isAvaturn(model.src) ? undefined : AssetType.glB

    AssetLoader.load(
      modelComponent.src.value,
      {
        forceAssetType: override,
        ignoreDisposeGeometry: modelComponent.cameraOcclusion.value,
        uuid: uuid.value
      },
      (loadedAsset) => {
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
            mixer: new AnimationMixer(boneMatchedAsset.humanoid.normalizedHumanBones.hips.node)
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
  }, [modelComponent.src])

  //useEffect(() => {
  //  if(!modelComponent.asset.value) return
  //  modelComponent.src.set('')
  //}, [modelComponent.convertToVRM])

  useEffect(() => {
    const model = modelComponent.get(NO_PROXY)!
    const asset = model.asset as GLTF | null
    if (!asset) return
    removeError(entity, ModelComponent, 'INVALID_SOURCE')
    removeError(entity, ModelComponent, 'LOADING_ERROR')
    const sceneObj = getComponent(entity, GroupComponent)[0] as Scene

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
    console.log(asset.scene.animations)

    const loadedJsonHierarchy = parseGLTFModel(entity, asset.scene as Scene)
    const uuid = getModelSceneID(entity)

    SceneState.loadScene(uuid, {
      scene: {
        entities: loadedJsonHierarchy,
        root: getComponent(entity, UUIDComponent),
        version: 0
      },
      scenePath: uuid,
      name: '',
      project: '',
      thumbnailUrl: ''
    })
    const src = modelComponent.src.value
    return () => {
      clearMaterials(src)
      getMutableState(SceneState).scenes[uuid].set(none)
      // for(const child of scene.children) {
      //   removeEntity(child.entity)
      // }
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
  const modelComponent = useComponent(props.parentEntity, ModelComponent)
  const isMesh = useOptionalComponent(props.entity, MeshComponent)
  const isSkinnedMesh = useOptionalComponent(props.entity, SkinnedMeshComponent)
  const visible = useOptionalComponent(props.entity, VisibleComponent)

  useEffect(() => {
    if (!isMesh || isSkinnedMesh) return
    const mesh = getComponent(props.entity, MeshComponent)

    let aborted = false

    /** @todo should we generate a BVH for every mesh, even invisible ones used for collision? */
    generateMeshBVH(mesh).then(() => {
      if (aborted) return
      enableObjectLayer(
        mesh,
        ObjectLayers.Camera,
        modelComponent.cameraOcclusion.value && hasComponent(props.entity, VisibleComponent)
      )
    })

    return () => {
      aborted = true
    }
  }, [isMesh, isSkinnedMesh, visible, modelComponent.cameraOcclusion])

  const shadowComponent = useOptionalComponent(props.parentEntity, ShadowComponent)
  useEffect(() => {
    if (!isMesh) return
    if (shadowComponent)
      setComponent(props.entity, ShadowComponent, serializeComponent(props.parentEntity, ShadowComponent))
    else removeComponent(props.entity, ShadowComponent)
  }, [isMesh, shadowComponent])

  const envmapComponent = useOptionalComponent(props.parentEntity, EnvmapComponent)
  useEffect(() => {
    if (!isMesh) return
    if (envmapComponent)
      setComponent(props.entity, EnvmapComponent, serializeComponent(props.parentEntity, EnvmapComponent))
    else removeComponent(props.entity, EnvmapComponent)
  }, [isMesh, envmapComponent])

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
