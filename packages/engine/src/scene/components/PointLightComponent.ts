import { Color, Vector2 } from 'three'
import { createMappedComponent } from '../../ecs/functions/ComponentFunctions'

export type PointLightComponentType = {
  color: Color
  intensity: number
  range: number
  decay: number
  castShadow: boolean
  shadowMapResolution: Vector2
  shadowBias: number
  shadowRadius: number
}

export const PointLightComponent = createMappedComponent<PointLightComponentType>('PointLightComponent')
