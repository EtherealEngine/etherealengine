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
import { AxesHelper, Euler, MathUtils, Mesh, Quaternion, SphereGeometry, Vector3 } from 'three'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { insertionSort } from '@etherealengine/common/src/utils/insertionSort'
import {
  defineActionQueue,
  defineState,
  dispatchAction,
  getMutableState,
  getState,
  useHookstate
} from '@etherealengine/hyperflux'

import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'
import { V_010 } from '../../common/constants/MathConstants'
import { lerp } from '../../common/functions/MathLerpFunctions'
import { createPriorityQueue } from '../../ecs/PriorityQueue'
import { Engine } from '../../ecs/classes/Engine'
import { EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import { defineQuery, getComponent, getOptionalComponent, setComponent } from '../../ecs/functions/ComponentFunctions'
import { createEntity, removeEntity } from '../../ecs/functions/EntityFunctions'
import { defineSystem } from '../../ecs/functions/SystemFunctions'
import { InputSourceComponent } from '../../input/components/InputSourceComponent'
import { timeSeriesMocapData } from '../../mocap/MotionCaptureSystem'
import { NetworkObjectComponent } from '../../networking/components/NetworkObjectComponent'
import { Physics, RaycastArgs } from '../../physics/classes/Physics'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { CollisionGroups } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { PhysicsState } from '../../physics/state/PhysicsState'
import { RaycastHit, SceneQueryType } from '../../physics/types/PhysicsTypes'
import { RendererState } from '../../renderer/RendererState'
import { addObjectToGroup } from '../../scene/components/GroupComponent'
import { NameComponent } from '../../scene/components/NameComponent'
import { UUIDComponent } from '../../scene/components/UUIDComponent'
import { VisibleComponent } from '../../scene/components/VisibleComponent'
import { ObjectLayers } from '../../scene/constants/ObjectLayers'
import { setObjectLayers } from '../../scene/functions/setObjectLayers'
import {
  DistanceFromCameraComponent,
  FrustumCullCameraComponent,
  compareDistanceToCamera
} from '../../transform/components/DistanceComponents'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { updateGroupChildren } from '../../transform/systems/TransformSystem'
import { setTrackingSpace } from '../../xr/XRScaleAdjustmentFunctions'
import { XRAction, XRState, getCameraMode } from '../../xr/XRState'
import { AnimationState } from '.././AnimationManager'
import { AnimationComponent } from '.././components/AnimationComponent'
import { AvatarAnimationComponent, AvatarRigComponent } from '.././components/AvatarAnimationComponent'
import {
  AvatarIKTargetComponent,
  xrTargetHeadSuffix,
  xrTargetLeftHandSuffix,
  xrTargetRightHandSuffix
} from '.././components/AvatarIKComponents'
import { LoopAnimationComponent } from '.././components/LoopAnimationComponent'
import { applyInputSourcePoseToIKTargets } from '.././functions/applyInputSourcePoseToIKTargets'
import { setAvatarLocomotionAnimation } from '../animation/AvatarAnimationGraph'
import { solveTwoBoneIK } from '../animation/TwoBoneIKSolver'
import { AvatarComponent } from '../components/AvatarComponent'

export const AvatarAnimationState = defineState({
  name: 'AvatarAnimationState',
  initial: () => {
    const accumulationBudget = 100 //isMobileXRHeadset ? 3 : 6

    const priorityQueue = createPriorityQueue({
      accumulationBudget
    })
    Engine.instance.priorityAvatarEntities = priorityQueue.priorityEntities

    return {
      priorityQueue,
      sortedTransformEntities: [] as Entity[],
      visualizers: [] as Entity[]
    }
  }
})

const loopAnimationQuery = defineQuery([
  VisibleComponent,
  LoopAnimationComponent,
  AnimationComponent,
  AvatarAnimationComponent,
  AvatarRigComponent
])
const avatarAnimationQuery = defineQuery([AnimationComponent, AvatarAnimationComponent, AvatarRigComponent])
const ikTargetSpawnQueue = defineActionQueue(XRAction.spawnIKTarget.matches)
const sessionChangedQueue = defineActionQueue(XRAction.sessionChanged.matches)

const ikTargetQuery = defineQuery([AvatarIKTargetComponent])

const inputSourceQuery = defineQuery([InputSourceComponent])

const minimumFrustumCullDistanceSqr = 5 * 5 // 5 units

const filterPriorityEntities = (entity: Entity) =>
  Engine.instance.priorityAvatarEntities.has(entity) || entity === Engine.instance.localClientEntity

const filterFrustumCulledEntities = (entity: Entity) =>
  !(
    DistanceFromCameraComponent.squaredDistance[entity] > minimumFrustumCullDistanceSqr &&
    FrustumCullCameraComponent.isCulled[entity]
  )

let avatarSortAccumulator = 0
const _quat = new Quaternion()

const _vector3 = new Vector3()
const _empty = new Vector3()
const _hipVector = new Vector3()
const _hipRot = new Quaternion()
const leftLegVector = new Vector3()
const rightLegVector = new Vector3()

const midAxisRestriction = new Euler(0, 0, 0)
const tipAxisRestriction = new Euler(0, 0, 0)

interface targetTransform {
  position: Vector3
  rotation: Quaternion
}

//raw position and rotation of the IK targets in world space
const worldSpaceTargets = {
  rightHandTarget: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  leftHandTarget: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  rightFootTarget: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  leftFootTarget: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  headTarget: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  hipsTarget: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,

  rightElbowHint: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  leftElbowHint: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  rightKneeHint: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  leftKneeHint: { position: new Vector3(), rotation: new Quaternion() } as targetTransform,
  headHint: { position: new Vector3(), rotation: new Quaternion() } as targetTransform
}

const setVisualizers = () => {
  const { visualizers } = getMutableState(AvatarAnimationState)
  const { debugEnable } = getMutableState(RendererState)
  if (!debugEnable.value) {
    //remove visualizers
    for (let i = 0; i < visualizers.length; i++) {
      removeEntity(visualizers[i].value)
    }

    return
  }
  for (let i = 0; i < 11; i++) {
    const e = createEntity()
    setComponent(e, VisibleComponent, true)
    addObjectToGroup(e, new Mesh(new SphereGeometry(0.05)))
    setComponent(e, TransformComponent)
    visualizers[i].set(e)
  }
}
const interactionGroups = getInteractionGroups(CollisionGroups.Avatars, CollisionGroups.Default)
const footRaycastArgs = {
  type: SceneQueryType.Closest,
  origin: new Vector3(),
  direction: new Vector3(0, -1, 0),
  maxDistance: 0,
  groups: interactionGroups
} as RaycastArgs

const lastRayInfo = {} as Record<number, RaycastHit>
const lastLerpPosition = {} as Record<number, number>
const setFootTarget = (
  hipsPos: Vector3,
  footPos: targetTransform,
  legLength: number,
  castRay: boolean,
  index: number
) => {
  footRaycastArgs.origin.set(footPos.position.x, hipsPos.y + legLength, footPos.position.z)
  footRaycastArgs.maxDistance = legLength

  if (castRay) {
    const castedRay = Physics.castRay(getState(PhysicsState).physicsWorld, footRaycastArgs)
    if (castedRay[0]) {
      lastRayInfo[index] = castedRay[0]
    } else {
      delete lastRayInfo[index]
      delete lastLerpPosition[index]
    }
  }

  const castedRay = lastRayInfo[index]
  if (castedRay) {
    if (!lastLerpPosition[index]) lastLerpPosition[index] = footPos.position.y
    lastLerpPosition[index] = lerp(
      lastLerpPosition[index],
      castedRay.position.y,
      getState(EngineState).deltaSeconds * 10
    )
    footPos.position.setY(lastLerpPosition[index])
    //footPos.rotation.copy(new Quaternion().setFromUnitVectors(castedRay.normal as Vector3, new Vector3(0, 1, 0)))
  }
}

const footRaycastInterval = 0.25
let footRaycastTimer = 0

const execute = () => {
  const xrState = getState(XRState)
  const { priorityQueue, sortedTransformEntities, visualizers } = getState(AvatarAnimationState)
  const { elapsedSeconds, deltaSeconds, localClientEntity } = Engine.instance
  const { debugEnable } = getState(RendererState)

  for (const action of sessionChangedQueue()) {
    if (!localClientEntity) continue

    const headUUID = (Engine.instance.userId + xrTargetHeadSuffix) as EntityUUID
    const leftHandUUID = (Engine.instance.userId + xrTargetLeftHandSuffix) as EntityUUID
    const rightHandUUID = (Engine.instance.userId + xrTargetRightHandSuffix) as EntityUUID

    const ikTargetHead = UUIDComponent.entitiesByUUID[headUUID]
    const ikTargetLeftHand = UUIDComponent.entitiesByUUID[leftHandUUID]
    const ikTargetRightHand = UUIDComponent.entitiesByUUID[rightHandUUID]

    if (ikTargetHead) removeEntity(ikTargetHead)
    if (ikTargetLeftHand) removeEntity(ikTargetLeftHand)
    if (ikTargetRightHand) removeEntity(ikTargetRightHand)
  }

  for (const action of ikTargetSpawnQueue()) {
    const entity = NetworkObjectComponent.getNetworkObject(action.$from, action.networkId)
    if (!entity) {
      console.warn('Could not find entity for networkId', action.$from, action.networkId)
      continue
    }

    setComponent(entity, NameComponent, action.$from + '_' + action.name)
    setComponent(entity, AvatarIKTargetComponent)

    const helper = new AxesHelper(0.5)
    setObjectLayers(helper, ObjectLayers.Gizmos)
    addObjectToGroup(entity, helper)
    setComponent(entity, VisibleComponent)

    setTrackingSpace()
  }

  // todo - remove ik targets when session ends
  if (xrState.sessionActive && localClientEntity) {
    const sources = inputSourceQuery().map((eid) => getComponent(eid, InputSourceComponent).source)

    const head = getCameraMode() === 'attached'
    const leftHand = !!sources.find((s) => s.handedness === 'left')
    const rightHand = !!sources.find((s) => s.handedness === 'right')

    const headUUID = (Engine.instance.userId + xrTargetHeadSuffix) as EntityUUID
    const leftHandUUID = (Engine.instance.userId + xrTargetLeftHandSuffix) as EntityUUID
    const rightHandUUID = (Engine.instance.userId + xrTargetRightHandSuffix) as EntityUUID

    const ikTargetHead = UUIDComponent.entitiesByUUID[headUUID]
    const ikTargetLeftHand = UUIDComponent.entitiesByUUID[leftHandUUID]
    const ikTargetRightHand = UUIDComponent.entitiesByUUID[rightHandUUID]

    if (!head && ikTargetHead) removeEntity(ikTargetHead)
    if (!leftHand && ikTargetLeftHand) removeEntity(ikTargetLeftHand)
    if (!rightHand && ikTargetRightHand) removeEntity(ikTargetRightHand)

    if (head && !ikTargetHead) dispatchAction(XRAction.spawnIKTarget({ entityUUID: headUUID, name: 'head' }))
    if (leftHand && !ikTargetLeftHand)
      dispatchAction(XRAction.spawnIKTarget({ entityUUID: leftHandUUID, name: 'lefthand' }))
    if (rightHand && !ikTargetRightHand)
      dispatchAction(XRAction.spawnIKTarget({ entityUUID: rightHandUUID, name: 'righthand' }))
  }

  /**
   * 1 - Sort & apply avatar priority queue
   */

  let needsSorting = false
  avatarSortAccumulator += deltaSeconds
  if (avatarSortAccumulator > 1) {
    needsSorting = true
    avatarSortAccumulator = 0
  }

  for (const entity of avatarAnimationQuery.enter()) {
    sortedTransformEntities.push(entity)
    needsSorting = true
  }

  for (const entity of avatarAnimationQuery.exit()) {
    const idx = sortedTransformEntities.indexOf(entity)
    idx > -1 && sortedTransformEntities.splice(idx, 1)
    needsSorting = true
    priorityQueue.removeEntity(entity)
  }

  if (needsSorting) {
    insertionSort(sortedTransformEntities, compareDistanceToCamera)
  }

  const filteredSortedTransformEntities = sortedTransformEntities.filter(filterFrustumCulledEntities)

  for (let i = 0; i < filteredSortedTransformEntities.length; i++) {
    const entity = filteredSortedTransformEntities[i]
    const accumulation = Math.min(Math.exp(1 / (i + 1)) / 3, 1)
    priorityQueue.addPriority(entity, accumulation * accumulation)
  }

  priorityQueue.update()

  /**
   * 2 - Apply avatar animations
   */

  const avatarAnimationEntities = avatarAnimationQuery().filter(filterPriorityEntities)
  const loopAnimationEntities = loopAnimationQuery().filter(filterPriorityEntities)
  const ikEntities = ikTargetQuery()

  footRaycastTimer += deltaSeconds

  for (const entity of avatarAnimationEntities) {
    const rigComponent = getComponent(entity, AvatarRigComponent)
    const rig = rigComponent.rig

    // temp for mocap
    const networkObject = getComponent(entity, NetworkObjectComponent)
    const network = Engine.instance.worldNetwork
    if (network) {
      const isPeerForEntity = Array.from(timeSeriesMocapData.keys()).find(
        (peerID: PeerID) => network.peers.get(peerID)?.userId === networkObject.ownerId
      )
      if (isPeerForEntity && ikEntities.length == 0) {
        // just animate and exit
        rigComponent.vrm.update(getState(EngineState).deltaSeconds)
        continue
      }
    }

    /**
     * Apply motion to velocity controlled animations
     */
    const animationComponent = getComponent(entity, AnimationComponent)
    const avatarAnimationComponent = getComponent(entity, AvatarAnimationComponent)
    const rigidbodyComponent = getOptionalComponent(entity, RigidBodyComponent)

    const delta = elapsedSeconds - avatarAnimationComponent.deltaAccumulator
    const deltaTime = delta * animationComponent.animationSpeed
    avatarAnimationComponent.deltaAccumulator = elapsedSeconds

    if (rigidbodyComponent) {
      // TODO: use x locomotion for side-stepping when full 2D blending spaces are implemented
      avatarAnimationComponent.locomotion.x = 0
      avatarAnimationComponent.locomotion.y = rigidbodyComponent.linearVelocity.y
      // lerp animated forward animation to smoothly animate to a stop
      avatarAnimationComponent.locomotion.z = MathUtils.lerp(
        avatarAnimationComponent.locomotion.z || 0,
        _vector3.copy(rigidbodyComponent.linearVelocity).setComponent(1, 0).length(),
        10 * deltaTime
      )
    } else {
      avatarAnimationComponent.locomotion.setScalar(0)
    }

    setAvatarLocomotionAnimation(entity)

    /**
     * Apply IK
     */

    const animationState = getState(AnimationState)
    const avatarComponent = getComponent(entity, AvatarComponent)

    if (!animationState.ikTargetsAnimations) continue
    if (!rig.hips?.node) continue

    //calculate world positions

    const transform = getComponent(entity, TransformComponent)

    let i = 0
    for (const [key, value] of Object.entries(rigComponent.ikTargetsMap)) {
      //if xr is active, set select targets to xr tracking data
      worldSpaceTargets[key].position
        .copy(value.position)
        .multiplyScalar(avatarComponent.scaleMultiplier)
        .add(rigComponent.ikOffsetsMap.get(key) ?? _empty)
        .applyMatrix4(transform.matrix)

      i++
    }

    applyInputSourcePoseToIKTargets()

    for (const ikEntity of ikEntities) {
      if (ikEntities.length <= 1) continue
      const networkObject = getComponent(ikEntity, NetworkObjectComponent)
      const ownerEntity = NetworkObjectComponent.getUserAvatarEntity(networkObject.ownerId)
      if (ownerEntity !== entity) continue

      const rigidbodyComponent = getComponent(ownerEntity, RigidBodyComponent)
      const rigComponent = getComponent(ownerEntity, AvatarRigComponent)

      const ikTargetName = getComponent(ikEntity, NameComponent).split('_').pop()!
      const ikTransform = getComponent(ikEntity, TransformComponent)
      const hipsForward = new Vector3(0, 0, 1)

      switch (ikTargetName) {
        case 'leftHand':
          worldSpaceTargets.leftHandTarget.position.copy(ikTransform.position)
          worldSpaceTargets.leftHandTarget.rotation.copy(ikTransform.rotation)
          break
        case 'rightHand':
          worldSpaceTargets.rightHandTarget.position.copy(ikTransform.position)
          worldSpaceTargets.rightHandTarget.rotation.copy(ikTransform.rotation)
          break
        case 'head':
          if (xrState.sessionActive) {
            worldSpaceTargets.hipsTarget.position.copy(
              _vector3.copy(ikTransform.position).setY(ikTransform.position.y - rigComponent.torsoLength - 0.125)
            )

            //offset target forward to account for hips being behind the head
            hipsForward.applyQuaternion(rigidbodyComponent!.rotation)
            hipsForward.multiplyScalar(0.125)
            worldSpaceTargets.hipsTarget.position.sub(hipsForward)

            //calculate head look direction and apply to head bone
            //look direction should be set outside of the xr switch
            rig.head.node.quaternion.copy(
              _quat.multiplyQuaternions(
                rig.spine.node.getWorldQuaternion(new Quaternion()).invert(),
                ikTransform.rotation
              )
            )
          } else {
            worldSpaceTargets.headTarget.position.copy(ikTransform.position)
          }
          break
        case 'hips':
          console.log(ikTransform.position.x, ikTransform.position.y, ikTransform.position.z)
          worldSpaceTargets.hipsTarget.position.copy(ikTransform.position)
          break
        case 'leftAnkle':
          //worldSpaceTargets.leftFootTarget.position.copy(ikTransform.position)
          break
        case 'rightAnkle':
          //worldSpaceTargets.rightFootTarget.position.copy(ikTransform.position)
          break
      }
    }

    if (debugEnable) {
      let i = 0
      for (const [key, value] of Object.entries(rigComponent.ikTargetsMap)) {
        //if xr is active, set select targets to xr tracking data
        const visualizerTransform = getComponent(visualizers[i], TransformComponent)
        visualizerTransform.position.copy(worldSpaceTargets[key].position)

        i++
      }
    }

    const leftLegLength =
      leftLegVector
        .subVectors(worldSpaceTargets.hipsTarget.position, worldSpaceTargets.leftFootTarget.position)
        .length() + rigComponent.footHeight
    const rightLegLength =
      rightLegVector
        .subVectors(worldSpaceTargets.hipsTarget.position, worldSpaceTargets.rightFootTarget.position)
        .length() + rigComponent.footHeight

    //calculate hips to head
    rig.hips.node.position.copy(worldSpaceTargets.hipsTarget.position.applyMatrix4(transform.matrixInverse))
    _hipVector.subVectors(rigComponent.ikTargetsMap.headTarget.position, rigComponent.ikTargetsMap.hipsTarget.position)
    rig.hips.node.quaternion
      .setFromUnitVectors(V_010, _hipVector)
      .multiply(_hipRot.setFromEuler(new Euler(0, rigComponent.flipped ? Math.PI : 0)))

    //right now we only want hand rotation set if we are in xr
    const xrValue = xrState.sessionActive ? 1 : 0

    solveTwoBoneIK(
      rig.rightUpperArm.node,
      rig.rightLowerArm.node,
      rig.rightHand.node,
      worldSpaceTargets.rightHandTarget.position,
      worldSpaceTargets.rightHandTarget.rotation,
      null,
      worldSpaceTargets.rightElbowHint.position,
      tipAxisRestriction,
      midAxisRestriction,
      null,
      1,
      xrValue
    )

    solveTwoBoneIK(
      rig.leftUpperArm.node,
      rig.leftLowerArm.node,
      rig.leftHand.node,
      worldSpaceTargets.leftHandTarget.position,
      worldSpaceTargets.leftHandTarget.rotation,
      null,
      worldSpaceTargets.leftElbowHint.position,
      tipAxisRestriction,
      midAxisRestriction,
      null,
      1,
      xrValue
    )

    setFootTarget(
      transform.position,
      worldSpaceTargets.rightFootTarget,
      rightLegLength,
      footRaycastTimer >= footRaycastInterval,
      0
    )
    setFootTarget(
      transform.position,
      worldSpaceTargets.leftFootTarget,
      leftLegLength,
      footRaycastTimer >= footRaycastInterval,
      1
    )

    if (footRaycastTimer >= footRaycastInterval) {
      footRaycastTimer = 0
    }

    solveTwoBoneIK(
      rig.rightUpperLeg.node,
      rig.rightLowerLeg.node,
      rig.rightFoot.node,
      worldSpaceTargets.rightFootTarget.position.setY(
        worldSpaceTargets.rightFootTarget.position.y + rigComponent.footHeight
      ),
      worldSpaceTargets.rightFootTarget.rotation,
      null,
      worldSpaceTargets.rightKneeHint.position,
      tipAxisRestriction,
      midAxisRestriction,
      tipAxisRestriction
    )

    solveTwoBoneIK(
      rig.leftUpperLeg.node,
      rig.leftLowerLeg.node,
      rig.leftFoot.node,
      worldSpaceTargets.leftFootTarget.position.setY(
        worldSpaceTargets.leftFootTarget.position.y + rigComponent.footHeight
      ),
      worldSpaceTargets.leftFootTarget.rotation,
      null,
      worldSpaceTargets.leftKneeHint.position,
      tipAxisRestriction,
      midAxisRestriction,
      tipAxisRestriction
    )

    rigComponent.vrm.update(getState(EngineState).deltaSeconds)
  }

  /**
   * Since the scene does not automatically update the matricies for all objects, which updates bones,
   * we need to manually do it for Loop Animation Entities
   */
  for (const entity of loopAnimationEntities) updateGroupChildren(entity)

  /** Run debug */
  for (const entity of Engine.instance.priorityAvatarEntities) {
    const avatarRig = getComponent(entity, AvatarRigComponent)
    if (avatarRig?.helper) {
      avatarRig.rig.hips.node.updateWorldMatrix(true, true)
      avatarRig.helper?.updateMatrixWorld(true)
    }
  }

  /** We don't need to ever calculate the matrices for ik targets, so mark them not dirty */
  for (const entity of ikEntities) {
    // delete TransformComponent.dirtyTransforms[entity]
  }
}

const reactor = () => {
  const renderState = useHookstate(getMutableState(RendererState))
  useEffect(() => {
    setVisualizers()
  }, [renderState.debugEnable])
  return null
}

export const AvatarAnimationSystem = defineSystem({
  uuid: 'ee.engine.AvatarAnimationSystem',
  execute,
  reactor
})
