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

import { Material } from 'three'

import { getMutableState, getState, none } from '@etherealengine/hyperflux'

import { addOBCPlugin, removeOBCPlugin } from '../../../common/functions/OnBeforeCompilePlugin'
import { MaterialLibraryState } from '../MaterialLibrary'
import { MaterialPluginType } from '../components/MaterialPluginComponent'
import { PluginPrototypeComponentType } from '../components/MaterialPluginPrototypeComponent'
import { addMaterialSource, getSourceItems } from './MaterialLibraryFunctions'

export function pluginPrototypeFromId(pluginId: string) {
  const materialLibrary = getState(MaterialLibraryState)
  return materialLibrary.pluginPrototypes[pluginId]
}

export function registerMaterialPluginPrototype(component: PluginPrototypeComponentType) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const src = component.src
  addMaterialSource(src)
  const srcItems = getSourceItems(src)!
  materialLibrary.pluginPrototypes[component.prototypeId].set(component)
}

export function unregisterMaterialPlugin(component: PluginPrototypeComponentType) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const srcItems = getSourceItems(component.src)!
  materialLibrary.pluginPrototypes[component.prototypeId].set(none)
}
/*
export function pluginPrototypeFromId(protoId: string): PluginPrototypeComponentType {
  const materialLibrary = getState(MaterialLibraryState)
  const pluginPrototype = materialLibrary.plugins[protoId]
  if (!pluginPrototype) throw new PrototypeNotFoundError('could not find Material Prototype for ID ' + protoId)
  return pluginPrototype
}
export function pluginProtoIdToFactory(pluginProtoId: string): (parms: any) => Plugin {
  const pluginPrototype = pluginPrototypeFromId(pluginProtoId);
  
  return (parms) => {
    const defaultParms = extractDefaults(pluginPrototype.parameter);
    const formattedParms = { ...defaultParms, ...parms };
    const result = new Plugin(pluginPrototype);
  
    if (pluginPrototype.onBeforeCompile) {
      result.onBeforeCompile = pluginPrototype.onBeforeCompile;
      result.needsUpdate = true;
    }

    return result;
  };
}*/
/*export function applyMaterialPlugin(material: Material, pluginId: string) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const pluginComponent = materialLibrary.plugins[pluginId]
  if (!pluginComponent?.plugin?.value) {
    console.warn('Unsupported material plugin ' + pluginId)
    return
  }
  addOBCPlugin(material, pluginComponent.plugin.get(NO_PROXY))
}*/

export function applyMaterialPlugin(material: Material, plugin: MaterialPluginType) {
  const materialLibrary = getMutableState(MaterialLibraryState)
  const pluginPrototype = pluginPrototypeFromId(plugin.pluginProtoID)
  //const internal_state = getInternalState(plugin.internal_state)
  if (!pluginPrototype) {
    console.warn('Unsupported material plugin ' + plugin)
    return
  }
  //attach internal_state to onbefore compile
  addOBCPlugin(material, pluginPrototype.pluginObject)
}

export function removeMaterialPlugin(material: Material, plugin: MaterialPluginType) {
  const pluginPrototype = pluginPrototypeFromId(plugin.pluginProtoID)
  removeOBCPlugin(material, pluginPrototype.pluginObject)
  material.needsUpdate = true
}

export function serializeMaterialPlugin(plugin: MaterialPluginType) {
  const prototype = pluginPrototypeFromId(plugin.pluginProtoID)
  return {
    prototype: plugin.pluginProtoID,
    parameters: Object.entries(plugin.parameters).map(([k, v]) => {
      const schema = prototype.parameters[k]
      return {
        type: schema.type,
        contents: v
      }
    })
  }
}
