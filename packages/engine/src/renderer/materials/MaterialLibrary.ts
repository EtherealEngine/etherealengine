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

import { defineState, getMutableState, getState, StateDefinition } from '@etherealengine/hyperflux'

import { MaterialComponentType } from './components/MaterialComponent'
import { MaterialPluginType } from './components/MaterialPluginComponent'
import { PluginPrototypeComponentType } from './components/MaterialPluginPrototypeComponent'
import { MaterialPrototypeComponentType } from './components/MaterialPrototypeComponent'
import { MaterialSourceComponentType } from './components/MaterialSource'
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
import { registerMaterialPrototype } from './functions/MaterialLibraryFunctions'
import { registerMaterialPluginPrototype } from './functions/MaterialPluginFunctions'

export type MaterialLibraryType = {
  prototypes: Record<string, MaterialPrototypeComponentType>
  materials: Record<string, MaterialComponentType>
  pluginPrototypes: Record<string, PluginPrototypeComponentType>
  plugins: Record<string, MaterialPluginType>
  sources: Record<string, MaterialSourceComponentType>
  initialized: boolean
}

export const MaterialLibraryState: StateDefinition<MaterialLibraryType> = defineState({
  name: 'MaterialLibraryState',
  initial: {
    prototypes: {},
    materials: {},
    pluginPrototypes: {},
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
    ;[NoiseOffsetPlugin].map(registerMaterialPluginPrototype)
    getMutableState(MaterialLibraryState).initialized.set(true)
  }
}
