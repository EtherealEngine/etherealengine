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

import { Vector3 } from 'three'
import { Engine } from '../../ecs/classes/Engine'
import { getComponent } from '../../ecs/functions/ComponentFunctions'
import { UUIDComponent } from '../../scene/components/UUIDComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { ikTargets } from '../animation/Util'

const _vec3 = new Vector3()
//step threshold should be a function of leg length squared
//whenever the distance squared of the foot from the next target foot step position
//is greater than the step threshold, start a new step
//todo step interpolation
export const setIkFootTarget = (stepThreshold: number) => {
  const { localClientEntity, userId } = Engine.instance

  const feet = {
    rightFoot: UUIDComponent.entitiesByUUID[userId + ikTargets.rightFoot],
    leftFoot: UUIDComponent.entitiesByUUID[userId + ikTargets.leftFoot]
  }
  const playerTransform = getComponent(localClientEntity, TransformComponent)
  for (const [key, foot] of Object.entries(feet)) {
    if (!foot) continue
    const ikTransform = getComponent(foot, TransformComponent)
    const squareDistance = _vec3.subVectors(ikTransform.position, playerTransform.position).lengthSq()
    console.log(squareDistance)
    if (squareDistance > stepThreshold) ikTransform.position.copy(playerTransform.position)
  }
}
