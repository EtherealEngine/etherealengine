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

import {
  Entity,
  PresentationSystemGroup,
  QueryReactor,
  defineQuery,
  defineSystem,
  getComponent,
  getOptionalComponent,
  useComponent,
  useEntityContext
} from '@etherealengine/ecs'
import { getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'
import { RendererState } from '@etherealengine/spatial/src/renderer/RendererState'
import { MeshComponent } from '@etherealengine/spatial/src/renderer/components/MeshComponent'
import { isArray } from 'lodash'
import React, { useEffect } from 'react'
import { SourceComponent } from '../../scene/components/SourceComponent'
import { useModelSceneID } from '../../scene/functions/loaders/ModelFunctions'
import { MaterialLibraryState } from '../../scene/materials/MaterialLibrary'
import {
  TransparencyDitheringComponent,
  injectDitheringLogic,
  maxDitherPoints
} from '../components/TransparencyDitheringComponent'

const TransparencyDitheringQuery = defineQuery([TransparencyDitheringComponent[0]])
const execute = () => {
  const basicMaterials = getState(RendererState).forceBasicMaterials
  const useBasicPrefix = basicMaterials ? 'basic-' : ''

  for (const entity of TransparencyDitheringQuery()) {
    const ditherComponent = getComponent(entity, TransparencyDitheringComponent[0])
    for (const id of ditherComponent.materialIds) {
      const materialComponent = getState(MaterialLibraryState).materials[useBasicPrefix + id]
      if (!materialComponent) continue
      const material = materialComponent.material
      for (let i = 0; i < maxDitherPoints; i++) {
        const ditherComponent = getOptionalComponent(entity, TransparencyDitheringComponent[i])
        if (!ditherComponent) break
        if (!material.shader) return
        if (material.shader.uniforms.centers) material.shader.uniforms.centers.value[i] = ditherComponent.center
        if (material.shader.uniforms.exponents) material.shader.uniforms.exponents.value[i] = ditherComponent.exponent
        if (material.shader.uniforms.distances) material.shader.uniforms.distances.value[i] = ditherComponent.distance
        if (material.shader.uniforms.useWorldCalculation)
          material.shader.uniforms.useWorldCalculation.value[i] = ditherComponent.calculationType
      }
    }
  }
}

const reactor = () => {
  return <>{<QueryReactor Components={[TransparencyDitheringComponent[0]]} ChildEntityReactor={DitherReactor} />}</>
}

const DitherReactor = () => {
  const entity = useEntityContext()
  const sceneInstanceID = useModelSceneID(entity)
  const childEntities = useHookstate(SourceComponent.entitiesBySourceState[sceneInstanceID])
  return (
    <>
      {childEntities.value?.map((childEntity) => (
        <DitherChildReactor key={childEntity} entity={childEntity} rootEntity={entity} />
      ))}
    </>
  )
}

const DitherChildReactor = (props: { entity: Entity; rootEntity: Entity }) => {
  const { entity, rootEntity } = props
  const basicMaterials = useHookstate(getMutableState(RendererState).forceBasicMaterials)
  /**check if material library state entry for materials stored in the first dithering component changes */
  const ditherComponent = useComponent(rootEntity, TransparencyDitheringComponent[0])
  const matIds = useComponent(rootEntity, TransparencyDitheringComponent[0]).materialIds
  const materialState = useHookstate(getMutableState(MaterialLibraryState))
  const materialIds = useHookstate(
    Object.keys(materialState.materials.value).filter((key) => matIds.value.includes(key.replace('basic-', '')))
  )
  useEffect(() => {
    if (!matIds.length) return
    for (const matId of materialIds.value) {
      const material = materialState.materials.value[matId]

      injectDitheringLogic(
        material.material,
        ditherComponent.center.value,
        ditherComponent.distance.value,
        ditherComponent.exponent.value
      )
    }
  }, [materialIds])

  useEffect(() => {
    const meshComponent = getOptionalComponent(entity, MeshComponent)
    if (!meshComponent) return
    const material = meshComponent.material
    const materialIds = ditherComponent.materialIds

    if (!isArray(material)) {
      /**remove basic- prefix if it exists*/
      const id = material.uuid.replace('basic-', '')
      if (!materialIds.value.find((uuid) => uuid === id))
        ditherComponent.materialIds.set([...materialIds.value, material.uuid])

      injectDitheringLogic(
        material,
        ditherComponent.center.value,
        ditherComponent.distance.value,
        ditherComponent.exponent.value
      )
    }
  }, [basicMaterials])

  return null
}

export const TransparencyDitheringSystem = defineSystem({
  uuid: 'TransparencyDitheringSystem',
  insert: { with: PresentationSystemGroup },
  execute,
  reactor
})
