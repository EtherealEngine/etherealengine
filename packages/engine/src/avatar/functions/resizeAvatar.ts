import { Vector3 } from 'three'

import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import { getComponent } from '../../ecs/functions/ComponentFunctions'
import { Physics } from '../../physics/classes/PhysicsRapier'
import { RaycastComponent } from '../../physics/components/RaycastComponent'
import { AvatarComponent } from '../components/AvatarComponent'
import { avatarRadius, createAvatarCollider } from './createAvatar'

export const resizeAvatar = (entity: Entity, height: number, center: Vector3) => {
  const avatar = getComponent(entity, AvatarComponent)

  avatar.avatarHeight = height
  avatar.avatarHalfHeight = avatar.avatarHeight / 2

  const colliderDesc = createAvatarCollider(entity, avatar.avatarHalfHeight - 0.25, avatarRadius)
  colliderDesc.translation.y = center.y
  Physics.resizeColliders(entity, [colliderDesc], Engine.instance.currentWorld.physicsWorld)

  const raycast = getComponent(entity, RaycastComponent)
  raycast.maxDistance = avatar.avatarHalfHeight + 0.05 // add small offset so raycaster hits properly
}
