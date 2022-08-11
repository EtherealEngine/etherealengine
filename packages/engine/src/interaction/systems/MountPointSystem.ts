import { Not } from 'bitecs'
import { Vector3 } from 'three'

import { Deg2Rad } from '@xrengine/common/src/utils/mathUtils'
import { createActionQueue } from '@xrengine/hyperflux'

import { changeState } from '../../avatar/animation/AnimationGraph'
import { AvatarStates } from '../../avatar/animation/Util'
import { AvatarAnimationComponent } from '../../avatar/components/AvatarAnimationComponent'
import { AvatarComponent } from '../../avatar/components/AvatarComponent'
import { AvatarControllerComponent } from '../../avatar/components/AvatarControllerComponent'
import checkPositionIsValid from '../../common/functions/checkPositionIsValid'
import { Engine } from '../../ecs/classes/Engine'
import { EngineActions } from '../../ecs/classes/EngineState'
import { World } from '../../ecs/classes/World'
import {
  addComponent,
  defineQuery,
  getComponent,
  hasComponent,
  removeComponent
} from '../../ecs/functions/ComponentFunctions'
import { Physics } from '../../physics/classes/Physics'
import { CollisionGroups } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { RaycastHit, SceneQueryType } from '../../physics/types/PhysicsTypes'
import { MountPoint, MountPointComponent } from '../../scene/components/MountPointComponent'
import { SittingComponent } from '../../scene/components/SittingComponent'
import { DesiredTransformComponent } from '../../transform/components/DesiredTransformComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { createInteractUI } from '../functions/interactUI'
import { addInteractableUI } from './InteractiveSystem'

/**
 * @todo refactor this into i18n and configurable
 */
const mountPointInteractMessages = {
  [MountPoint.seat]: 'Press E to Sit'
}

export default async function MountPointSystem(world: World) {
  if (Engine.instance.isEditor) return () => {}

  const mountPointActionQueue = createActionQueue(EngineActions.interactedWithObject.matches)
  const mountPointQuery = defineQuery([MountPointComponent])
  const sittingTransitionQuery = defineQuery([SittingComponent, DesiredTransformComponent])
  const sittingIdleQuery = defineQuery([SittingComponent, Not(DesiredTransformComponent)])

  const diffPos = new Vector3()
  const PositionEpsilon = 0.1
  const RotationEpsilon = 1 * Deg2Rad()

  return () => {
    for (const entity of mountPointQuery.enter()) {
      const mountPoint = getComponent(entity, MountPointComponent)
      addInteractableUI(entity, createInteractUI(entity, mountPointInteractMessages[mountPoint.type]))
    }

    for (const action of mountPointActionQueue()) {
      if (action.$from !== Engine.instance.userId) continue
      if (!hasComponent(action.targetEntity, MountPointComponent)) continue

      const mountPoint = getComponent(action.targetEntity, MountPointComponent)
      if (mountPoint.type === MountPoint.seat) {
        const avatarEntity = Engine.instance.currentWorld.localClientEntity

        if (hasComponent(avatarEntity, SittingComponent)) continue

        // Add desired transform component to move the avatar to mounting point
        const transform = getComponent(action.targetEntity, TransformComponent)
        const desiredTransform = addComponent(avatarEntity, DesiredTransformComponent, {
          position: transform.position.clone(),
          rotation: transform.rotation.clone(),
          positionRate: 2,
          rotationRate: 2,
          lockRotationAxis: [false, false, false],
          positionDelta: 0,
          rotationDelta: 0
        }) // set the desired transform at the same height as avatar.
        desiredTransform.position.y = transform.position.y

        addComponent(avatarEntity, SittingComponent, {
          mountPointEntity: action.targetEntity,
          state: AvatarStates.SIT_ENTER
        })
        getComponent(avatarEntity, AvatarControllerComponent).movementEnabled = false
      }
    }

    for (const entity of sittingTransitionQuery(world)) {
      const controllerComponent = getComponent(entity, AvatarControllerComponent)
      const transform = getComponent(entity, TransformComponent)
      const avatar = getComponent(entity, AvatarComponent)
      const desiredTransform = getComponent(entity, DesiredTransformComponent)
      const sitting = getComponent(entity, SittingComponent)

      controllerComponent.body.setTranslation(
        {
          x: transform.position.x,
          y: transform.position.y + avatar.avatarHalfHeight,
          z: transform.position.z
        },
        true
      )

      diffPos.subVectors(transform.position, desiredTransform.position)
      const angle = transform.rotation.angleTo(desiredTransform.rotation)

      // Once avatar reaches desired transform change animation state to mount enter or mount active
      if (diffPos.length() < PositionEpsilon && Math.abs(angle) < RotationEpsilon) {
        removeComponent(entity, DesiredTransformComponent)
        const avatarAnimationComponent = getComponent(entity, AvatarAnimationComponent)

        if (sitting.state === 'SIT_ENTER') {
          changeState(avatarAnimationComponent.animationGraph, AvatarStates.SIT_IDLE)
          sitting.state = AvatarStates.SIT_IDLE
        } else if (sitting.state === 'SIT_LEAVE') {
          changeState(avatarAnimationComponent.animationGraph, AvatarStates.LOCOMOTION)
          removeComponent(entity, SittingComponent)
          getComponent(Engine.instance.currentWorld.localClientEntity, AvatarControllerComponent).movementEnabled = true
        }
      }
    }

    for (const entity of sittingIdleQuery(world)) {
      const controller = getComponent(entity, AvatarControllerComponent)
      const avatarAnimationComponent = getComponent(entity, AvatarAnimationComponent)
      const avatarComponent = getComponent(entity, AvatarComponent)
      const sitting = getComponent(entity, SittingComponent)

      if (controller.localMovementDirection.lengthSq() > 0.1) {
        sitting.state = AvatarStates.SIT_LEAVE

        changeState(avatarAnimationComponent.animationGraph, AvatarStates.SIT_LEAVE)
        const avatarEntity = Engine.instance.currentWorld.localClientEntity

        const transform = getComponent(avatarEntity, TransformComponent)
        const newPos = transform.position.clone().add(new Vector3(0, 0, 1).applyQuaternion(transform.rotation))

        const interactionGroups = getInteractionGroups(CollisionGroups.Avatars, CollisionGroups.Ground)
        const raycastComponentData = {
          type: SceneQueryType.Closest,
          hits: [],
          origin: newPos,
          direction: new Vector3(0, -1, 0),
          maxDistance: 2,
          flags: interactionGroups
        }
        Physics.castRay(Engine.instance.currentWorld.physicsWorld, raycastComponentData)

        if (raycastComponentData.hits.length > 0) {
          const raycastHit = raycastComponentData.hits[0] as RaycastHit
          if (raycastHit.normal.y > 0.9) {
            newPos.y -= raycastHit.distance
          }
        } else {
          newPos.copy(transform.position)
          newPos.y += avatarComponent.avatarHalfHeight
        }

        addComponent(avatarEntity, DesiredTransformComponent, {
          position: newPos,
          rotation: transform.rotation.clone(),
          positionRate: 2,
          rotationRate: 2,
          lockRotationAxis: [false, false, false],
          positionDelta: 0,
          rotationDelta: 0
        })
      }
    }
  }
}
