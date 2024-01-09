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

import { useEffect } from 'react'
import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from 'three'

import { defineState, getMutableState, getState, none, useHookstate } from '@etherealengine/hyperflux'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { VRMHumanBoneName, VRMHumanBones } from '@pixiv/three-vrm'
import { V_001, V_010 } from '../../common/constants/MathConstants'
import { isClient } from '../../common/functions/getEnvironment'
import { createPriorityQueue, createSortAndApplyPriorityQueue } from '../../ecs/PriorityQueue'
import { Engine } from '../../ecs/classes/Engine'
import { EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import { defineQuery, getComponent, removeComponent, setComponent } from '../../ecs/functions/ComponentFunctions'
import { defineSystem } from '../../ecs/functions/SystemFunctions'
import { NetworkState } from '../../networking/NetworkState'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { UUIDComponent } from '../../scene/components/UUIDComponent'
import { TransformSystem } from '../../transform/TransformModule'
import { compareDistanceToCamera } from '../../transform/components/DistanceComponents'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { setTrackingSpace } from '../../xr/XRScaleAdjustmentFunctions'
import { XRControlsState, XRState } from '../../xr/XRState'
import { AnimationComponent } from '.././components/AnimationComponent'
import { AvatarAnimationComponent, AvatarRigComponent } from '.././components/AvatarAnimationComponent'
import { AvatarHeadDecapComponent, AvatarIKTargetComponent } from '.././components/AvatarIKComponents'
import { IKSerialization } from '../IKSerialization'
import { updateAnimationGraph } from '../animation/AvatarAnimationGraph'
import { solveTwoBoneIK } from '../animation/TwoBoneIKSolver'
import { ikTargets } from '../animation/Util'
import { getArmIKHint } from '../animation/getArmIKHint'
import { AvatarComponent } from '../components/AvatarComponent'
import { SkinnedMeshComponent } from '../components/SkinnedMeshComponent'
import { loadLocomotionAnimations } from '../functions/avatarFunctions'
import { updateVRMRetargeting } from '../functions/updateVRMRetargeting'
import { AnimationSystem } from './AnimationSystem'

export const AvatarAnimationState = defineState({
  name: 'AvatarAnimationState',
  initial: () => {
    const accumulationBudget = 100 //isMobileXRHeadset ? 2 : 6

    const priorityQueue = createPriorityQueue({
      accumulationBudget
    })

    return {
      priorityQueue,
      sortedTransformEntities: [] as Entity[],
      visualizers: [] as Entity[]
    }
  }
})

const avatarAnimationQuery = defineQuery([AnimationComponent, AvatarAnimationComponent, AvatarRigComponent])
const avatarComponentQuery = defineQuery([AvatarComponent])

const _quat = new Quaternion()
const _quat2 = new Quaternion()
const _vector3 = new Vector3()
const _hint = new Vector3()
const mat4 = new Matrix4()
const hipsForward = new Vector3(0, 0, 1)
const leftHandRotation = new Quaternion()
  .setFromAxisAngle(V_001, Math.PI / 2)
  .multiply(new Quaternion().setFromAxisAngle(V_010, -Math.PI / 2))
const rightHandRotation = new Quaternion()
  .setFromAxisAngle(V_001, -Math.PI / 2)
  .multiply(new Quaternion().setFromAxisAngle(V_010, Math.PI / 2))
const footAngleQuat = new Quaternion()

const midAxisRestriction = new Euler(0, 0, 0)
const tipAxisRestriction = new Euler(0, 0, 0)

const footRaycastInterval = 0.25
let footRaycastTimer = 0

const sortAndApplyPriorityQueue = createSortAndApplyPriorityQueue(avatarComponentQuery, compareDistanceToCamera)

const blendIkChain = (
  normalizedIkBones: VRMHumanBones,
  normalizedFkBones: VRMHumanBones,
  root: VRMHumanBoneName,
  mid: VRMHumanBoneName,
  tip: VRMHumanBoneName,
  weight: number
) => {
  normalizedFkBones[root]!.node.quaternion.fastSlerp(normalizedIkBones[root]!.node.quaternion, weight)
  normalizedFkBones[mid]!.node.quaternion.fastSlerp(normalizedIkBones[mid]!.node.quaternion, weight)
  normalizedFkBones[tip]!.node.quaternion.fastSlerp(normalizedIkBones[tip]!.node.quaternion, weight)
}

const execute = () => {
  const { priorityQueue, sortedTransformEntities, visualizers } = getState(AvatarAnimationState)
  const { elapsedSeconds, deltaSeconds } = getState(EngineState)

  /** Calculate avatar locomotion animations outside of priority queue */

  for (const entity of avatarComponentQuery()) {
    const avatarAnimationComponent = getComponent(entity, AvatarAnimationComponent)
    const rigidbodyComponent = getComponent(entity, RigidBodyComponent)
    if (rigidbodyComponent.body.isEnabled()) {
      // TODO: use x locomotion for side-stepping when full 2D blending spaces are implemented
      avatarAnimationComponent.locomotion.x = 0
      avatarAnimationComponent.locomotion.y = rigidbodyComponent.linearVelocity.y
      // lerp animated forward animation to smoothly animate to a stop
      avatarAnimationComponent.locomotion.z = MathUtils.lerp(
        avatarAnimationComponent.locomotion.z || 0,
        _vector3.copy(rigidbodyComponent.linearVelocity).setComponent(1, 0).length(),
        10 * getState(EngineState).deltaSeconds
      )
    } else {
      avatarAnimationComponent.locomotion.setScalar(0)
    }
  }

  /**
   * 1 - Sort & apply avatar priority queue
   */
  sortAndApplyPriorityQueue(priorityQueue, sortedTransformEntities, deltaSeconds)

  /**
   * 2 - Apply avatar animations
   */

  const avatarAnimationQueryArr = avatarAnimationQuery()
  const avatarAnimationEntities: Entity[] = []

  for (let i = 0; i < avatarAnimationQueryArr.length; i++) {
    const _entity = avatarAnimationQueryArr[i]
    if (priorityQueue.priorityEntities.has(_entity) || _entity === Engine.instance.localClientEntity) {
      avatarAnimationEntities.push(_entity)
    }
  }

  footRaycastTimer += deltaSeconds

  for (const entity of avatarAnimationEntities) {
    const rigComponent = getComponent(entity, AvatarRigComponent)
    const avatarComponent = getComponent(entity, AvatarComponent)
    const avatarAnimationComponent = getComponent(entity, AvatarAnimationComponent)

    avatarAnimationComponent.deltaAccumulator = elapsedSeconds
    const rawRig = rigComponent.rawRig
    const normalizedRig = rigComponent.normalizedRig
    const ikRig = rigComponent.ikRig

    if (!rawRig?.hips?.node) continue

    const uuid = getComponent(entity, UUIDComponent)
    const leftFoot = UUIDComponent.getEntityByUUID((uuid + ikTargets.leftFoot) as EntityUUID)
    const leftFootTransform = getComponent(leftFoot, TransformComponent)
    const leftFootTargetBlendWeight = AvatarIKTargetComponent.blendWeight[leftFoot]

    const rightFoot = UUIDComponent.getEntityByUUID((uuid + ikTargets.rightFoot) as EntityUUID)
    const rightFootTransform = getComponent(rightFoot, TransformComponent)
    const rightFootTargetBlendWeight = AvatarIKTargetComponent.blendWeight[rightFoot]

    const leftHand = UUIDComponent.getEntityByUUID((uuid + ikTargets.leftHand) as EntityUUID)
    const leftHandTransform = getComponent(leftHand, TransformComponent)
    const leftHandTargetBlendWeight = AvatarIKTargetComponent.blendWeight[leftHand]

    const rightHand = UUIDComponent.getEntityByUUID((uuid + ikTargets.rightHand) as EntityUUID)
    const rightHandTransform = getComponent(rightHand, TransformComponent)
    const rightHandTargetBlendWeight = AvatarIKTargetComponent.blendWeight[rightHand]

    const head = UUIDComponent.getEntityByUUID((uuid + ikTargets.head) as EntityUUID)
    const headTargetBlendWeight = AvatarIKTargetComponent.blendWeight[head]

    const transform = getComponent(entity, TransformComponent)

    /** @deprecated see https://github.com/EtherealEngine/etherealengine/issues/7519 */
    const isAvatarFlipped = !rigComponent.vrm.userData?.retargeted

    /** test */
    ikRig.hips.node.quaternion.copy(normalizedRig.hips.node.quaternion)
    ikRig.hips.node.position.copy(normalizedRig.hips.node.position)

    const rigidbodyComponent = getComponent(entity, RigidBodyComponent)
    if (headTargetBlendWeight) {
      const headTransform = getComponent(head, TransformComponent)
      rawRig.hips.node.position.set(
        headTransform.position.x,
        headTransform.position.y - avatarComponent.torsoLength - 0.125,
        headTransform.position.z
      )

      //offset target forward to account for hips being behind the head
      hipsForward.set(0, 0, 1)
      hipsForward.applyQuaternion(rigidbodyComponent.rotation)
      hipsForward.multiplyScalar(0.125)
      rawRig.hips.node.position.sub(hipsForward)

      // convert to local space
      rawRig.hips.node.position.applyMatrix4(mat4.copy(transform.matrixWorld).invert())

      _quat2.copy(headTransform.rotation)

      //calculate head look direction and apply to head bone
      //look direction should be set outside of the xr switch
      rawRig.head.node.quaternion.multiplyQuaternions(rawRig.spine.node.getWorldQuaternion(_quat).invert(), _quat2)
    }

    if (rightHandTargetBlendWeight) {
      getArmIKHint(
        entity,
        rightHandTransform.position,
        rightHandTransform.rotation,
        rawRig.rightUpperArm.node.getWorldPosition(_vector3),
        'right',
        _hint
      )

      solveTwoBoneIK(
        ikRig.rightUpperArm.node,
        ikRig.rightLowerArm.node,
        ikRig.rightHand.node,
        rightHandTransform.position,
        rightHandTransform.rotation,
        null,
        _hint,
        rightHandTargetBlendWeight,
        rightHandTargetBlendWeight
      )

      blendIkChain(
        ikRig,
        normalizedRig,
        VRMHumanBoneName.RightUpperArm,
        VRMHumanBoneName.RightLowerArm,
        VRMHumanBoneName.RightHand,
        rightHandTargetBlendWeight
      )
    }

    if (leftHandTargetBlendWeight) {
      getArmIKHint(
        entity,
        leftHandTransform.position,
        leftHandTransform.rotation,
        rawRig.leftUpperArm.node.getWorldPosition(_vector3),
        'left',
        _hint
      )

      solveTwoBoneIK(
        ikRig.leftUpperArm.node,
        ikRig.leftLowerArm.node,
        ikRig.leftHand.node,
        leftHandTransform.position,
        leftHandTransform.rotation,
        null,
        _hint,
        leftHandTargetBlendWeight,
        leftHandTargetBlendWeight
      )

      blendIkChain(
        ikRig,
        normalizedRig,
        VRMHumanBoneName.LeftUpperArm,
        VRMHumanBoneName.LeftLowerArm,
        VRMHumanBoneName.LeftHand,
        leftHandTargetBlendWeight
      )
    }

    if (footRaycastTimer >= footRaycastInterval) {
      footRaycastTimer = 0
    }

    if (rightFootTargetBlendWeight) {
      _hint
        .set(-avatarComponent.footGap * 1.5, 0, 0.4)
        .applyQuaternion(transform.rotation)
        .add(transform.position)

      solveTwoBoneIK(
        ikRig.rightUpperLeg.node,
        ikRig.rightLowerLeg.node,
        ikRig.rightFoot.node,
        rightFootTransform.position,
        rightFootTransform.rotation,
        null,
        _hint,
        rightFootTargetBlendWeight,
        rightFootTargetBlendWeight
      )

      blendIkChain(
        ikRig,
        normalizedRig,
        VRMHumanBoneName.RightUpperLeg,
        VRMHumanBoneName.RightLowerLeg,
        VRMHumanBoneName.RightFoot,
        rightFootTargetBlendWeight
      )
    }

    if (leftFootTargetBlendWeight) {
      _hint
        .set(avatarComponent.footGap * 1.5, 0, 1)
        .applyQuaternion(transform.rotation)
        .add(transform.position)

      solveTwoBoneIK(
        ikRig.leftUpperLeg.node,
        ikRig.leftLowerLeg.node,
        ikRig.leftFoot.node,
        leftFootTransform.position,
        leftFootTransform.rotation,
        null,
        _hint,
        leftFootTargetBlendWeight,
        leftFootTargetBlendWeight
      )

      blendIkChain(
        ikRig,
        normalizedRig,
        VRMHumanBoneName.LeftUpperLeg,
        VRMHumanBoneName.LeftLowerLeg,
        VRMHumanBoneName.LeftFoot,
        leftFootTargetBlendWeight
      )
    }
    updateAnimationGraph(avatarAnimationEntities)
    updateVRMRetargeting(rigComponent.vrm, entity)
  }
}

const reactor = () => {
  useEffect(() => {
    if (isClient) loadLocomotionAnimations()

    const networkState = getMutableState(NetworkState)

    networkState.networkSchema[IKSerialization.ID].set({
      read: IKSerialization.readBlendWeight,
      write: IKSerialization.writeBlendWeight
    })

    return () => {
      networkState.networkSchema[IKSerialization.ID].set(none)
    }
  }, [])

  const xrState = getMutableState(XRState)
  const session = useHookstate(xrState.session)
  const isCameraAttachedToAvatar = useHookstate(getMutableState(XRControlsState).isCameraAttachedToAvatar)
  const userReady = useHookstate(getMutableState(EngineState).userReady)

  useEffect(() => {
    if (!session.value) return

    const entity = Engine.instance.localClientEntity
    if (!entity) return

    if (isCameraAttachedToAvatar.value) {
      setComponent(entity, AvatarHeadDecapComponent, true)
    } else {
      removeComponent(entity, AvatarHeadDecapComponent)
    }
  }, [isCameraAttachedToAvatar, session])

  useEffect(() => {
    if (userReady.value) setTrackingSpace()
  }, [userReady])

  return null
}

export const AvatarAnimationSystem = defineSystem({
  uuid: 'ee.engine.AvatarAnimationSystem',
  insert: { before: AnimationSystem },
  execute,
  reactor
})

const skinnedMeshQuery = defineQuery([SkinnedMeshComponent])

const updateSkinnedMeshes = () => {
  for (const entity of skinnedMeshQuery()) {
    const skinnedMesh = getComponent(entity, SkinnedMeshComponent)
    if (skinnedMesh.bindMode === 'attached') {
      skinnedMesh.bindMatrixInverse.copy(skinnedMesh.matrixWorld).invert()
    } else if (skinnedMesh.bindMode === 'detached') {
      skinnedMesh.bindMatrixInverse.copy(skinnedMesh.bindMatrix).invert()
    } else {
      console.warn('THREE.SkinnedMesh: Unrecognized bindMode: ' + skinnedMesh.bindMode)
    }
  }
}

export const SkinnedMeshTransformSystem = defineSystem({
  uuid: 'ee.engine.SkinnedMeshTransformSystem',
  insert: { after: TransformSystem },
  execute: updateSkinnedMeshes
})
