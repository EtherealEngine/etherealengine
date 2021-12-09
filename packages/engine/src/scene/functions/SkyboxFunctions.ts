import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { Color, sRGBEncoding } from 'three'
import { isClient } from '../../common/functions/isClient'
import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import {
  addComponent,
  ComponentDeserializeFunction,
  ComponentUpdateFunction,
  getComponent,
  hasComponent,
  removeComponent
} from '../../ecs/functions/ComponentFunctions'
import { DisableTransformTagComponent } from '../../transform/components/DisableTransformTagComponent'
import { Sky } from '../classes/Sky'
import { Object3DComponent } from '../components/Object3DComponent'
import { SkyboxComponent } from '../components/SkyboxComponent'
import { SkyTypeEnum } from '../constants/SkyTypeEnum'
import {
  cubeTextureLoader,
  posx,
  negx,
  posy,
  negy,
  posz,
  negz,
  textureLoader,
  getPmremGenerator
} from '../constants/Util'
import { setSkyDirection } from './setSkyDirection'

let sky: Sky

export const createSkybox: ComponentDeserializeFunction = (entity: Entity, json: ComponentJson) => {
  if (isClient) {
    json.props.backgroundColor = new Color(json.props.backgroundColor)
    addComponent(entity, SkyboxComponent, json.props)
    addComponent(entity, DisableTransformTagComponent, {})
    updateSkybox(entity)
  }
}

export const updateSkybox: ComponentUpdateFunction = (entity: Entity) => {
  const component = getComponent(entity, SkyboxComponent)
  const hasSkyObject = hasComponent(entity, Object3DComponent)

  switch (component.backgroundType) {
    case SkyTypeEnum.color:
      Engine.scene.background = component.backgroundColor
      break

    case SkyTypeEnum.cubemap:
      cubeTextureLoader.setPath(component.cubemapPath).load(
        [posx, negx, posy, negy, posz, negz],
        (texture) => {
          texture.encoding = sRGBEncoding
          Engine.scene.background = texture
        },
        (_res) => {
          /* console.log(_res) */
        },
        (erro) => console.warn('Skybox texture could not be found!', erro)
      )
      break

    case SkyTypeEnum.equirectangular:
      textureLoader.load(component.equirectangularPath, (texture) => {
        texture.encoding = sRGBEncoding
        Engine.scene.background = getPmremGenerator().fromEquirectangular(texture).texture
      })
      break

    case SkyTypeEnum.skybox:
      sky = hasSkyObject
        ? (getComponent(entity, Object3DComponent).value as Sky)
        : (addComponent(entity, Object3DComponent, { value: new Sky() }).value as Sky)

      sky.azimuth = component.skyboxProps.azimuth
      sky.inclination = component.skyboxProps.inclination

      const uniforms = Sky.material.uniforms
      uniforms.mieCoefficient.value = component.skyboxProps.mieCoefficient
      uniforms.mieDirectionalG.value = component.skyboxProps.mieDirectionalG
      uniforms.rayleigh.value = component.skyboxProps.rayleigh
      uniforms.turbidity.value = component.skyboxProps.turbidity
      uniforms.luminance.value = component.skyboxProps.luminance
      setSkyDirection(uniforms.sunPosition.value)
      Engine.scene.background = sky.generateSkybox(Engine.renderer)
      break

    default:
      break
  }

  if (hasSkyObject && component.backgroundType !== SkyTypeEnum.skybox) {
    removeComponent(entity, Object3DComponent)
  }
}
