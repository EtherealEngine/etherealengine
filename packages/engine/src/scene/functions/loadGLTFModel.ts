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

import { AnimationMixer, Bone, InstancedMesh, Mesh, Object3D, Scene, SkinnedMesh } from 'three'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { ComponentJsonType, EntityJsonType, SceneID } from '@etherealengine/common/src/schema.type.module'
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
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { UUIDComponent } from '@etherealengine/spatial/src/common/UUIDComponent'
import iterateObject3D from '@etherealengine/spatial/src/common/functions/iterateObject3D'
import { EngineRenderer } from '@etherealengine/spatial/src/renderer/WebGLRendererSystem'
import { GroupComponent, addObjectToGroup } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { MeshComponent } from '@etherealengine/spatial/src/renderer/components/MeshComponent'
import { Object3DComponent } from '@etherealengine/spatial/src/renderer/components/Object3DComponent'
import { enableObjectLayer } from '@etherealengine/spatial/src/renderer/components/ObjectLayerComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import { ObjectLayers } from '@etherealengine/spatial/src/renderer/constants/ObjectLayers'
import { FrustumCullCameraComponent } from '@etherealengine/spatial/src/transform/components/DistanceComponents'
import { EntityTreeComponent } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'
import { computeTransformMatrix } from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import { AnimationComponent } from '../../avatar/components/AnimationComponent'
import { BoneComponent } from '../../avatar/components/BoneComponent'
import { SkinnedMeshComponent } from '../../avatar/components/SkinnedMeshComponent'
import { GLTFLoadedComponent } from '../components/GLTFLoadedComponent'
import { InstancingComponent } from '../components/InstancingComponent'
import { MeshBVHComponent } from '../components/MeshBVHComponent'
import { ModelComponent } from '../components/ModelComponent'
import { SceneObjectComponent } from '../components/SceneObjectComponent'
import { SourceComponent } from '../components/SourceComponent'
import { serializeEntity } from './serializeWorld'

//isProxified: used to check if an object is proxified
declare module 'three/src/core/Object3D' {
  export interface Object3D {
    readonly isProxified: true | undefined
  }
}

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
    const generatedComponents = createObjectEntityFromGLTF(mesh)
    eJson.components.push(...generatedComponents)
    mesh.userData['componentJson'] = generatedComponents
  }

  return entityJson
}

export const parseGLTFModel = (entity: Entity, scene: Scene, src?: SceneID) => {
  const model = getComponent(entity, ModelComponent)
  setComponent(entity, MeshBVHComponent)

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
      const eJson = generateEntityJsonFromObject(entity, obj, entityJson[uuid], src)
      entityJson[uuid] = eJson
    })
  }

  enableObjectLayer(scene, ObjectLayers.Scene, true)

  // if the model has animations, we may have custom logic to initiate it. editor animations are loaded from `loop-animation` below
  if (scene.animations?.length) {
    setComponent(entity, AnimationComponent, {
      mixer: new AnimationMixer(scene),
      animations: scene.animations
    })
  }

  return entityJson
}

export const proxifyParentChildRelationships = (obj: Object3D) => {
  const objEntity = obj.entity
  Object.defineProperties(obj, {
    parent: {
      get() {
        if (EngineRenderer.instance?.rendering) return null
        if (getOptionalComponent(objEntity, EntityTreeComponent)?.parentEntity) {
          const result =
            getOptionalComponent(getComponent(objEntity, EntityTreeComponent).parentEntity!, GroupComponent)?.[0] ??
            Engine.instance.scene
          return result ?? null
        }
      },
      set(value) {
        throw new Error('Cannot set parent of proxified object')
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
        throw new Error('Cannot set children of proxified object')
      }
    },
    isProxified: {
      value: true
    }
  })
}

export const generateEntityJsonFromObject = (
  rootEntity: Entity,
  obj: Object3D,
  entityJson?: EntityJsonType,
  src?: SceneID
): EntityJsonType => {
  // create entity outside of scene loading reactor since we need to access it before the reactor is guaranteed to have executed
  const objEntity = UUIDComponent.getOrCreateEntityByUUID(obj.uuid as EntityUUID)
  const parentEntity = obj.parent ? obj.parent.entity : rootEntity
  const uuid = obj.uuid as EntityUUID
  const name = obj.userData['xrengine.entity'] ?? obj.name

  if (src) {
    setComponent(objEntity, SourceComponent, src)
  }

  setComponent(objEntity, SceneObjectComponent)
  setComponent(objEntity, EntityTreeComponent, {
    parentEntity,
    uuid
  })

  setComponent(objEntity, NameComponent, name)
  setComponent(objEntity, TransformComponent, {
    position: obj.position.clone(),
    rotation: obj.quaternion.clone(),
    scale: obj.scale.clone()
  })
  computeTransformMatrix(objEntity)
  addObjectToGroup(objEntity, obj)
  setComponent(objEntity, GLTFLoadedComponent, ['entity'])

  /** Proxy children with EntityTreeComponent if it exists */
  proxifyParentChildRelationships(obj)

  obj.removeFromParent = () => {
    if (getComponent(objEntity, EntityTreeComponent)?.parentEntity) {
      setComponent(objEntity, EntityTreeComponent, {
        parentEntity: UndefinedEntity
      })
    }
    return obj
  }

  const findColliderData = (obj: Object3D) => {
    if (Object.keys(obj.userData).find((key) => key.startsWith('xrengine.collider'))) {
      return true
    } else if (obj.parent) {
      return Object.keys(obj.parent.userData).some((key) => key.startsWith('xrengine.collider'))
    }
    return false
  }
  //if we're not using visible component, set visible by default
  if (
    !obj.userData['useVisible'] &&
    //if this object has a collider component attached to it, set visible to false
    !findColliderData(obj)
  ) {
    setComponent(objEntity, VisibleComponent)
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
  if (Array.isArray(obj.userData['componentJson']))
    for (const componentJson of obj.userData['componentJson'] as ComponentJsonType[]) {
      setComponent(objEntity, ComponentJSONIDMap.get(componentJson.name)!, componentJson.props)
    }
  const result: EntityJsonType = {
    name,
    components: serializeEntity(objEntity)
  }
  if (obj.parent) {
    result.parent = obj.parent.uuid as EntityUUID
  }
  return result
}
