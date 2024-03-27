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

import { Euler, Material, Matrix4, Mesh, Quaternion, Vector3 } from 'three'

import { EntityUUID, UUIDComponent, generateEntityUUID } from '@etherealengine/ecs'
import {
  Component,
  ComponentJSONIDMap,
  SerializedComponentType,
  componentJsonDefaults,
  getComponent,
  hasComponent,
  serializeComponent,
  setComponent,
  updateComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { Entity } from '@etherealengine/ecs/src/Entity'
import { SceneSnapshotAction, SceneSnapshotState, SceneState } from '@etherealengine/engine/src/scene/Scene'
import { TransformSpace } from '@etherealengine/engine/src/scene/constants/transformConstants'
import { MaterialLibraryState } from '@etherealengine/engine/src/scene/materials/MaterialLibrary'
import { materialFromId } from '@etherealengine/engine/src/scene/materials/functions/MaterialLibraryFunctions'
import { dispatchAction, getMutableState, getState } from '@etherealengine/hyperflux'
import obj3dFromUuid from '@etherealengine/spatial/src/common/functions/obj3dFromUuid'
import {
  EntityTreeComponent,
  iterateEntityNode,
  traverseEntityNode
} from '@etherealengine/spatial/src/transform/components/EntityTree'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'

import { SceneID } from '@etherealengine/common/src/schema.type.module'
import { getNestedObject } from '@etherealengine/common/src/utils/getNestedProperty'
import { SourceComponent } from '@etherealengine/engine/src/scene/components/SourceComponent'
import { ComponentJsonType } from '@etherealengine/engine/src/scene/types/SceneTypes'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import { computeTransformMatrix } from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import { EditorHelperState } from '../services/EditorHelperState'
import { EditorState } from '../services/EditorServices'
import { SelectionState } from '../services/SelectionServices'
import { filterParentEntities } from './filterParentEntities'
import { getDetachedObjectsRoots } from './getDetachedObjectsRoots'

const addOrRemoveComponent = <C extends Component<any, any>>(entities: Entity[], component: C, add: boolean) => {
  const sceneComponentID = component.jsonID
  if (!sceneComponentID) return

  //cancelGrabOrPlacement()

  const scenes: Record<SceneID, Entity[]> = {}
  for (const entity of entities) {
    const sceneID = getComponent(entity, SourceComponent)
    scenes[sceneID] ??= []
    scenes[sceneID].push(entity)
  }

  for (const [sceneID, entities] of Object.entries(scenes)) {
    const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(sceneID as SceneID)

    for (const entity of entities) {
      const entityUUID = getComponent(entity, UUIDComponent)
      let componentData = newSnapshot.data.entities[entityUUID].components
      if (add) {
        componentData = componentData.filter((c) => c.name !== sceneComponentID)
        componentData.push({
          name: sceneComponentID,
          props: componentJsonDefaults(ComponentJSONIDMap.get(sceneComponentID)!)
        })
      } else {
        const index = componentData.findIndex((c) => c.name === sceneComponentID)
        if (index > -1) componentData.splice(index, 1)
      }
      newSnapshot.data.entities[entityUUID].components = componentData
    }

    dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
  }
}

const modifyName = (entities: Entity[], name: string) => {
  //cancelGrabOrPlacement()

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)

  for (const entity of entities) {
    const entityUUID = getComponent(entity, UUIDComponent)
    const entityData = newSnapshot.data.entities[entityUUID]
    if (!entityData) continue
    entityData.name = name
  }

  dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

/**
 * Updates each property specified in 'properties' on the component for each of the specified entity nodes
 */
const modifyProperty = <C extends Component<any, any>>(
  entities: Entity[],
  component: C,
  properties: Partial<SerializedComponentType<C>>
) => {
  //cancelGrabOrPlacement()

  const scenes: Record<SceneID, Entity[]> = {}
  for (const entity of entities) {
    const source = getComponent(entity, SourceComponent)
    scenes[source] ??= []
    scenes[source].push(entity)
  }

  for (const [sceneID, entities] of Object.entries(scenes)) {
    const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(sceneID as SceneID)
    for (const entity of entities) {
      setComponent(entity, component, properties)
      const entityUUID = getComponent(entity, UUIDComponent)
      const componentSnapshot = newSnapshot.data.entities[entityUUID].components.find(
        (c) => c.name === component.jsonID
      )
      if (!componentSnapshot) continue
      if (typeof properties === 'string') {
        componentSnapshot.props = properties
      } else {
        Object.entries(properties).map(([k, v]) => {
          const { result, finalProp } = getNestedObject(componentSnapshot.props, k)
          result[finalProp] = v
        })
      }
    }
    dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
  }
}

const modifyObject3d = (nodes: string[], properties: { [_: string]: any }[]) => {
  const scene = Engine.instance.scene
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (typeof node !== 'string') return
    const obj3d = scene.getObjectByProperty('uuid', node)!
    const props = properties[i] ?? properties[0]
    Object.keys(props).map((k) => {
      const value = props[k]
      if (typeof value?.copy === 'function') {
        if (!obj3d[k]) obj3d[k] = new value.constructor()
        obj3d[k].copy(value)
      } else if (typeof value !== 'undefined' && typeof obj3d[k] === 'object' && typeof obj3d[k].set === 'function') {
        obj3d[k].set(value)
      } else {
        obj3d[k] = value
      }
    })
  }
}

function _getMaterial(node: string, materialId: string) {
  let material: Material | undefined
  if (getState(MaterialLibraryState).materials[materialId]) {
    material = materialFromId(materialId).material
  } else {
    const mesh = obj3dFromUuid(node) as Mesh
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    material = materials.find((material) => materialId === material.uuid)
  }
  if (typeof material === 'undefined' || !material.isMaterial) throw new Error('Material is missing from host mesh')
  return material
}

const modifyMaterial = (nodes: string[], materialId: string, properties: { [_: string]: any }[]) => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (typeof node !== 'string') return
    const material = _getMaterial(node, materialId)
    const props = properties[i] ?? properties[0]
    Object.entries(props).map(([k, v]) => {
      if (!material) throw new Error('Updating properties on undefined material')
      if (
        ![undefined, null].includes(v) &&
        ![undefined, null].includes(material[k]) &&
        typeof material[k] === 'object' &&
        typeof material[k].set === 'function'
      ) {
        material[k].set(v)
      } else {
        material[k] = v
      }
    })
    material.needsUpdate = true
  }
}

const createObjectFromSceneElement = (
  componentJson: ComponentJsonType[] = [],
  parentEntity?: Entity,
  beforeEntity?: Entity,
  updateSelection = true
) => {
  parentEntity = parentEntity ?? SceneState.getRootEntity(getState(EditorState).sceneID!)
  //cancelGrabOrPlacement()

  let childIndex = 0
  if (typeof beforeEntity === 'number') {
    const beforeNode = getComponent(beforeEntity, EntityTreeComponent)
    if (beforeNode?.parentEntity && hasComponent(beforeNode.parentEntity, EntityTreeComponent)) {
      childIndex = getComponent(beforeNode.parentEntity, EntityTreeComponent).children.indexOf(beforeEntity)
    }
  } else {
    const parentEntityTreeComponent = getComponent(parentEntity, EntityTreeComponent)
    childIndex = parentEntityTreeComponent.children.length
  }

  const entityUUID =
    componentJson.find((comp) => comp.name === UUIDComponent.jsonID)?.props.uuid ?? generateEntityUUID()
  if (!componentJson.some((comp) => comp.name === TransformComponent.jsonID)) {
    componentJson.push({ name: TransformComponent.jsonID })
  }
  const fullComponentJson = [...componentJson, { name: VisibleComponent.jsonID }].map((comp) => ({
    name: comp.name,
    props: {
      ...componentJsonDefaults(ComponentJSONIDMap.get(comp.name)!),
      ...comp.props
    }
  }))

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)
  // if (updateSelection) newSnapshot.selectedEntities = [entityUUID]
  newSnapshot.data.entities[entityUUID] = {
    name: componentJson[0].name,
    components: fullComponentJson,
    parent: getComponent(parentEntity, UUIDComponent),
    index: childIndex
  }

  dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

/**
 * @todo copying an object should be rooted to which object is currently selected
 */
const duplicateObject = (entities: Entity[]) => {
  //cancelGrabOrPlacement()

  const parents = [] as Entity[]

  for (const entity of entities) {
    if (!hasComponent(entity, EntityTreeComponent)) throw new Error('Parent is not defined')
    const parent = getComponent(entity, EntityTreeComponent).parentEntity
    if (!parent) throw new Error('Parent is not defined')
    parents.push(parent)
  }

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)

  const rootEntities = getDetachedObjectsRoots(entities)

  const copyMap = {} as { [entityUUID: EntityUUID | string]: EntityUUID | string }

  for (const rootEntity of rootEntities) {
    traverseEntityNode(rootEntity, (entity) => {
      const entityUUID = getComponent(entity, UUIDComponent)
      const entityData = newSnapshot.data.entities[entityUUID]
      if (!entityData) return /** @todo entity may be loaded in via GLTF **/

      const entityDataClone = JSON.parse(JSON.stringify(entityData))
      const newUUID = generateEntityUUID()
      copyMap[entityUUID] = newUUID

      const parentEntity = getComponent(entity, EntityTreeComponent).parentEntity!
      const parentEntityUUID = getComponent(parentEntity, UUIDComponent)

      if (copyMap[parentEntityUUID]) {
        entityDataClone.parent = copyMap[parentEntityUUID]
      }

      newSnapshot.data.entities[newUUID] = entityDataClone

      if (rootEntity === entity) {
        /** update index of parent with new entity */
        const parentEntityTreeComponent = getComponent(parentEntity, EntityTreeComponent)
        const index = parentEntityTreeComponent.children.indexOf(entity)
        if (index) {
          for (const [entityUUID, data] of Object.entries(newSnapshot.data.entities)) {
            if (typeof data.index !== 'number') continue
            if (data.parent === parentEntityUUID) {
              if (data.index > index) data.index++
            }
          }
        }
      }
    })
  }

  dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

const tempMatrix = new Matrix4()
const tempVector = new Vector3()

const positionObject = (
  nodes: Entity[],
  positions: Vector3[],
  space = getState(EditorHelperState).transformSpace,
  addToPosition?: boolean
) => {
  for (let i = 0; i < nodes.length; i++) {
    const entity = nodes[i]
    const pos = positions[i] ?? positions[0]

    const transform = getComponent(entity, TransformComponent)

    if (space === TransformSpace.local) {
      if (addToPosition) transform.position.add(pos)
      else transform.position.copy(pos)
    } else {
      const entityTreeComponent = getComponent(entity, EntityTreeComponent)
      const parentTransform = entityTreeComponent.parentEntity
        ? getComponent(entityTreeComponent.parentEntity, TransformComponent)
        : transform

      tempVector.set(0, 0, 0)
      if (addToPosition) {
        tempVector.setFromMatrixPosition(transform.matrixWorld)
      }
      tempVector.add(pos)

      const _spaceMatrix = parentTransform.matrixWorld
      tempMatrix.copy(_spaceMatrix).invert()
      tempVector.applyMatrix4(tempMatrix)

      transform.position.copy(tempVector)
    }

    updateComponent(entity, TransformComponent, { position: transform.position })

    iterateEntityNode(entity, (entity) => {
      computeTransformMatrix(entity)
      TransformComponent.dirtyTransforms[entity] = true
    })
  }
}

const T_QUAT_1 = new Quaternion()
const T_QUAT_2 = new Quaternion()

const rotateObject = (nodes: Entity[], rotations: Euler[], space = getState(EditorHelperState).transformSpace) => {
  for (let i = 0; i < nodes.length; i++) {
    const entity = nodes[i]

    T_QUAT_1.setFromEuler(rotations[i] ?? rotations[0])

    const transform = getComponent(entity, TransformComponent)

    if (space === TransformSpace.local) {
      transform.rotation.copy(T_QUAT_1)
    } else {
      const entityTreeComponent = getComponent(entity, EntityTreeComponent)
      const parentTransform = entityTreeComponent.parentEntity
        ? getComponent(entityTreeComponent.parentEntity, TransformComponent)
        : transform

      const _spaceMatrix = parentTransform.matrixWorld

      const inverseParentWorldQuaternion = T_QUAT_2.setFromRotationMatrix(_spaceMatrix).invert()
      const newLocalQuaternion = inverseParentWorldQuaternion.multiply(T_QUAT_1)

      transform.rotation.copy(newLocalQuaternion)
    }

    updateComponent(entity, TransformComponent, { rotation: transform.rotation })

    iterateEntityNode(entity, (entity) => {
      computeTransformMatrix(entity)
      TransformComponent.dirtyTransforms[entity] = true
    })
  }
}

const mat4 = new Matrix4()

const rotateAround = (entities: Entity[], axis: Vector3, angle: number, pivot: Vector3) => {
  const pivotToOriginMatrix = new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z)
  const originToPivotMatrix = new Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z)
  const rotationMatrix = new Matrix4().makeRotationAxis(axis, angle)

  for (const entity of entities) {
    const transform = getComponent(entity, TransformComponent)
    const entityTreeComponent = getComponent(entity, EntityTreeComponent)
    const parentTransform = entityTreeComponent.parentEntity
      ? getComponent(entityTreeComponent.parentEntity, TransformComponent)
      : transform

    new Matrix4()
      .copy(transform.matrixWorld)
      .premultiply(pivotToOriginMatrix)
      .premultiply(rotationMatrix)
      .premultiply(originToPivotMatrix)
      .premultiply(mat4.copy(parentTransform.matrixWorld).invert())
      .decompose(transform.position, transform.rotation, transform.scale)

    updateComponent(entity, TransformComponent, { rotation: transform.rotation })
  }
}

const scaleObject = (entities: Entity[], scales: Vector3[], overrideScale = false) => {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    const scale = scales[i] ?? scales[0]

    const transformComponent = getComponent(entity, TransformComponent)

    if (overrideScale) {
      transformComponent.scale.copy(scale)
    } else {
      transformComponent.scale.multiply(scale)
    }

    transformComponent.scale.set(
      transformComponent.scale.x === 0 ? Number.EPSILON : transformComponent.scale.x,
      transformComponent.scale.y === 0 ? Number.EPSILON : transformComponent.scale.y,
      transformComponent.scale.z === 0 ? Number.EPSILON : transformComponent.scale.z
    )

    updateComponent(entity, TransformComponent, { scale: transformComponent.scale })
  }
}

const reparentObject = (entities: Entity[], before?: Entity | null, parent?: Entity | null) => {
  parent = parent ?? SceneState.getRootEntity(getState(EditorState).sceneID!)
  //cancelGrabOrPlacement()

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    if (entity === parent) continue

    const currentParentEntity = getComponent(entity, EntityTreeComponent).parentEntity!
    const currentParentEntityUUID = getComponent(currentParentEntity, UUIDComponent)
    const parentEntityTreeComponent = getComponent(currentParentEntity, EntityTreeComponent)
    const currentIndex = parentEntityTreeComponent.children.indexOf(entity)

    const newParentEntityTreeComponent = getComponent(parent, EntityTreeComponent)
    const newIndex = before
      ? newParentEntityTreeComponent.children.indexOf(before as Entity)
      : newParentEntityTreeComponent.children.length

    const entityData = newSnapshot.data.entities[getComponent(entity, UUIDComponent)]
    entityData.parent = getComponent(parent, UUIDComponent)
    entityData.index = newIndex

    for (const [entityUUID, data] of Object.entries(newSnapshot.data.entities)) {
      if (typeof data.index !== 'number') continue
      if (entityUUID === getComponent(entity, UUIDComponent)) continue

      /** update indexes for old sibling entities */
      if (data.parent === currentParentEntityUUID) {
        if (data.index > currentIndex) data.index--
      }

      /** update indexes for new sibling entities */
      if (newIndex) {
        if (data.parent === getComponent(parent, UUIDComponent)) {
          if (data.index >= newIndex) data.index++
        }
      }
    }
  }

  dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

/** @todo - grouping currently doesnt take into account parentEntity or beforeEntity */
const groupObjects = (entities: Entity[]) => {
  //cancelGrabOrPlacement()

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)

  const parentEntity = SceneState.getRootEntity(getState(EditorState).sceneID!)
  const parentEntityTreeComponent = getComponent(parentEntity, EntityTreeComponent)
  const childIndex = parentEntityTreeComponent.children.length
  const parentEntityUUID = getComponent(parentEntity, UUIDComponent)

  const groupEntityUUID = generateEntityUUID()

  newSnapshot.data.entities[groupEntityUUID] = {
    name: 'New Group',
    components: [
      {
        name: TransformComponent.jsonID,
        props: {} // todo figure out where the new position should be
      },
      {
        name: VisibleComponent.jsonID,
        props: {}
      }
    ],
    parent: parentEntityUUID,
    index: childIndex
  }

  let count = 0

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    const currentParentEntity = getComponent(entity, EntityTreeComponent).parentEntity!
    const currentParentEntityUUID = getComponent(currentParentEntity, UUIDComponent)

    const parentEntityTreeComponent = getComponent(currentParentEntity, EntityTreeComponent)
    const currentIndex = parentEntityTreeComponent.children.indexOf(entity)

    const entityData = newSnapshot.data.entities[getComponent(entity, UUIDComponent)]
    entityData.parent = groupEntityUUID
    entityData.index = count++

    for (const [entityUUID, data] of Object.entries(newSnapshot.data.entities)) {
      if (typeof data.index !== 'number') continue
      if (entityUUID === getComponent(entity, UUIDComponent)) continue

      /** update indexes for old sibling entities */
      if (data.parent === currentParentEntityUUID) {
        if (data.index > currentIndex) data.index--
      }
    }
  }

  // newSnapshot.selectedEntities = [groupEntityUUID]

  dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

const removeObject = (entities: Entity[]) => {
  //cancelGrabOrPlacement()

  /** we have to manually set this here or it will cause react errors when entities are removed */
  getMutableState(SelectionState).selectedEntities.set([])

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)
  const rootEntity = SceneState.getRootEntity(getState(EditorState).sceneID!)

  const removedParentNodes = filterParentEntities(rootEntity, entities, undefined, true, false)
  for (let i = 0; i < removedParentNodes.length; i++) {
    const entity = removedParentNodes[i]
    const entityTreeComponent = getComponent(entity, EntityTreeComponent)
    if (!entityTreeComponent.parentEntity) continue
    const uuidsToDelete = iterateEntityNode(
      entity,
      (entity) => getComponent(entity, UUIDComponent),
      (entity) => hasComponent(entity, SourceComponent) && hasComponent(entity, UUIDComponent),
      false,
      false
    )
    for (const uuid of uuidsToDelete) {
      delete newSnapshot.data.entities[uuid]
    }
  }

  // newSnapshot.selectedEntities = []

  dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

const replaceSelection = (entities: EntityUUID[]) => {
  const current = getMutableState(SelectionState).selectedEntities.value

  if (entities.length === current.length) {
    let same = true
    for (let i = 0; i < entities.length; i++) {
      if (!current.includes(entities[i])) {
        same = false
        break
      }
    }
    if (same) return
  }

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)
  // newSnapshot.selectedEntities = entities.filter(Boolean) as EntityUUID[]

  SelectionState.updateSelection(entities)
  // dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

const toggleSelection = (entities: EntityUUID[]) => {
  const selectedEntities = getMutableState(SelectionState).selectedEntities.value.slice(0)

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    const index = selectedEntities.indexOf(entity)

    if (index > -1) {
      selectedEntities.splice(index, 1)
    } else {
      selectedEntities.push(entity)
    }
  }

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)
  // newSnapshot.selectedEntities = selectedEntities.filter(Boolean) as EntityUUID[]

  SelectionState.updateSelection(entities)
  // dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

const addToSelection = (entities: EntityUUID[]) => {
  const selectedEntities = getMutableState(SelectionState).selectedEntities.value.slice(0)

  for (let i = 0; i < entities.length; i++) {
    const object = entities[i]
    if (selectedEntities.includes(object)) continue
    selectedEntities.push(object)
  }

  const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(getState(EditorState).sceneID!)
  // newSnapshot.selectedEntities = selectedEntities.filter(Boolean) as EntityUUID[]

  SelectionState.updateSelection(entities)
  // dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
}

const commitTransformSave = (entities: Entity[]) => {
  const scenes: Record<SceneID, Entity[]> = {}
  for (const entity of entities) {
    const source = getComponent(entity, SourceComponent)
    scenes[source] ??= []
    scenes[source].push(entity)
  }
  for (const sceneID of Object.keys(scenes) as SceneID[]) {
    const newSnapshot = SceneSnapshotState.cloneCurrentSnapshot(sceneID)
    const sceneEntities = scenes[sceneID]
    for (const sceneEntity of sceneEntities) {
      TransformComponent.stateMap[sceneEntity]!.set((v) => v)
      const entityData = newSnapshot.data.entities[getComponent(sceneEntity, UUIDComponent)]
      const component = entityData.components.find((c) => c.name === TransformComponent.jsonID)!
      component.props = serializeComponent(sceneEntity, TransformComponent)
    }
    dispatchAction(SceneSnapshotAction.createSnapshot(newSnapshot))
  }
}

export const EditorControlFunctions = {
  addOrRemoveComponent,
  modifyProperty,
  modifyName,
  modifyObject3d,
  modifyMaterial,
  createObjectFromSceneElement,
  duplicateObject,
  positionObject,
  rotateObject,
  rotateAround,
  scaleObject,
  reparentObject,
  groupObjects,
  removeObject,
  addToSelection,
  replaceSelection,
  toggleSelection,
  commitTransformSave
}
