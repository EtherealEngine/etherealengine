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

import { Mesh, Object3D } from 'three'

import { getState } from '@etherealengine/hyperflux'

import { IntersectObject, MaterialLibraryState } from '../../../../renderer/materials/MaterialLibrary'
import { SourceType } from '../../../../renderer/materials/components/MaterialSource'
import {
  extractDefaults,
  prototypeFromId,
  registerMaterial
} from '../../../../renderer/materials/functions/MaterialLibraryFunctions'
import iterateObject3D from '../../../../scene/util/iterateObject3D'
import { GLTF, GLTFLoaderPlugin } from '../GLTFLoader'
import { ImporterExtension } from './ImporterExtension'

export function registerMaterials(root: Object3D, type: SourceType = SourceType.EDITOR_SESSION, path = '') {
  const materialLibrary = getState(MaterialLibraryState)
  const intersected = getState(IntersectObject)
  iterateObject3D(root, (mesh: Mesh) => {
    //root.traverse((mesh: Mesh) => {
    if (!mesh?.isMesh) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

    materials
      .filter((material) => !materialLibrary.materials[material.uuid])
      .map((material) => {
        const materialComponent = registerMaterial(material, { type, path })
        material.userData?.plugins && materialComponent.plugins.set(material.userData['plugins'])
        iterateObject3D(intersected.intersected.object, (mesh: Mesh) => {
          if (!mesh?.isMesh) return
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((mat) => {
            const prototypeId = mat.userData.type ?? mat.type
            const prototype = prototypeFromId(prototypeId)
            const parameters = Object.fromEntries(
              Object.keys(extractDefaults(prototype.arguments)).map((k) => [k, mat[k]])
            )
            const prototypeId2 = material.userData.type ?? material.type
            const prototype2 = prototypeFromId(prototypeId)
            const parameters2 = Object.fromEntries(
              Object.keys(extractDefaults(prototype.arguments)).map((k) => [k, material[k]])
            )
            parameters.color = parameters2.color
            mat.setValues(parameters)
            // parameters.color.r=1.0
            // parameters.color.g=0.0
            // parameters.color.b=0.0
          })
        })
      })
  })
}

export default class RegisterMaterialsExtension extends ImporterExtension implements GLTFLoaderPlugin {
  name = 'EE_RegisterMaterialsExtension'
  async afterRoot(result: GLTF) {
    const parser = this.parser
    registerMaterials(result.scene, SourceType.MODEL, parser.options.url)
  }
}
