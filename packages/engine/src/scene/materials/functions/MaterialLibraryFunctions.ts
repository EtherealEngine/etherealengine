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

import { Color, Material, Texture } from 'three'

import { getMutableState, getState, getStateUnsafe, none } from '@etherealengine/hyperflux'

import { Entity } from '@etherealengine/ecs'
import { getOptionalComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import { stringHash } from '@etherealengine/spatial/src/common/functions/MathFunctions'
import { MeshComponent } from '@etherealengine/spatial/src/renderer/components/MeshComponent'
import { iterateEntityNode } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { MaterialLibraryState } from '../MaterialLibrary'
import { MaterialSelectionState } from '../MaterialLibraryState'
import { MaterialComponentType } from '../components/MaterialComponent'
import { MaterialPrototypeComponentType } from '../components/MaterialPrototypeComponent'
import { MaterialSource, MaterialSourceComponentType } from '../components/MaterialSource'
import { LibraryEntryType } from '../constants/LibraryEntry'

export function MaterialNotFoundError(message) {
  this.name = 'MaterialNotFound'
  this.message = message
}

export function PrototypeNotFoundError(message) {
  this.name = 'PrototypeNotFound'
  this.message = message
}

export function extractDefaults(defaultArgs) {
  return formatMaterialArgs(
    Object.fromEntries(Object.entries(defaultArgs).map(([k, v]: [string, any]) => [k, v.default])),
    defaultArgs
  )
}

export function injectDefaults(defaultArgs, values) {
  return Object.fromEntries(
    Object.entries(defaultArgs).map(([k, v]: [string, any]) => [k, { ...v, default: values[k] }])
  )
}

export function formatMaterialArgs(args, defaultArgs: any = undefined) {
  if (!args) return args
  return Object.fromEntries(
    Object.entries(args)
      .map(([k, v]: [string, any]) => {
        if (!!defaultArgs && defaultArgs[k]) {
          switch (defaultArgs[k].type) {
            case 'color':
              return [k, v ? ((v as Color).isColor ? v : new Color(v)) : undefined]
          }
        }
        const tex = v as Texture
        if (tex?.isTexture) {
          if (tex.source.data !== undefined) {
            return [k, v]
          }
          return [k, undefined]
        }
        if (v === '') return [k, undefined]
        return [k, v]
      })
      .filter(([_, v]) => v !== undefined)
  )
}

export function materialIsRegistered(material: Material): boolean {
  const materialLibrary = getState(MaterialLibraryState)
  return materialLibrary.materials[material.uuid] !== undefined
}

export function materialFromId(matId: string): MaterialComponentType {
  const materialLibrary = getStateUnsafe(MaterialLibraryState)
  const material = materialLibrary.materials[matId]
  if (!material) throw new MaterialNotFoundError('could not find Material with ID ' + matId)
  return material
}

export function prototypeFromId(protoId: string): MaterialPrototypeComponentType {
  const materialLibrary = getStateUnsafe(MaterialLibraryState)
  const prototype = materialLibrary.prototypes[protoId]
  if (!prototype) throw new PrototypeNotFoundError('could not find Material Prototype for ID ' + protoId)
  return prototype
}

export function materialIdToDefaultArgs(matId: string): object {
  const material = materialFromId(matId)
  const prototype = prototypeFromId(material.prototype)
  return injectDefaults(prototype.arguments, material.parameters)
}

export function protoIdToFactory(protoId: string): (parms: any) => Material {
  const prototype = prototypeFromId(protoId)
  return (parms) => {
    const defaultParms = extractDefaults(prototype.arguments)
    const formattedParms = { ...defaultParms, ...parms }
    const result = new prototype.baseMaterial(formattedParms)
    if (prototype.onBeforeCompile) {
      result.onBeforeCompile = prototype.onBeforeCompile
      result.needsUpdate = true
    }
    return result
  }
}

export function materialIdToFactory(matId: string): (parms: any) => Material {
  const material = materialFromId(matId)
  const prototype = prototypeFromId(material.prototype)
  return (parms) => {
    const formattedParms = { ...material.parameters, ...parms }
    const result = new prototype.baseMaterial(formattedParms)
    if (prototype.onBeforeCompile) {
      result.onBeforeCompile = prototype.onBeforeCompile
      result.needsUpdate = true
    }
    return result
  }
}

export function materialIdToPrototype(matId: string): MaterialPrototypeComponentType {
  return prototypeFromId(materialFromId(matId).prototype)
}

export function materialToDefaultArgs(material: Material): object {
  return materialIdToDefaultArgs(material.uuid)
}

export function hashMaterialSource(src: MaterialSource): string {
  return `${stringHash(src.path) ^ stringHash(src.type)}`
}

export function addMaterialSource(src: MaterialSource): boolean {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const srcId = hashMaterialSource(src)
  if (!materialLibrary.sources[srcId].value) {
    materialLibrary.sources[srcId].set({ src, entries: [] })
    return true
  } else return false
}

export function getSourceItems(src: MaterialSource): string[] | undefined {
  const materialLibrary = getStateUnsafe(MaterialLibraryState)
  return materialLibrary.sources[hashMaterialSource(src)]?.entries
}

export function getMaterialSource(material: Material): string | null {
  const materialLibrary = getState(MaterialLibraryState)
  const matEntry = materialLibrary.materials[material.uuid]
  if (!matEntry) return null
  return matEntry.src.path
}

export function removeMaterialSource(src: MaterialSource): boolean {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const materialSelectionState = getMutableState(MaterialSelectionState)
  const srcId = hashMaterialSource(src)
  if (materialLibrary.sources[srcId].value) {
    const srcComp = materialLibrary.sources[srcId].value
    srcComp.entries.map((matId) => {
      const toDelete = materialFromId(matId)
      if (materialSelectionState.selectedMaterial.value === matId) {
        materialSelectionState.selectedMaterial.set(null)
      }
      Object.values(toDelete.parameters)
        .filter((val) => (val as Texture)?.isTexture)
        .map((val: Texture) => val.dispose())
      toDelete.material.dispose()
      materialLibrary.materials[matId].set(none)
    })
    materialLibrary.sources[srcId].set(none)

    return true
  } else return false
}

export function registerMaterial(material: Material, src: MaterialSource, params?: { [_: string]: any }) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const prototypeId = material.userData.type ?? material.type
  addMaterialSource(src)
  const srcMats = getSourceItems(src)!
  !srcMats.includes(material.uuid) &&
    materialLibrary.sources[hashMaterialSource(src)].entries.set([
      ...materialLibrary.sources[hashMaterialSource(src)].entries.value,
      material.uuid
    ])
  try {
    const prototype = prototypeFromId(prototypeId)
    const parameters =
      params ?? Object.fromEntries(Object.keys(extractDefaults(prototype.arguments)).map((k) => [k, material[k]]))
    materialLibrary.materials[material.uuid].set({
      material,
      parameters,
      plugins: [],
      prototype: prototype.prototypeId,
      src,
      status: 'LOADED',
      instances: []
    })
  } catch (error) {
    if (error instanceof PrototypeNotFoundError) {
      console.warn('material prototype ' + prototypeId + ' not found, registering as missing material')
      materialLibrary.materials[material.uuid].set({
        material,
        parameters: params ?? {},
        plugins: [],
        prototype: prototypeId,
        src,
        status: 'MISSING',
        instances: []
      })
    } else throw error
  }

  return materialLibrary.materials[material.uuid]
}

export function unregisterMaterial(material: Material) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  try {
    const matEntry = materialFromId(material.uuid)
    const materialSelectionState = getMutableState(MaterialSelectionState)
    if (materialSelectionState.selectedMaterial.value === material.uuid) {
      materialSelectionState.selectedMaterial.set(null)
    }
    materialLibrary.materials[material.uuid].set(none)
    const srcEntry = materialLibrary.sources[hashMaterialSource(matEntry.src)].entries
    srcEntry.set(srcEntry.value.filter((matId) => matId !== material.uuid))
    if (srcEntry.value.length === 0) {
      removeMaterialSource(matEntry.src)
    }
    return matEntry
  } catch (error) {
    if (error instanceof MaterialNotFoundError) {
      console.warn('material is already not registered')
      return undefined
    } else throw error
  }
}

export function registerMaterialPrototype(prototype: MaterialPrototypeComponentType) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  if (materialLibrary.prototypes[prototype.prototypeId].value) {
    console.warn(
      'overwriting existing material prototype!\nnew:',
      prototype.prototypeId,
      '\nold:',
      prototypeFromId(prototype.prototypeId)
    )
  }
  materialLibrary.prototypes[prototype.prototypeId].set(prototype)
}

export function registerMaterialInstance(material: Material, entity: Entity) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const materialComponent = materialLibrary.materials[material.uuid]
  materialComponent.instances.set([...materialComponent.instances.value, entity])
}

export function unregisterMaterialInstance(material: Material, entity: Entity): number {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const materialComponent = materialLibrary.materials[material.uuid]
  materialComponent.instances.set(materialComponent.instances.value.filter((e) => e !== entity))
  return materialComponent.instances.value.length
}

export function materialsFromSource(src: MaterialSource) {
  return getSourceItems(src)?.map(materialFromId)
}

export function replaceMaterial(material: Material, nuMat: Material) {
  const activeSceneID = getState(SceneState).activeScene!
  const rootEntity = SceneState.getRootEntity(activeSceneID)
  iterateEntityNode(rootEntity, (entity) => {
    const mesh = getOptionalComponent(entity, MeshComponent)
    if (!mesh?.isMesh) return
    if (Array.isArray(mesh.material)) {
      mesh.material.map((meshMat, i) => {
        if (material.uuid === meshMat.uuid) {
          mesh.material[i] = nuMat
        }
      })
    } else {
      if (mesh.material.uuid === material.uuid) {
        mesh.material = nuMat
      }
    }
  })
}

export function changeMaterialPrototype(material: Material, protoId: string) {
  const materialEntry = materialFromId(material.uuid)
  if (materialEntry.prototype === protoId) return

  const prototype = prototypeFromId(protoId)

  const factory = protoIdToFactory(protoId)
  const matKeys = Object.keys(material)
  const commonParms = Object.fromEntries(
    Object.keys(prototype.arguments)
      .filter((key) => matKeys.includes(key))
      .map((key) => [key, material[key]])
  )
  const fullParms = { ...extractDefaults(prototype.arguments), ...commonParms }
  const nuMat = factory(fullParms)
  if (nuMat.plugins) {
    nuMat.customProgramCacheKey = () => nuMat.plugins!.map((plugin) => plugin.toString()).reduce((x, y) => x + y, '')
  }

  replaceMaterial(material, nuMat)
  nuMat.uuid = material.uuid
  nuMat.name = material.name
  if (material.defines?.['USE_COLOR']) {
    nuMat.defines = nuMat.defines ?? {}
    nuMat.defines!['USE_COLOR'] = material.defines!['USE_COLOR']
  }
  nuMat.userData = {
    ...nuMat.userData,
    ...Object.fromEntries(Object.entries(material.userData).filter(([k, v]) => k !== 'type'))
  }
  materialEntry.plugins.map((pluginId: string) => {})
  registerMaterial(nuMat, materialEntry.src)
  return nuMat
}

export function entryId(
  entry: MaterialComponentType | MaterialPrototypeComponentType | MaterialSourceComponentType,
  type: LibraryEntryType
) {
  switch (type) {
    case LibraryEntryType.MATERIAL:
      return (entry as MaterialComponentType).material.uuid
    case LibraryEntryType.MATERIAL_PROTOTYPE:
      return (entry as MaterialPrototypeComponentType).prototypeId
    case LibraryEntryType.MATERIAL_SOURCE:
      return hashMaterialSource((entry as MaterialSourceComponentType).src)
  }
}
