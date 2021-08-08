import { Body } from 'three-physx'
import { createMappedComponent } from '../../ecs/functions/EntityFunctions'

/**
 * @author HydraFire <github.com/HydraFire>
 */

type ColliderComponentType = {
  body: Body
}

export const ColliderComponent = createMappedComponent<ColliderComponentType>()