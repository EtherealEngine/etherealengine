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

import { UUIDComponent } from '@etherealengine/ecs'
import {
  defineComponent,
  getComponent,
  getOptionalComponent,
  hasComponent,
  setComponent,
  useComponent,
  useOptionalComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Entity, UndefinedEntity } from '@etherealengine/ecs/src/Entity'
import {
  createEntity,
  generateEntityUUID,
  removeEntity,
  useEntityContext
} from '@etherealengine/ecs/src/EntityFunctions'
import { getMutableState, useState } from '@etherealengine/hyperflux'
import { EngineState } from '@etherealengine/spatial/src/EngineState'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { addObjectToGroup, removeObjectFromGroup } from '@etherealengine/spatial/src/renderer/components/GroupComponent'
import { MeshComponent } from '@etherealengine/spatial/src/renderer/components/MeshComponent'
import {
  ObjectLayerMaskComponent,
  setObjectLayers
} from '@etherealengine/spatial/src/renderer/components/ObjectLayerComponent'
import { VisibleComponent } from '@etherealengine/spatial/src/renderer/components/VisibleComponent'
import { ObjectLayers } from '@etherealengine/spatial/src/renderer/constants/ObjectLayers'
import { EntityTreeComponent, iterateEntityNode } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'
import { computeTransformMatrix } from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import { useEffect } from 'react'
import { Box3, BufferGeometry, LineBasicMaterial, LineSegments, Matrix4, Mesh, Quaternion, Vector3 } from 'three'
import { SceneAssetPendingTagComponent } from './SceneAssetPendingTagComponent'

function createBBoxGridHelper(matrixWorld: Matrix4, bbox: Box3, density: number): LineSegments {
  const lineSegmentList: Vector3[] = []
  const size = new Vector3()
  bbox.getSize(size)

  // Create grid lines for each face of the bounding box

  // Front and back faces (parallel to XY plane)
  const zFront = bbox.min.z
  const zBack = bbox.max.z
  for (let j = 0; j <= density; j++) {
    const segmentFraction = j / density
    const x = bbox.min.x + segmentFraction * size.x
    const y = bbox.min.y + segmentFraction * size.y

    lineSegmentList.push(new Vector3(x, bbox.min.y, zFront), new Vector3(x, bbox.max.y, zFront))
    lineSegmentList.push(new Vector3(x, bbox.min.y, zBack), new Vector3(x, bbox.max.y, zBack))
    lineSegmentList.push(new Vector3(bbox.min.x, y, zFront), new Vector3(bbox.max.x, y, zFront))
    lineSegmentList.push(new Vector3(bbox.min.x, y, zBack), new Vector3(bbox.max.x, y, zBack))
  }

  // Top and bottom faces (parallel to XZ plane)
  const yTop = bbox.max.y
  const yBottom = bbox.min.y
  for (let j = 0; j <= density; j++) {
    const segmentFraction = j / density
    const x = bbox.min.x + segmentFraction * size.x
    const z = bbox.min.z + segmentFraction * size.z

    lineSegmentList.push(new Vector3(x, yTop, bbox.min.z), new Vector3(x, yTop, bbox.max.z))
    lineSegmentList.push(new Vector3(x, yBottom, bbox.min.z), new Vector3(x, yBottom, bbox.max.z))
    lineSegmentList.push(new Vector3(bbox.min.x, yTop, z), new Vector3(bbox.max.x, yTop, z))
    lineSegmentList.push(new Vector3(bbox.min.x, yBottom, z), new Vector3(bbox.max.x, yBottom, z))
  }

  // Left and right faces (parallel to YZ plane)
  const xLeft = bbox.min.x
  const xRight = bbox.max.x
  for (let j = 0; j <= density; j++) {
    const segmentFraction = j / density
    const y = bbox.min.y + segmentFraction * size.y
    const z = bbox.min.z + segmentFraction * size.z

    lineSegmentList.push(new Vector3(xLeft, y, bbox.min.z), new Vector3(xLeft, y, bbox.max.z))
    lineSegmentList.push(new Vector3(xRight, y, bbox.min.z), new Vector3(xRight, y, bbox.max.z))
    lineSegmentList.push(new Vector3(xLeft, bbox.min.y, z), new Vector3(xLeft, bbox.max.y, z))
    lineSegmentList.push(new Vector3(xRight, bbox.min.y, z), new Vector3(xRight, bbox.max.y, z))
  }
  for (let i = 0; i < lineSegmentList.length; i++) {
    lineSegmentList[i].applyMatrix4(matrixWorld)
  }
  const result = new LineSegments(
    new BufferGeometry().setFromPoints(lineSegmentList),
    new LineBasicMaterial({ color: 0xff0000 })
  )
  return result
}

export const ObjectGridSnapComponent = defineComponent({
  name: 'ObjectGridSnapComponent',

  onInit: (entity) => {
    return {
      bbox: new Box3(),
      helper: null as Entity | null
    }
  },
  onSet: (entity, component, json) => {
    if (!json) return
    //if (typeof json.density === 'number') component.density.set(json.density)
    if (typeof json.bbox === 'object' && json.bbox.isBox3) component.bbox.set(json.bbox)
    if (typeof json.helper === 'number') component.helper.set(json.helper)
  },
  reactor: () => {
    const entity = useEntityContext()

    const engineState = useState(getMutableState(EngineState))
    const snapComponent = useComponent(entity, ObjectGridSnapComponent)

    const assetLoading = useOptionalComponent(entity, SceneAssetPendingTagComponent)
    useEffect(() => {
      const helper = createEntity()
      setComponent(helper, NameComponent, 'helper')
      setComponent(helper, VisibleComponent)
      setComponent(helper, TransformComponent)
      setComponent(helper, UUIDComponent, generateEntityUUID())
      setComponent(helper, EntityTreeComponent, { parentEntity: entity })
      setComponent(helper, ObjectLayerMaskComponent, ObjectLayers.NodeHelper)

      setComponent(entity, ObjectGridSnapComponent, { helper })
      return () => {
        const helper = getOptionalComponent(entity, ObjectGridSnapComponent)?.helper
        !!helper && removeEntity(helper)
      }
    }, [])

    useEffect(() => {
      if (assetLoading?.value) return
      const originalPosition = new Vector3()
      const originalRotation = new Quaternion()
      const originalScale = new Vector3()
      const originalParent = getComponent(entity, EntityTreeComponent).parentEntity
      const transform = getComponent(entity, TransformComponent)
      transform.matrix.decompose(originalPosition, originalRotation, originalScale)
      //set entity transform to identity before calculating bounding box
      setComponent(entity, EntityTreeComponent, { parentEntity: UndefinedEntity })
      transform.matrixWorld.identity()
      TransformComponent.updateFromWorldMatrix(entity)
      const meshes: Mesh[] = []
      //iterate through children and update their transforms to reflect identity from parent
      iterateEntityNode(entity, (childEntity: Entity) => {
        computeTransformMatrix(childEntity)
        if (hasComponent(childEntity, MeshComponent)) {
          meshes.push(getComponent(childEntity, MeshComponent))
        }
      })
      //compute bounding box
      const bbox = new Box3()
      if (meshes.length > 0) {
        bbox.setFromObject(meshes[0])
        for (let i = 1; i < meshes.length; i++) {
          bbox.expandByObject(meshes[i])
        }
      }

      //set entity transform back to original
      setComponent(entity, EntityTreeComponent, { parentEntity: originalParent })
      setComponent(entity, TransformComponent, {
        position: originalPosition,
        rotation: originalRotation,
        scale: originalScale
      })
      iterateEntityNode(entity, computeTransformMatrix)
      //set bounding box in component
      setComponent(entity, ObjectGridSnapComponent, {
        bbox
      })
    }, [assetLoading])

    useEffect(() => {
      if (!engineState.isEditing.value) return
      const bbox = snapComponent.bbox.value
      const helperEntity = snapComponent.helper.value
      if (!helperEntity) return
      const matrixWorld = getComponent(helperEntity, TransformComponent).matrixWorld
      const helperMesh = createBBoxGridHelper(new Matrix4().identity(), bbox, 2)
      addObjectToGroup(helperEntity, helperMesh)
      setObjectLayers(helperMesh, ObjectLayers.NodeHelper)
      return () => {
        removeObjectFromGroup(helperEntity, helperMesh)
      }
    }, [snapComponent.bbox, snapComponent.helper, engineState.isEditing])

    return null
  }
})
