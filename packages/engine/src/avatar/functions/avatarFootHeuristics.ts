/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { Euler, Quaternion, Vector3 } from 'three'
import { V_010 } from '../../common/constants/MathConstants'
import { Entity } from '../../ecs/classes/Entity'
import { getComponent } from '../../ecs/functions/ComponentFunctions'
import { UUIDComponent } from '../../scene/components/UUIDComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { ikTargets } from '../animation/Util'
import { AvatarRigComponent } from '../components/AvatarAnimationComponent'
import { AvatarIKTargetComponent } from '../components/AvatarIKComponents'

const walkDirection = new Vector3()
const stepDirection = new Vector3()
const nextStep = {
  [ikTargets.rightFoot]: { position: new Vector3(), rotation: new Quaternion() },
  [ikTargets.leftFoot]: { position: new Vector3(), rotation: new Quaternion() }
}
const footOffset = new Vector3()
const lastPlayerPosition = new Vector3()
const ikTargetToPlayer = new Vector3()
const offset = new Quaternion().setFromEuler(new Euler(0, Math.PI, 0))
const quat = new Quaternion()
let currentStep = ikTargets.leftFoot
const speedMultiplier = 120
const minSpeed = 5

//step threshold should be a function of leg length
//walk threshold to determine when to move the feet back into standing position, should be
export const setIkFootTarget = (localClientEntity: Entity, delta: number) => {
  const userID = getComponent(localClientEntity, UUIDComponent)

  const ikTargetLeftFoot = UUIDComponent.getEntityByUUID((userID + ikTargets.leftFoot) as EntityUUID)
  const ikTargetRightFoot = UUIDComponent.getEntityByUUID((userID + ikTargets.rightFoot) as EntityUUID)
  if (!ikTargetLeftFoot || !ikTargetRightFoot) return

  const leftFootTargetBlendWeight = AvatarIKTargetComponent.blendWeight[ikTargetLeftFoot]
  const rightFootTargetBlendWeight = AvatarIKTargetComponent.blendWeight[ikTargetRightFoot]

  if (!leftFootTargetBlendWeight || !rightFootTargetBlendWeight) return

  const rigComponent = getComponent(localClientEntity, AvatarRigComponent)
  const stepThreshold = rigComponent.upperLegLength + rigComponent.lowerLegLength

  const feet = {
    [ikTargets.rightFoot]: UUIDComponent.getEntityByUUID((userID + ikTargets.rightFoot) as EntityUUID),
    [ikTargets.leftFoot]: UUIDComponent.getEntityByUUID((userID + ikTargets.leftFoot) as EntityUUID)
  }

  const playerTransform = getComponent(localClientEntity, TransformComponent)
  if (lastPlayerPosition.x == 0 && lastPlayerPosition.y == 0 && lastPlayerPosition.z == 0)
    lastPlayerPosition.copy(playerTransform.position)

  const playerRig = getComponent(localClientEntity, AvatarRigComponent)

  /**calculate foot offset so both feet aren't at the transform's center */
  const calculateFootOffset = () => {
    footOffset.set(currentStep == ikTargets.leftFoot ? playerRig.footGap : -playerRig.footGap, 0, 0)
    footOffset.applyQuaternion(playerTransform.rotation)
    footOffset.add(playerTransform.position)
    return footOffset
  }

  for (const [key, foot] of Object.entries(feet)) {
    const ikTransform = getComponent(foot, TransformComponent)
    if (ikTransform.position.x + ikTransform.position.y + ikTransform.position.z == 0) {
      ikTransform.position.copy(calculateFootOffset())
      continue
    }
    if (!foot || key != currentStep) continue

    calculateFootOffset()

    //calculate movement direction and use it to get speed
    walkDirection.subVectors(lastPlayerPosition, playerTransform.position).multiplyScalar(speedMultiplier)
    const playerSpeed = walkDirection.lengthSq()

    //get distance from the player
    const ikDistanceSqFromPlayer = ikTargetToPlayer.subVectors(ikTransform.position, footOffset).setY(0).lengthSq()

    //get distance from the next step position
    const ikDistanceSqFromWalkTarget = Math.min(
      stepDirection.subVectors(ikTransform.position, nextStep[key].position).setY(0).lengthSq(),
      1
    )

    //if the foot is further than the foot threshold, start a new step
    if (ikDistanceSqFromPlayer > stepThreshold * stepThreshold * 0.5) {
      nextStep[key].position
        .copy(footOffset)
        .sub(walkDirection.normalize().multiplyScalar(stepThreshold * stepThreshold * 1.5))

      nextStep[key].rotation.identity().setFromUnitVectors(V_010, walkDirection.normalize())
    }

    //if we're at the target, switch to the other foot
    if (ikDistanceSqFromWalkTarget < 0.01) {
      currentStep = key == ikTargets.leftFoot ? ikTargets.rightFoot : ikTargets.leftFoot
      continue
    }
    //interpolate foot to next step position
    ikTransform.position.lerp(nextStep[key].position, delta * (minSpeed + playerSpeed))
    //set foot y to player y until we have step math
    ikTransform.position.y = playerTransform.position.y + 0.1
    ikTransform.rotation.slerp(quat.copy(playerTransform.rotation).multiply(offset), delta * (minSpeed + playerSpeed))
  }

  lastPlayerPosition.copy(playerTransform.position)
}
