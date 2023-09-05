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
import { MathUtils, Mesh, Vector3 } from 'three'

import { getMutableState, useHookstate } from '@etherealengine/hyperflux'

import { defineComponent, useComponent } from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { GroupComponent } from '../../scene/components/GroupComponent'
import { RendererState } from '../RendererState'
import { EngineRenderer, PostProcessingSettingsState } from '../WebGLRendererSystem'

export const HighlightComponent = defineComponent({
  name: 'HighlightComponent',

  reactor: function () {
    const entity = useEntityContext()

    const postProcessingSettingsState = useHookstate(getMutableState(PostProcessingSettingsState))
    const usePostProcessing = useHookstate(getMutableState(RendererState).usePostProcessing)
    const group = useComponent(entity, GroupComponent)

    useEffect(() => {
      const objs = [...group.value]
      for (const object of objs)
        object.traverse((obj) => {
          obj.type === 'Mesh' && addToSelection(obj as Mesh)
        })
      return () => {
        for (const object of objs)
          object.traverse((obj) => {
            obj.type === 'Mesh' && removeFromSelection(obj as Mesh)
          })
      }
    }, [group, postProcessingSettingsState.effects, postProcessingSettingsState.enabled, usePostProcessing])

    return null
  }
})

const animateScale = (obj: Mesh, v: Vector3) => {
  let start = 0.0
  function animate(timeStamp) {
    if (start === 0.0) start = timeStamp
    const elapsed = timeStamp - start
    obj.scale.lerp(v, MathUtils.damp(0, 1, 0.01, elapsed))

    if (obj.scale.x !== v.x) {
      requestAnimationFrame(animate)
    }
  }
  requestAnimationFrame(animate)
}

const addToSelection = (obj: Mesh) => {
  if (!EngineRenderer.instance.effectComposer?.HighlightEffect) return
  animateScale(obj, new Vector3(1.1, 1.1, 1.1))
  EngineRenderer.instance.effectComposer.HighlightEffect.selection.add(obj)
}

const removeFromSelection = (obj: Mesh) => {
  if (!EngineRenderer.instance.effectComposer?.HighlightEffect) return
  animateScale(obj, new Vector3(1, 1, 1))
  EngineRenderer.instance.effectComposer.HighlightEffect.selection.delete(obj)
}
