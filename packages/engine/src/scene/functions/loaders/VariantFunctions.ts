import { InstancedMesh, Material, Object3D, Vector3 } from 'three'

import { DistanceFromCameraComponent } from '@etherealengine/engine/src/transform/components/DistanceComponents'

import { AssetLoader } from '../../../assets/classes/AssetLoader'
import { pathResolver } from '../../../assets/functions/pathResolver'
import { addOBCPlugin } from '../../../common/functions/OnBeforeCompilePlugin'
import { isMobile } from '../../../common/functions/isMobile'
import { Engine } from '../../../ecs/classes/Engine'
import { Entity } from '../../../ecs/classes/Entity'
import { getComponent, getMutableComponent } from '../../../ecs/functions/ComponentFunctions'
import { TransformComponent } from '../../../transform/components/TransformComponent'
import { isMobileXRHeadset } from '../../../xr/XRState'
import { GroupComponent, addObjectToGroup, removeObjectFromGroup } from '../../components/GroupComponent'
import { InstancingComponent } from '../../components/InstancingComponent'
import { MeshComponent } from '../../components/MeshComponent'
import { ModelComponent } from '../../components/ModelComponent'
import { SceneAssetPendingTagComponent } from '../../components/SceneAssetPendingTagComponent'
import { VariantComponent, VariantLevel } from '../../components/VariantComponent'
import getFirstMesh from '../../util/meshUtils'

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

/**
 * Handles setting model src for model component based on variant component
 * @param entity
 */
export function setModelVariant(entity: Entity) {
  const variantComponent = getMutableComponent(entity, VariantComponent)
  const modelComponent = getMutableComponent(entity, ModelComponent)

  if (variantComponent.heuristic.value === 'DEVICE') {
    const targetDevice = isMobile || isMobileXRHeadset ? 'MOBILE' : 'DESKTOP'
    //set model src to mobile variant src
    const deviceVariant = variantComponent.levels.find((level) => level.value.metadata['device'] === targetDevice)
    const modelRelativePath = pathResolver().exec(modelComponent.src.value)?.[2]
    const deviceRelativePath = deviceVariant ? pathResolver().exec(deviceVariant.src.value)?.[2] : ''
    if (deviceVariant && modelRelativePath !== deviceRelativePath) {
      SceneAssetPendingTagComponent.removeResource(entity, modelComponent.src.value)
      modelComponent.src.set(deviceVariant.src.value)
    }
  } else if (variantComponent.heuristic.value === 'DISTANCE') {
    const distance = DistanceFromCameraComponent.squaredDistance[entity]
    for (let i = 0; i < variantComponent.levels.length; i++) {
      const level = variantComponent.levels[i].value
      if ([level.metadata['minDistance'], level.metadata['maxDistance']].includes(undefined)) continue
      const minDistance = Math.pow(level.metadata['minDistance'], 2)
      const maxDistance = Math.pow(level.metadata['maxDistance'], 2)
      const useLevel = minDistance <= distance && distance <= maxDistance
      if (useLevel && modelComponent.src.value !== level.src) {
        SceneAssetPendingTagComponent.removeResource(entity, modelComponent.src.value)
        modelComponent.src.set(level.src)
      }
      if (useLevel) break
    }
  }
  variantComponent.calculated.set(true)
}

export function setMeshVariant(entity: Entity) {
  const variantComponent = getComponent(entity, VariantComponent)
  const meshComponent = getComponent(entity, MeshComponent)

  if (variantComponent.heuristic === 'DEVICE') {
    const targetDevice = isMobileXRHeadset ? 'XR' : isMobile ? 'MOBILE' : 'DESKTOP'
    //set model src to mobile variant src
    const deviceVariant = variantComponent.levels.find((level) => level.metadata['device'] === targetDevice)
    if (!deviceVariant) return
    AssetLoader.load(deviceVariant.src, {}, (gltf) => {
      const mesh = getFirstMesh(gltf.scene)
      if (!mesh) return
      meshComponent.geometry = mesh.geometry
      meshComponent.material = mesh.material
    })
  }
}

export function setInstancedMeshVariant(entity: Entity) {
  const variantComponent = getComponent(entity, VariantComponent)
  const meshComponent = getComponent(entity, MeshComponent)
  const instancingComponent = getComponent(entity, InstancingComponent)
  const transformComponent = getComponent(entity, TransformComponent)
  if (variantComponent.heuristic === 'DEVICE') {
    const targetDevice = isMobileXRHeadset ? 'XR' : isMobile ? 'MOBILE' : 'DESKTOP'
    //set model src to mobile variant src
    const deviceVariant = variantComponent.levels.find((level) => level.metadata['device'] === targetDevice)
    if (!deviceVariant) return
    AssetLoader.load(deviceVariant.src, {}, (gltf) => {
      const mesh = getFirstMesh(gltf.scene)
      if (!mesh) return
      meshComponent.geometry = mesh.geometry
      meshComponent.material = mesh.material
    })
  } else if (variantComponent.heuristic === 'DISTANCE') {
    const referencedVariants: VariantLevel[] = []
    const variantIndices: number[] = []
    const cameraPosition = getComponent(Engine.instance.cameraEntity, TransformComponent).position
    const position = new Vector3()
    //complex solution: load only variants in range
    /*for (let i = 0; i < instancingComponent.instanceMatrix.count; i++) {
      //for each level, check if distance is in range
      position.set(
        instancingComponent.instanceMatrix.array[i * 16 + 12],
        instancingComponent.instanceMatrix.array[i * 16 + 13],
        instancingComponent.instanceMatrix.array[i * 16 + 14]
      )
      position.applyMatrix4(transformComponent.matrix)
      const distanceSq = cameraPosition.distanceToSquared(position)
      for (let j = 0; j < variantComponent.levels.length; j++) {
        const level = variantComponent.levels[j]
        const minDistance = Math.pow(level.metadata['minDistance'], 2)
        const maxDistance = Math.pow(level.metadata['maxDistance'], 2)
        const useLevel = minDistance <= distanceSq && distanceSq <= maxDistance
        if (useLevel) {
          if (!referencedVariants.includes(level)) {
            referencedVariants.push(level)
            variantIndices.push(j)
          }
        }
      }
    }*/

    //naive solution: load all variants
    for (let i = 0; i < variantComponent.levels.length; i++) {
      referencedVariants.push(variantComponent.levels[i])
      variantIndices.push(i)
    }
    const group = getComponent(entity, GroupComponent)
    const loadedVariants: VariantLevel[] = []
    //for levels in range, check if already loaded
    for (let i = 0; i < group.length; i++) {
      const loadedElement = group[i]
      if (!loadedElement.userData['variant']) continue
      const elementVariantData = loadedElement.userData['variant']
      const loadedVariant = referencedVariants.find(
        (variant, index) =>
          //if already loaded, check that the src and index are the same
          variant.src === elementVariantData.src && variantIndices[index] === elementVariantData.index
      )
      if (loadedVariant) {
        loadedVariants.push(loadedVariant)
        continue
      }
      //if not referenced or src is different, remove from group
      removeObjectFromGroup(entity, loadedElement)
    }
    for (let i = 0; i < referencedVariants.length; i++) {
      const referencedVariant = referencedVariants[i]
      if (loadedVariants.includes(referencedVariant)) continue //already loaded
      //if not already loaded, load src
      //add a placeholder element with src and index to group until actual variant loads
      const placeholder = new Object3D()
      placeholder.userData['variant'] = { src: referencedVariant.src, index: variantIndices[i] }
      addObjectToGroup(entity, placeholder)
      AssetLoader.load(referencedVariant.src, {}, (gltf) => {
        const minDistance = referencedVariant.metadata['minDistance']
        const maxDistance = referencedVariant.metadata['maxDistance']
        const mesh = getFirstMesh(gltf.scene)
        if (!mesh) return
        //convert to instanced mesh, using existing instance matrix
        const instancedMesh =
          mesh instanceof InstancedMesh
            ? mesh
            : new InstancedMesh(mesh.geometry, mesh.material, instancingComponent.instanceMatrix.count)
        instancedMesh.instanceMatrix = instancingComponent.instanceMatrix
        instancedMesh.frustumCulled = false

        //add distance culling shader plugin
        const materials: Material[] = Array.isArray(instancedMesh.material)
          ? instancedMesh.material
          : [instancedMesh.material]
        for (const material of materials) {
          addOBCPlugin(material, {
            id: 'lod-culling',
            priority: 1,
            compile: (shader, renderer) => {
              shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {\n',
                `
      void main() {
        float maxDistance = ${maxDistance.toFixed(1)};
        float minDistance = ${minDistance.toFixed(1)};
        // Calculate the camera distance from the geometry
        float cameraDistance = length(vViewPosition);
        // Discard fragments outside the minDistance and maxDistance range
        if (cameraDistance <= minDistance || cameraDistance >= maxDistance) {
          discard;
        }
    `
              )
            }
          })
        }
        //add variant metadata to mesh
        instancedMesh.userData['variant'] = {
          src: referencedVariant.src,
          index: variantIndices[i]
        }
        //remove placeholder
        removeObjectFromGroup(entity, placeholder)
        //add to group
        addObjectToGroup(entity, instancedMesh)
      })
    }
  }
}
