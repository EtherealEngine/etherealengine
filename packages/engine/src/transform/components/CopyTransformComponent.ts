import { Entity } from '../../ecs/classes/Entity'
import { createMappedComponent } from '../../ecs/functions/EntityFunctions'

type CopyTransformComponentType = {
  input: Entity
}

export const CopyTransformComponent = createMappedComponent<CopyTransformComponentType>()