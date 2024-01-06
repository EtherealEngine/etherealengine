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

import { SceneID } from '@etherealengine/common/src/schema.type.module'
import { Object3D } from 'three'
import { Entity } from '../../../../ecs/classes/Entity'
import { getComponent, setComponent } from '../../../../ecs/functions/ComponentFunctions'
import { EntityTreeComponent, iterateEntityNode } from '../../../../ecs/functions/EntityTree'
import { SourceComponent } from '../../../../scene/components/SourceComponent'
import { getModelSceneID } from '../../../../scene/functions/loaders/ModelFunctions'
import { GLTFExporterPlugin, GLTFWriter } from '../GLTFExporter'
import { ExporterExtension } from './ExporterExtension'

export default class SourceHandlerExtension extends ExporterExtension implements GLTFExporterPlugin {
  entitySet: { entity: Entity; parent: Entity }[]
  constructor(writer: GLTFWriter) {
    super(writer)
    this.name = 'EE_sourceHandler'
    this.entitySet = [] as { entity: Entity; parent: Entity }[]
  }

  beforeParse(input: Object3D | Object3D[]) {
    //we allow saving of any object that has a source equal to or parent of the root's source
    const validSrcs: Set<SceneID> = new Set()
    validSrcs.add(getModelSceneID(this.writer.options.srcEntity!))
    const root = (Array.isArray(input) ? input[0] : input) as Object3D
    let walker: Entity | null = root.entity
    while (walker !== null) {
      const src = getComponent(walker, SourceComponent)
      if (src) validSrcs.add(src)
      walker = getComponent(walker, EntityTreeComponent)?.parentEntity ?? null
    }
    iterateEntityNode(
      root.entity,
      (entity) => {
        const entityTree = getComponent(entity, EntityTreeComponent)
        if (!entityTree || !entityTree.parentEntity) return
        this.entitySet.push({ entity, parent: entityTree.parentEntity })
        setComponent(entity, EntityTreeComponent, { parentEntity: null })
      },
      (entity) => {
        const src = getComponent(entity, SourceComponent)
        return src && !validSrcs.has(src)
      }
    )
  }

  afterParse(input: Object3D) {
    this.entitySet.forEach(({ entity, parent }) => {
      setComponent(entity, EntityTreeComponent, { parentEntity: parent })
    })
  }
}
