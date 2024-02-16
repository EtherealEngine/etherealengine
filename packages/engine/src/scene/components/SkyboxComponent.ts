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
import { Color, CubeReflectionMapping, CubeTexture, EquirectangularReflectionMapping, SRGBColorSpace } from 'three'

import { config } from '@etherealengine/common/src/config'
import { NO_PROXY, getMutableState, useHookstate } from '@etherealengine/hyperflux'

import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import { defineComponent, useComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { useEntityContext } from '@etherealengine/ecs/src/EntityFunctions'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import { EngineRenderer } from '@etherealengine/spatial/src/renderer/WebGLRendererSystem'
import { useTexture } from '../../assets/functions/resourceHooks'
import { Sky } from '../classes/Sky'
import { SkyTypeEnum } from '../constants/SkyTypeEnum'
import { loadCubeMapTexture } from '../constants/Util'
import { addError, removeError } from '../functions/ErrorFunctions'

export const SkyboxComponent = defineComponent({
  name: 'SkyboxComponent',

  jsonID: 'skybox',

  onInit: (entity) => {
    return {
      backgroundColor: new Color(0x000000),
      equirectangularPath: '',
      cubemapPath: `${config.client.fileServer}/projects/default-project/assets/skyboxsun25deg/`,
      backgroundType: 1,
      sky: null! as Sky | null,
      skyboxProps: {
        turbidity: 10,
        rayleigh: 1,
        luminance: 1,
        mieCoefficient: 0.004999999999999893,
        mieDirectionalG: 0.99,
        inclination: 0.10471975511965978,
        azimuth: 0.16666666666666666
      }
    }
  },

  onSet: (entity, component, json) => {
    if (typeof json?.backgroundColor === 'number') component.backgroundColor.set(new Color(json.backgroundColor))
    if (typeof json?.equirectangularPath === 'string') component.equirectangularPath.set(json.equirectangularPath)
    if (typeof json?.cubemapPath === 'string') component.cubemapPath.set(json.cubemapPath)
    if (typeof json?.backgroundType === 'number') component.backgroundType.set(json.backgroundType)
    if (typeof json?.skyboxProps === 'object') component.skyboxProps.set(json.skyboxProps)
  },

  toJSON: (entity, component) => {
    return {
      backgroundColor: component.backgroundColor.value,
      equirectangularPath: component.equirectangularPath.value,
      cubemapPath: component.cubemapPath.value,
      backgroundType: component.backgroundType.value,
      skyboxProps: component.skyboxProps.get(NO_PROXY) as any
    }
  },

  onRemove: (entity, component) => {
    getMutableState(SceneState).background.set(null)
  },

  reactor: function () {
    const entity = useEntityContext()
    if (!isClient) return null

    const skyboxState = useComponent(entity, SkyboxComponent)
    const background = useHookstate(getMutableState(SceneState).background)

    const [texture, unload, error] = useTexture(skyboxState.equirectangularPath.value, entity)

    useEffect(() => {
      if (skyboxState.backgroundType.value !== SkyTypeEnum.equirectangular) return

      const textureValue = texture.get(NO_PROXY)
      if (textureValue) {
        textureValue.colorSpace = SRGBColorSpace
        textureValue.mapping = EquirectangularReflectionMapping
        background.set(textureValue)
        removeError(entity, SkyboxComponent, 'FILE_ERROR')
        return unload
      } else if (error.value) {
        addError(entity, SkyboxComponent, 'FILE_ERROR', error.value.message)
      }
    }, [texture, error, skyboxState.backgroundType, skyboxState.equirectangularPath])

    useEffect(() => {
      if (skyboxState.backgroundType.value !== SkyTypeEnum.color) return
      background.set(skyboxState.backgroundColor.value)
    }, [skyboxState.backgroundType, skyboxState.backgroundColor])

    useEffect(() => {
      if (skyboxState.backgroundType.value !== SkyTypeEnum.cubemap) return
      const onLoad = (texture: CubeTexture) => {
        texture.colorSpace = SRGBColorSpace
        texture.mapping = CubeReflectionMapping
        background.set(texture)
        removeError(entity, SkyboxComponent, 'FILE_ERROR')
      }
      const loadArgs: [
        string,
        (texture: CubeTexture) => void,
        ((event: ProgressEvent<EventTarget>) => void) | undefined,
        ((event: ErrorEvent) => void) | undefined
      ] = [
        skyboxState.cubemapPath.value,
        onLoad,
        undefined,
        (error) => addError(entity, SkyboxComponent, 'FILE_ERROR', error.message)
      ]
      loadCubeMapTexture(...loadArgs)
    }, [skyboxState.backgroundType, skyboxState.cubemapPath])

    useEffect(() => {
      if (skyboxState.backgroundType.value !== SkyTypeEnum.skybox) {
        if (skyboxState.sky.value) skyboxState.sky.set(null)
        return
      }

      skyboxState.sky.set(new Sky())

      const sky = skyboxState.sky.value!

      sky.azimuth = skyboxState.skyboxProps.value.azimuth
      sky.inclination = skyboxState.skyboxProps.value.inclination

      sky.mieCoefficient = skyboxState.skyboxProps.value.mieCoefficient
      sky.mieDirectionalG = skyboxState.skyboxProps.value.mieDirectionalG
      sky.rayleigh = skyboxState.skyboxProps.value.rayleigh
      sky.turbidity = skyboxState.skyboxProps.value.turbidity
      sky.luminance = skyboxState.skyboxProps.value.luminance

      const texture = sky.generateSkyboxTextureCube(EngineRenderer.instance.renderer)
      texture.mapping = CubeReflectionMapping
      background.set(texture)
      sky.dispose()
    }, [
      skyboxState.backgroundType,
      skyboxState.skyboxProps,
      skyboxState.skyboxProps.azimuth,
      skyboxState.skyboxProps.inclination,
      skyboxState.skyboxProps.mieCoefficient,
      skyboxState.skyboxProps.mieDirectionalG,
      skyboxState.skyboxProps.rayleigh,
      skyboxState.skyboxProps.turbidity,
      skyboxState.skyboxProps.luminance
    ])

    return null
  },

  errors: ['FILE_ERROR']
})
