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

import { pathJoin, relativePathTo } from '@etherealengine/common/src/utils/miscUtils'
import { Material, Object3D, Object3DEventMap, Texture } from 'three'
import { materialFromId } from '../../../../scene/materials/functions/MaterialLibraryFunctions'
import { pathResolver } from '../../../functions/pathResolver'
import { GLTFExporterPlugin, GLTFWriter } from '../GLTFExporter'
import { ExporterExtension } from './ExporterExtension'

export default class ImageRoutingExtension extends ExporterExtension implements GLTFExporterPlugin {
  replacementImages: { texture: Texture; original: HTMLImageElement }[]

  constructor(writer: GLTFWriter) {
    super(writer)
    this.replacementImages = []
  }

  writeMaterial(material: Material, materialDef: { [key: string]: any }): void {
    if (this.writer.options.binary || this.writer.options.embedImages) return
    const materialComponent = materialFromId(material.uuid)
    if (!materialComponent) return
    const src = materialComponent.src
    const resolvedPath = pathResolver().exec(src.path)!
    let projectSrc = this.writer.options.projectName!
    let relativeSrc = './assets/'
    if (resolvedPath) {
      projectSrc = resolvedPath[1]
      relativeSrc = resolvedPath[2]
      relativeSrc = relativeSrc.replace(/\/[^\/]*$/, '')
    }
    const dst = this.writer.options.relativePath!.replace(/\/[^\/]*$/, '')
    const relativeBridge = relativePathTo(dst, relativeSrc)

    for (const [field, value] of Object.entries(material)) {
      if (field === 'envMap') continue
      if (value instanceof Texture) {
        const texture = value as Texture
        if (texture.image instanceof ImageBitmap) continue
        let oldURI = texture.userData.src
        if (!oldURI) {
          const resolved = pathResolver().exec(texture.image.src)!
          const oldProject = resolved[1]
          const relativeOldURL = resolved[2]
          if (oldProject !== projectSrc) {
            const srcWithProject = pathJoin(projectSrc, relativeSrc)
            const dstWithProject = pathJoin(oldProject, relativeOldURL)
            oldURI = relativePathTo(srcWithProject, dstWithProject)
          } else {
            oldURI = relativePathTo(relativeSrc, relativeOldURL)
          }
        }
        const newURI = pathJoin(relativeBridge, oldURI)
        if (!texture.image.src) {
          texture.image.src = newURI
        } else {
          this.replacementImages.push({ texture, original: texture.image })
          texture.image = { src: newURI } as any
        }
      }
    }
  }

  afterParse(input: Object3D<Object3DEventMap> | Object3D<Object3DEventMap>[]) {
    for (const { texture, original } of this.replacementImages) {
      texture.image = original
    }
  }
}
