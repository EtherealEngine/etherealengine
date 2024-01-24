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

import { useEffect } from 'react'

import { getMutableState, getState } from '@etherealengine/hyperflux'

import { defineComponent, useComponent } from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { RenderSettingsState } from '../../renderer/WebGLRendererSystem'

export const RenderSettingsComponent = defineComponent({
  name: 'RenderSettingsComponent',
  jsonID: 'render-settings',

  onInit(entity): typeof RenderSettingsState._TYPE {
    return typeof RenderSettingsState.initial === 'function'
      ? (RenderSettingsState.initial as any)()
      : JSON.parse(JSON.stringify(RenderSettingsState.initial))
  },

  onSet: (entity, component, json) => {
    if (!json) return

    if (typeof json.primaryLight === 'string') component.primaryLight.set(json.primaryLight)
    if (typeof json.csm === 'boolean') component.csm.set(json.csm)
    if (typeof json.toneMapping === 'number') component.toneMapping.set(json.toneMapping)
    if (typeof json.toneMappingExposure === 'number') component.toneMappingExposure.set(json.toneMappingExposure)
    if (typeof json.shadowMapType === 'number') component.shadowMapType.set(json.shadowMapType)
  },

  toJSON: (entity, component) => {
    return {
      primaryLight: component.primaryLight.value,
      csm: component.csm.value,
      toneMapping: component.toneMapping.value,
      toneMappingExposure: component.toneMappingExposure.value,
      shadowMapType: component.shadowMapType.value
    }
  },

  reactor: () => {
    const entity = useEntityContext()
    const component = useComponent(entity, RenderSettingsComponent)

    for (const prop of Object.keys(getState(RenderSettingsState))) {
      useEffect(() => {
        if (component[prop].value !== getState(RenderSettingsState)[prop])
          getMutableState(RenderSettingsState)[prop].set(component[prop].value)
      }, [component[prop]])
    }

    return null
  }
})
