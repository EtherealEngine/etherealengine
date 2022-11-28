import { Not } from 'bitecs'
import { clamp } from 'lodash'
import { Euler } from 'three'

import { createActionQueue, removeActionQueue } from '@xrengine/hyperflux'

import { Engine } from '../ecs/classes/Engine'
import { World } from '../ecs/classes/World'
import { defineQuery, getComponent, removeQuery } from '../ecs/functions/ComponentFunctions'
import { createPriorityQueue } from '../ecs/PriorityQueue'
import { NetworkObjectComponent } from '../networking/components/NetworkObjectComponent'
import { WorldNetworkAction } from '../networking/functions/WorldNetworkAction'
import { VisibleComponent } from '../scene/components/VisibleComponent'
import { DesiredTransformComponent } from '../transform/components/DesiredTransformComponent'
import { DistanceFromCameraComponent, FrustumCullCameraComponent } from '../transform/components/DistanceComponents'
import { TransformComponent } from '../transform/components/TransformComponent'
import { TweenComponent } from '../transform/components/TweenComponent'
import { changeAvatarAnimationState } from './animation/AvatarAnimationGraph'
import { AnimationManager } from './AnimationManager'
import AvatarAnimationSystem from './AvatarAnimationSystem'
import AvatarHandAnimationSystem from './AvatarHandAnimationSystem'
import { AnimationComponent } from './components/AnimationComponent'
import { AvatarRigComponent } from './components/AvatarAnimationComponent'
import { AvatarHeadIKComponent } from './components/AvatarIKComponents'

const euler1YXZ = new Euler()
euler1YXZ.order = 'YXZ'
const euler2YXZ = new Euler()
euler2YXZ.order = 'YXZ'

export function animationActionReceptor(
  action: ReturnType<typeof WorldNetworkAction.avatarAnimation>,
  world = Engine.instance.currentWorld
) {
  // Only run on other peers
  if (!world.worldNetwork || !action.$peer || world.worldNetwork.peerID === action.$peer) return

  const avatarEntity = world.getUserAvatarEntity(action.$from)

  const networkObject = getComponent(avatarEntity, NetworkObjectComponent)
  if (!networkObject) {
    return console.warn(`Avatar Entity for user id ${action.$from} does not exist! You should probably reconnect...`)
  }

  changeAvatarAnimationState(avatarEntity, action.newStateName)
}

export default async function AnimationSystem(world: World) {
  const desiredTransformQuery = defineQuery([DesiredTransformComponent])
  const tweenQuery = defineQuery([TweenComponent])
  const animationQuery = defineQuery([AnimationComponent, VisibleComponent, Not(AvatarHeadIKComponent)])
  const avatarAnimationQueue = createActionQueue(WorldNetworkAction.avatarAnimation.matches)

  await AnimationManager.instance.loadDefaultAnimations()

  const avatarQuery = defineQuery([AvatarRigComponent])

  const maxSqrDistance = 25 * 25
  const minimumFrustumCullDistanceSqr = 5 * 5 // 5 units
  const minAccumulationRate = 0.01
  const maxAccumulationRate = 0.1
  const priorityQueue = createPriorityQueue(avatarQuery(), { priorityThreshold: maxAccumulationRate })

  world.priorityAvatarEntities = priorityQueue.priorityEntities

  const execute = () => {
    const { deltaSeconds } = world

    for (const entity of avatarQuery()) {
      /**
       * if outside of frustum, priority get set to 0 otherwise
       * whatever your distance is, gets mapped linearly to your priority
       */
      const sqrDistance = DistanceFromCameraComponent.squaredDistance[entity]
      // min distance to ensure entities that might be overlapping the camera are not frustum culled
      if (sqrDistance > minimumFrustumCullDistanceSqr && FrustumCullCameraComponent.isCulled[entity]) {
        priorityQueue.setPriority(entity, 0)
      } else {
        const accumulation = clamp(
          (maxSqrDistance / sqrDistance) * deltaSeconds,
          minAccumulationRate,
          maxAccumulationRate
        )
        priorityQueue.addPriority(entity, accumulation)
      }
    }

    priorityQueue.update()

    for (const action of avatarAnimationQueue()) animationActionReceptor(action, world)

    for (const entity of desiredTransformQuery(world)) {
      const desiredTransform = getComponent(entity, DesiredTransformComponent)
      const mutableTransform = getComponent(entity, TransformComponent)

      mutableTransform.position.lerp(desiredTransform.position, desiredTransform.positionRate * deltaSeconds)
      // store rotation before interpolation
      euler1YXZ.setFromQuaternion(mutableTransform.rotation)
      // lerp to desired rotation
      mutableTransform.rotation.slerp(desiredTransform.rotation, desiredTransform.rotationRate * deltaSeconds)

      euler2YXZ.setFromQuaternion(mutableTransform.rotation)
      // use axis locks - yes this is correct, the axis order is weird because quaternions
      if (desiredTransform.lockRotationAxis[0]) {
        euler2YXZ.x = euler1YXZ.x
      }
      if (desiredTransform.lockRotationAxis[2]) {
        euler2YXZ.y = euler1YXZ.y
      }
      if (desiredTransform.lockRotationAxis[1]) {
        euler2YXZ.z = euler1YXZ.z
      }
      mutableTransform.rotation.setFromEuler(euler2YXZ)
    }

    for (const entity of tweenQuery(world)) {
      const tween = getComponent(entity, TweenComponent)
      tween.tween.update()
    }

    for (const entity of animationQuery(world)) {
      const animationComponent = getComponent(entity, AnimationComponent)
      const modifiedDelta = deltaSeconds * animationComponent.animationSpeed
      animationComponent.mixer.update(modifiedDelta)
    }
  }

  const cleanup = async () => {
    removeQuery(world, desiredTransformQuery)
    removeQuery(world, tweenQuery)
    removeQuery(world, animationQuery)
    removeActionQueue(avatarAnimationQueue)
  }

  return {
    execute,
    cleanup,
    subsystems: [
      () => Promise.resolve({ default: AvatarAnimationSystem }),
      () => Promise.resolve({ default: AvatarHandAnimationSystem })
    ]
  }
}
