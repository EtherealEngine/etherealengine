import { defineQuery, getComponent } from '../ecs/functions/ComponentFunctions'
import { AnimationComponent } from './components/AnimationComponent'
import { AnimationManager } from './AnimationManager'
import { AvatarAnimationComponent } from './components/AvatarAnimationComponent'
import { World } from '../ecs/classes/World'
import { NetworkObjectComponent } from '../networking/components/NetworkObjectComponent'
import matches from 'ts-matches'
import { NetworkWorldAction } from '../networking/functions/NetworkWorldAction'
import { IKRigComponent } from '../ikrig/components/IKRigComponent'

const animationQuery = defineQuery([AnimationComponent, IKRigComponent, AvatarAnimationComponent])
// const avatarAnimationQuery = defineQuery([AnimationComponent, AvatarAnimationComponent])

export default async function AnimationSystem(world: World) {
  world.receptors.push(animationActionReceptor)

  function animationActionReceptor(action) {
    matches(action).when(NetworkWorldAction.avatarAnimation.matches, ({ $from }) => {
      const avatarEntity = world.getUserAvatarEntity($from)
      const networkObject = getComponent(avatarEntity, NetworkObjectComponent)
      if (!networkObject) {
        return console.warn(`Avatar Entity for user id ${$from} does not exist! You should probably reconnect...`)
      }

      const avatarAnimationComponent = getComponent(avatarEntity, AvatarAnimationComponent)
      avatarAnimationComponent.animationGraph.changeState(action.newStateName)
    })
  }

  await AnimationManager.instance.getAnimations()

  return () => {
    const { delta } = world

    for (const entity of animationQuery(world)) {
      const animationComponent = getComponent(entity, AnimationComponent)
      const modifiedDelta = delta * animationComponent.animationSpeed
      animationComponent.mixer.update(modifiedDelta)

      const avatarAnimationComponent = getComponent(entity, AvatarAnimationComponent)
      const deltaTime = delta * animationComponent.animationSpeed
      avatarAnimationComponent.animationGraph.update(deltaTime)

      // TODO: Find a more elegant way to handle root motion
      const bones = getComponent(entity, IKRigComponent).boneStructure
      const rootPos = AnimationManager.instance._defaultRootBone.position
      bones.Hips.position.setX(rootPos.x).setZ(rootPos.z)
    }
  }
}
