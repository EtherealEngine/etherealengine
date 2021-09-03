import { Entity } from '../../ecs/classes/Entity'
import { Path } from 'yuka'
import { addComponent, createMappedComponent, getComponent } from '../../ecs/functions/EntityFunctions'
import { findPath } from '../systems/AutopilotSystem'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { Vector3 } from 'three'
import { NavMeshComponent } from './NavMeshComponent'
import { WorldScene } from '../../scene/functions/SceneLoading'

/**
 * @author xiani_zp <github.com/xiani>
 */

export type AutoPilotComponentType = {
  navEntity: Entity
  path: Path
}

export const AutoPilotComponent = createMappedComponent<AutoPilotComponentType>()
