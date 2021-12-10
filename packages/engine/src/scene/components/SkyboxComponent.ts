import { Color } from 'three'
import { ComponentName } from '../../common/constants/ComponentNames'
import { createMappedComponent } from '../../ecs/functions/ComponentFunctions'
import { SkyTypeEnum } from '../constants/SkyTypeEnum'

export type SkyBoxShaderProps = {
  turbidity: number
  rayleigh: number
  luminance: number
  mieCoefficient: number
  mieDirectionalG: number
  inclination: number
  azimuth: number
}

export type SkyboxComponentType = {
  backgroundColor: Color
  equirectangularPath: string
  cubemapPath: string
  backgroundType: SkyTypeEnum
  skyboxProps: SkyBoxShaderProps
}

export const SkyboxComponent = createMappedComponent<SkyboxComponentType>(ComponentName.SKYBOX)
