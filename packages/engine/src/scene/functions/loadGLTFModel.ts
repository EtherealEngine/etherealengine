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

import { Bone, InstancedMesh, Mesh, Object3D, Scene, SkinnedMesh } from 'three'

import { EntityUUID, UUIDComponent } from '@etherealengine/ecs'
import {
  ComponentJSONIDMap,
  ComponentMap,
  getComponent,
  getOptionalComponent,
  hasComponent,
  setComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { Entity, UndefinedEntity } from '@etherealengine/ecs/src/Entity'
import { TransformComponent } from '@etherealengine/spatial'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import iterateObject3D from '@etherealengine/spatial/src/common/functions/iterateObject3D'
import { EngineRenderer } from '@etherealengine/spatial/src/renderer/WebGLRendererSystem'
import { GroupComponent, addObjectToGroup } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { MeshComponent } from '@etherealengine/spatial/src/renderer/components/MeshComponent'
import { Object3DComponent } from '@etherealengine/spatial/src/renderer/components/Object3DComponent'
import { ObjectLayerMaskComponent } from '@etherealengine/spatial/src/renderer/components/ObjectLayerComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import { FrustumCullCameraComponent } from '@etherealengine/spatial/src/transform/components/DistanceComponents'
import { EntityTreeComponent } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { computeTransformMatrix } from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import { BoneComponent } from '../../avatar/components/BoneComponent'
import { SkinnedMeshComponent } from '../../avatar/components/SkinnedMeshComponent'
import { GLTFLoadedComponent } from '../components/GLTFLoadedComponent'
import { InstancingComponent } from '../components/InstancingComponent'
import { ModelComponent } from '../components/ModelComponent'
import { SceneAssetPendingTagComponent } from '../components/SceneAssetPendingTagComponent'
import { SourceComponent } from '../components/SourceComponent'
import { ComponentJsonType, EntityJsonType } from '../types/SceneTypes'
import { getModelSceneID } from './loaders/ModelFunctions'

export const parseECSData = (data: [string, any][]): ComponentJsonType[] => {
  const components: { [key: string]: any } = {}
  const prefabs: { [key: string]: any } = {}

  for (const [key, value] of data) {
    const parts = key.split('.')
    if (parts.length > 1) {
      if (parts[0] === 'xrengine') {
        const componentExists = ComponentMap.has(parts[1])
        const _toLoad = componentExists ? components : prefabs
        if (typeof _toLoad[parts[1]] === 'undefined') {
          _toLoad[parts[1]] = {}
        }
        if (parts.length > 2) {
          let val = value
          if (value === 'true') val = true
          if (value === 'false') val = false
          _toLoad[parts[1]][parts[2]] = val
        }
      }
    }
  }

  const result: ComponentJsonType[] = []
  for (const [key, value] of Object.entries(components)) {
    const component = ComponentMap.get(key)
    if (typeof component === 'undefined') {
      console.warn(`Could not load component '${key}'`)
      continue
    }
    result.push({ name: component.jsonID!, props: value })
  }

  for (const [key, value] of Object.entries(prefabs)) {
    const Component = ComponentJSONIDMap.get(key)!
    if (typeof Component === 'undefined') {
      console.warn(`Could not load component '${key}'`)
      continue
    }
    result.push({ name: Component.jsonID!, props: value })
  }

  return result
}

export const createObjectEntityFromGLTF = (obj3d: Object3D): ComponentJsonType[] => {
  return parseECSData(Object.entries(obj3d.userData))
}

export const parseObjectComponentsFromGLTF = (
  entity: Entity,
  object3d?: Object3D
): Record<EntityUUID, EntityJsonType> => {
  const scene = object3d ?? getComponent(entity, ModelComponent).scene
  const meshesToProcess: Mesh[] = []

  if (!scene) return {}

  scene.traverse((mesh: Mesh) => {
    if ('xrengine.entity' in mesh.userData) {
      meshesToProcess.push(mesh)
    }
  })

  const entityJson: Record<EntityUUID, EntityJsonType> = {}

  for (const mesh of meshesToProcess) {
    const name = mesh.userData['xrengine.entity'] ?? mesh.uuid
    const uuid = mesh.uuid as EntityUUID
    const eJson: EntityJsonType = {
      name,
      components: []
    }
    eJson.components.push(...createObjectEntityFromGLTF(mesh))

    entityJson[uuid] = eJson
  }

  return entityJson
}

export const parseGLTFModel = (entity: Entity, scene: Scene) => {
  const model = getComponent(entity, ModelComponent)

  scene.updateMatrixWorld(true)
  computeTransformMatrix(entity)

  // always parse components first using old ECS parsing schema
  const entityJson = parseObjectComponentsFromGLTF(entity, scene)
  // current ECS parsing schema

  const children = [...scene.children]
  for (const child of children) {
    child.parent = model.scene
    iterateObject3D(child, (obj: Object3D) => {
      const uuid = obj.uuid as EntityUUID
      const eJson = generateEntityJsonFromObject(entity, obj, entityJson[uuid])
      entityJson[uuid] = eJson
    })
  }

  return entityJson
}

export const proxifyParentChildRelationships = (obj: Object3D) => {
  const objEntity = obj.entity
  Object.defineProperties(obj, {
    matrixWorld: {
      get() {
        return getComponent(objEntity, TransformComponent).matrixWorld
      },
      set(value) {
        if (value != undefined) throw new Error('Cannot set matrixWorld of proxified object')
        console.warn('Setting to nil value is not supported LoadGLTFModel.ts: proxifyParentChildRelationships')
      }
    },
    parent: {
      get() {
        if (EngineRenderer.instance?.rendering) return null
        if (getOptionalComponent(objEntity, EntityTreeComponent)?.parentEntity) {
          const result =
            getOptionalComponent(getComponent(objEntity, EntityTreeComponent).parentEntity!, GroupComponent)?.[0] ??
            Engine.instance.scene
          return result ?? null
        }
        return Engine.instance.scene
      },
      set(value) {
        if (value != undefined) throw new Error('Cannot set parent of proxified object')
        console.warn('Setting to nil value is not supported LoadGLTFModel.ts: proxifyParentChildRelationships')
      }
    },
    children: {
      get() {
        if (EngineRenderer.instance?.rendering) return []
        if (hasComponent(objEntity, EntityTreeComponent)) {
          const childEntities = getComponent(objEntity, EntityTreeComponent).children
          const result: Object3D[] = []
          for (const childEntity of childEntities) {
            if (hasComponent(childEntity, MeshComponent)) {
              result.push(getComponent(childEntity, MeshComponent))
            } else if (hasComponent(childEntity, Object3DComponent)) {
              result.push(getComponent(childEntity, Object3DComponent))
            }
          }
          return result
        } else {
          return []
        }
      },
      set(value) {
        if (value != undefined) throw new Error('Cannot set children of proxified object')
        console.warn('Setting to nil value is not supported LoadGLTFModel.ts: proxifyParentChildRelationships')
      }
    },
    isProxified: {
      value: true
    }
  })
}

export const generateEntityJsonFromObject = (rootEntity: Entity, obj: Object3D, entityJson?: EntityJsonType) => {
  // create entity outside of scene loading reactor since we need to access it before the reactor is guaranteed to have executed
  const objEntity = UUIDComponent.getOrCreateEntityByUUID(obj.uuid as EntityUUID)
  const parentEntity = obj.parent ? obj.parent.entity : rootEntity
  const uuid = obj.uuid as EntityUUID
  const name = obj.userData['xrengine.entity'] ?? obj.name

  const eJson: EntityJsonType = entityJson ?? {
    name,
    components: []
  }

  eJson.parent = getComponent(parentEntity, UUIDComponent)

  const sceneID = getModelSceneID(rootEntity)
  setComponent(objEntity, SourceComponent, sceneID)
  setComponent(objEntity, EntityTreeComponent, {
    parentEntity,
    uuid
  })

  if (hasComponent(rootEntity, SceneAssetPendingTagComponent))
    SceneAssetPendingTagComponent.addResource(objEntity, `${rootEntity}`)

  setComponent(objEntity, NameComponent, name)
  setComponent(objEntity, TransformComponent, {
    position: obj.position.clone(),
    rotation: obj.quaternion.clone(),
    scale: obj.scale.clone()
  })
  computeTransformMatrix(objEntity)

  for (const component of eJson.components) {
    if (ComponentJSONIDMap.has(component.name))
      setComponent(objEntity, ComponentJSONIDMap.get(component.name)!, component.props)
  }

  eJson.components.push({
    name: TransformComponent.jsonID,
    props: {
      position: obj.position.clone(),
      rotation: obj.quaternion.clone(),
      scale: obj.scale.clone()
    }
  })

  addObjectToGroup(objEntity, obj)
  setComponent(objEntity, GLTFLoadedComponent, ['entity'])
  ObjectLayerMaskComponent.setMask(objEntity, ObjectLayerMaskComponent.mask[rootEntity])

  /** Proxy children with EntityTreeComponent if it exists */
  proxifyParentChildRelationships(obj)

  obj.removeFromParent = () => {
    if (getOptionalComponent(objEntity, EntityTreeComponent)?.parentEntity) {
      setComponent(objEntity, EntityTreeComponent, {
        parentEntity: UndefinedEntity
      })
    }
    return obj
  }

  const findColliderData = (obj: Object3D) => {
    if (
      Object.keys(obj.userData).find(
        (key) => key.startsWith('xrengine.collider') || key.startsWith('xrengine.EE_collider')
      )
    ) {
      return true
    } else if (obj.parent) {
      return Object.keys(obj.parent.userData).some(
        (key) => key.startsWith('xrengine.collider') || key.startsWith('xrengine.EE_collider')
      )
    }
    return false
  }
  //if we're not using visible component, set visible by default
  if (
    !obj.userData['useVisible'] &&
    //if this object has a collider component attached to it, set visible to false
    !findColliderData(obj)
  ) {
    eJson.components.push({
      name: VisibleComponent.jsonID,
      props: true
    })
  }

  const mesh = obj as Mesh
  mesh.isMesh && setComponent(objEntity, MeshComponent, mesh)

  //check if mesh is instanced. If so, add InstancingComponent
  const instancedMesh = obj as InstancedMesh
  instancedMesh.isInstancedMesh &&
    setComponent(objEntity, InstancingComponent, {
      instanceMatrix: instancedMesh.instanceMatrix
    })

  const bone = obj as Bone
  bone.isBone && setComponent(objEntity, BoneComponent, bone)

  const skinnedMesh = obj as SkinnedMesh
  if (skinnedMesh.isSkinnedMesh) setComponent(objEntity, SkinnedMeshComponent, skinnedMesh)
  else setComponent(objEntity, FrustumCullCameraComponent)

  if (obj.userData['componentJson']) {
    eJson.components.push(...obj.userData['componentJson'])
  }

  return eJson
}
