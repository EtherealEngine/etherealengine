import { Material } from 'three'
import matches, { Validator } from 'ts-matches'

import { defineAction, defineState, getMutableState, getState, StateDefinition } from '@etherealengine/hyperflux'

import { MaterialComponentType } from './components/MaterialComponent'
import { MaterialPluginType } from './components/MaterialPluginComponent'
import { MaterialPrototypeComponentType } from './components/MaterialPrototypeComponent'
import { MaterialSource, MaterialSourceComponentType } from './components/MaterialSource'
import MeshBasicMaterial from './constants/material-prototypes/MeshBasicMaterial.mat'
import MeshLambertMaterial from './constants/material-prototypes/MeshLambertMaterial.mat'
import MeshMatcapMaterial from './constants/material-prototypes/MeshMatcapMaterial.mat'
import MeshPhongMaterial from './constants/material-prototypes/MeshPhongMaterial.mat'
import MeshPhysicalMaterial from './constants/material-prototypes/MeshPhysicalMaterial.mat'
import MeshStandardMaterial from './constants/material-prototypes/MeshStandardMaterial.mat'
import MeshToonMaterial from './constants/material-prototypes/MeshToonMaterial.mat'
import { ShaderMaterial } from './constants/material-prototypes/ShaderMaterial.mat'
import { ShadowMaterial } from './constants/material-prototypes/ShadowMaterial.mat'
import { NoiseOffsetPlugin } from './constants/plugins/NoiseOffsetPlugin'
import { VegetationPlugin } from './constants/plugins/VegetationPlugin'
import { registerMaterialPrototype } from './functions/MaterialLibraryFunctions'
import { registerMaterialPlugin } from './functions/MaterialPluginFunctions'

export type MaterialLibraryType = {
  prototypes: Record<string, MaterialPrototypeComponentType>
  materials: Record<string, MaterialComponentType>
  plugins: Record<string, MaterialPluginType>
  sources: Record<string, MaterialSourceComponentType>
  initialized: boolean
}

export const MaterialLibraryState: StateDefinition<MaterialLibraryType> = defineState({
  name: 'MaterialLibraryState',
  initial: {
    prototypes: {},
    materials: {},
    plugins: {},
    sources: {},
    initialized: false
  } as MaterialLibraryType
})

export function initializeMaterialLibrary() {
  const materialLibrary = getState(MaterialLibraryState)
  //load default prototypes from source
  if (!materialLibrary.initialized) {
    ;[
      MeshBasicMaterial,
      MeshStandardMaterial,
      MeshMatcapMaterial,
      MeshPhysicalMaterial,
      MeshLambertMaterial,
      MeshPhongMaterial,
      MeshToonMaterial,
      ShaderMaterial,
      ShadowMaterial
    ].map(registerMaterialPrototype)

    //load default plugins from source
    ;[NoiseOffsetPlugin, VegetationPlugin].map(registerMaterialPlugin)
    getMutableState(MaterialLibraryState).initialized.set(true)
  }
}
