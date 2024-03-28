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

import { Entity, defineComponent } from '@etherealengine/ecs'
import { defineState, matches } from '@etherealengine/hyperflux'
import { matchesVector3 } from '@etherealengine/spatial/src/common/functions/MatchesUtils'
import { addOBCPlugin } from '@etherealengine/spatial/src/common/functions/OnBeforeCompilePlugin'
import { FrontSide, Material, Vector3 } from 'three'
import {
  ditheringAlphatestChunk,
  ditheringFragUniform,
  ditheringVertex,
  ditheringVertexUniform
} from '../functions/ditherShaderChunk'

export enum ditherCalculationType {
  worldTransformed = 1,
  localPosition = 0
}

export const transparencyDitheringState = defineState({
  name: 'transparencyDitheringState',
  initial: { materialIds: {} as Record<Entity, string[]> }
})

export const maxDitherPoints = 4 //should be equal to the length of the vec3 array in the shader
export const TransparencyDitheringComponent = Array.from({ length: maxDitherPoints }, (_, i) => {
  return defineComponent({
    name: `TransparencyDitheringComponent${i}`,
    onInit: (entity) => {
      return {
        center: new Vector3(),
        distance: 2,
        exponent: 2,
        calculationType: ditherCalculationType.worldTransformed,
        //internal
        materialIds: [] as string[]
      }
    },

    onSet: (entity, component, json) => {
      if (!json) return
      if (matchesVector3.test(json.center)) component.center.set(new Vector3().copy(json.center))
      if (matches.number.test(json.distance)) component.distance.set(json.distance)
      if (matches.number.test(json.exponent)) component.exponent.set(json.exponent)
      if (matches.number.test(json.calculationType)) component.calculationType.set(json.calculationType)
    }
  })
})

export const injectDitheringLogic = (material: Material, center: Vector3, distance: number, exponent: number) => {
  material.alphaTest = 0.5
  material.side = FrontSide
  addOBCPlugin(material, {
    id: 'transparency-dithering',
    priority: 10,
    compile: (shader, renderer) => {
      if (!shader.vertexShader.startsWith('varying vec3 vWorldPosition')) {
        shader.vertexShader = shader.vertexShader.replace(
          /#include <common>/,
          '#include <common>\n' + ditheringVertexUniform
        )
      }
      shader.vertexShader = shader.vertexShader.replace(
        /#include <worldpos_vertex>/,
        '	#include <worldpos_vertex>\n' + ditheringVertex
      )
      if (!shader.fragmentShader.startsWith('varying vec3 vWorldPosition'))
        shader.fragmentShader = shader.fragmentShader.replace(
          /#include <common>/,
          '#include <common>\n' + ditheringFragUniform
        )
      shader.fragmentShader = shader.fragmentShader.replace(/#include <alphatest_fragment>/, ditheringAlphatestChunk)
      shader.uniforms.centers = {
        value: Array.from({ length: maxDitherPoints }, () => new Vector3())
      }
      shader.uniforms.exponents = { value: Array.from({ length: maxDitherPoints }, () => exponent) }
      shader.uniforms.distances = { value: Array.from({ length: maxDitherPoints }, () => distance) }
      shader.uniforms.useWorldCalculation = { value: Array.from({ length: maxDitherPoints }, () => 1) }
      shader.uniforms.maxDitherPoints = { value: 1 }

      material.shader = shader
    }
  })
}
