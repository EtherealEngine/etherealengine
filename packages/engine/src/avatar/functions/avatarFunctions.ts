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

import { VRM, VRM1Meta, VRMHumanBone, VRMHumanoid } from '@pixiv/three-vrm'
import { AnimationClip, AnimationMixer, Box3, Vector3 } from 'three'

import { getMutableState, getState, getStateUnsafe } from '@etherealengine/hyperflux'

import {
  getComponent,
  getMutableComponent,
  getOptionalComponent,
  hasComponent,
  removeComponent,
  setComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Entity } from '@etherealengine/ecs/src/Entity'
import { setObjectLayers } from '@etherealengine/spatial/src/renderer/components/ObjectLayerComponent'
import { ObjectLayers } from '@etherealengine/spatial/src/renderer/constants/ObjectLayers'
import { computeTransformMatrix } from '@etherealengine/spatial/src/transform/systems/TransformSystem'
import { AnimationState } from '../AnimationManager'
// import { retargetSkeleton, syncModelSkeletons } from '../animation/retargetSkeleton'
import config from '@etherealengine/common/src/config'
import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { iOS } from '@etherealengine/spatial/src/common/functions/isMobile'
import { iterateEntityNode } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { XRState } from '@etherealengine/spatial/src/xr/XRState'
import { GLTF } from '../../assets/loaders/gltf/GLTFLoader'
import { ModelComponent } from '../../scene/components/ModelComponent'
import avatarBoneMatching from '../AvatarBoneMatching'
import { getRootSpeed } from '../animation/AvatarAnimationGraph'
import { preloadedAnimations } from '../animation/Util'
import { AnimationComponent } from '../components/AnimationComponent'
import { AvatarRigComponent } from '../components/AvatarAnimationComponent'
import { AvatarComponent } from '../components/AvatarComponent'
import { AvatarControllerComponent } from '../components/AvatarControllerComponent'
import { AvatarDissolveComponent } from '../components/AvatarDissolveComponent'
import { AvatarPendingComponent } from '../components/AvatarPendingComponent'
import { AvatarMovementSettingsState } from '../state/AvatarMovementSettingsState'
import { LocalAvatarState } from '../state/AvatarState'
import { bindAnimationClipFromMixamo } from './retargetMixamoRig'

declare module '@pixiv/three-vrm/types/VRM' {
  export interface VRM {
    userData: {
      /** @deprecated see https://github.com/EtherealEngine/etherealengine/issues/7519 */
      retargeted?: boolean
    }
  }
}
/** Checks if the asset is a VRM. If not, attempt to use
 *  Mixamo based naming schemes to autocreate necessary VRM humanoid objects. */
export const autoconvertMixamoAvatar = (model: GLTF | VRM) => {
  const scene = model.scene ?? model // FBX assets do not have 'scene' property
  if (!scene) return null!

  //vrm1's vrm object is in the userData property
  if (model.userData?.vrm instanceof VRM) {
    return model.userData.vrm
  }

  //vrm0 is an instance of the vrm object
  if (model instanceof VRM) {
    const bones = model.humanoid.rawHumanBones
    model.humanoid.normalizedHumanBonesRoot.removeFromParent()
    bones.hips.node.rotateY(Math.PI)
    const humanoid = new VRMHumanoid(bones)
    const vrm = new VRM({
      humanoid,
      scene: model.scene,
      meta: { name: model.scene.children[0].name } as VRM1Meta
    })
    if (!vrm.userData) vrm.userData = {}
    return vrm
  }

  return avatarBoneMatching(model)
}

export const isAvaturn = (url: string) => {
  const fileExtensionRegex = /\.[0-9a-z]+$/i
  const avaturnUrl = config.client.avaturnAPI
  if (avaturnUrl && !fileExtensionRegex.test(url)) return url.startsWith(avaturnUrl)
  return false
}

/**tries to load avatar model asset if an avatar is not already pending */
export const loadAvatarModelAsset = (entity: Entity, avatarURL: string) => {
  if (!avatarURL) return
  //check if the url to the file is an avaturn url to infer the file type
  const pendingComponent = getOptionalComponent(entity, AvatarPendingComponent)
  if (pendingComponent && pendingComponent.url === avatarURL) return

  setComponent(entity, AvatarPendingComponent, { url: avatarURL })
  if (hasComponent(entity, AvatarControllerComponent)) AvatarControllerComponent.captureMovement(entity, entity)

  setComponent(entity, ModelComponent, { src: avatarURL, cameraOcclusion: false, convertToVRM: true })
}

export const unloadAvatarForUser = async (entity: Entity) => {
  setComponent(entity, ModelComponent, { src: '' })
  removeComponent(entity, AvatarPendingComponent)
}

const hipsPos = new Vector3(),
  headPos = new Vector3(),
  leftFootPos = new Vector3(),
  leftToesPos = new Vector3(),
  rightFootPos = new Vector3(),
  leftLowerLegPos = new Vector3(),
  leftUpperLegPos = new Vector3(),
  footGap = new Vector3(),
  eyePos = new Vector3(),
  size = new Vector3(),
  box = new Box3()

export const setupAvatarProportions = (entity: Entity, vrm: VRM) => {
  iterateEntityNode(entity, computeTransformMatrix)

  box.expandByObject(vrm.scene).getSize(size)

  const rig = vrm.humanoid.rawHumanBones
  rig.hips.node.getWorldPosition(hipsPos)
  rig.head.node.getWorldPosition(headPos)
  rig.leftFoot.node.getWorldPosition(leftFootPos)
  rig.rightFoot.node.getWorldPosition(rightFootPos)
  rig.leftToes && rig.leftToes.node.getWorldPosition(leftToesPos)
  rig.leftLowerLeg.node.getWorldPosition(leftLowerLegPos)
  rig.leftUpperLeg.node.getWorldPosition(leftUpperLegPos)
  rig.leftEye ? rig.leftEye?.node.getWorldPosition(eyePos) : eyePos.copy(headPos).setY(headPos.y + 0.1) // fallback to rough estimation if no eye bone is present

  const avatarComponent = getMutableComponent(entity, AvatarComponent)
  avatarComponent.avatarHeight.set(size.y)
  avatarComponent.torsoLength.set(Math.abs(headPos.y - hipsPos.y))
  avatarComponent.upperLegLength.set(Math.abs(hipsPos.y - leftLowerLegPos.y))
  avatarComponent.lowerLegLength.set(Math.abs(leftLowerLegPos.y - leftFootPos.y))
  avatarComponent.hipsHeight.set(hipsPos.y)
  avatarComponent.eyeHeight.set(eyePos.y)
  avatarComponent.footHeight.set(leftFootPos.y)
  avatarComponent.footGap.set(footGap.subVectors(leftFootPos, rightFootPos).length())
  // angle from ankle to toes along YZ plane
  rig.leftToes &&
    avatarComponent.footAngle.set(Math.atan2(leftFootPos.z - leftToesPos.z, leftFootPos.y - leftToesPos.y))
}

/**Kicks off avatar animation loading and setup. Called after an avatar's model asset is
 * successfully loaded.
 */
export const setupAvatarForUser = (entity: Entity, model: VRM) => {
  setComponent(entity, AvatarRigComponent, {
    normalizedRig: model.humanoid.normalizedHumanBones,
    rawRig: model.humanoid.rawHumanBones
  })

  setObjectLayers(model.scene, ObjectLayers.Avatar)

  const loadingEffect = getState(AnimationState).avatarLoadingEffect && !getState(XRState).sessionActive && !iOS

  removeComponent(entity, AvatarPendingComponent)

  if (hasComponent(entity, AvatarControllerComponent)) AvatarControllerComponent.releaseMovement(entity, entity)

  if (isClient && loadingEffect) {
    const avatarHeight = getComponent(entity, AvatarComponent).avatarHeight
    setComponent(entity, AvatarDissolveComponent, {
      height: avatarHeight
    })
  }

  if (entity === Engine.instance.localClientEntity) getMutableState(LocalAvatarState).avatarReady.set(true)
}

export const retargetAvatarAnimations = (entity: Entity) => {
  const rigComponent = getComponent(entity, AvatarRigComponent)
  const manager = getStateUnsafe(AnimationState)
  const animations = [] as AnimationClip[]
  for (const key in manager.loadedAnimations) {
    for (const animation of manager.loadedAnimations[key].animations)
      animations.push(bindAnimationClipFromMixamo(animation, rigComponent.vrm))
  }
  setComponent(entity, AnimationComponent, {
    animations: animations,
    mixer: new AnimationMixer(rigComponent.vrm.humanoid.normalizedHumanBonesRoot)
  })
}

/**
 * @todo: stop using global state for avatar speed
 * in future this will be derrived from the actual root motion of a
 * given avatar's locomotion animations
 */
export const setAvatarSpeedFromRootMotion = () => {
  const manager = getStateUnsafe(AnimationState)
  const run = manager.loadedAnimations[preloadedAnimations.locomotion].animations[4] ?? [new AnimationClip()]
  const walk = manager.loadedAnimations[preloadedAnimations.locomotion].animations[6] ?? [new AnimationClip()]
  const movement = getMutableState(AvatarMovementSettingsState)
  if (run) movement.runSpeed.set(getRootSpeed(run))
  if (walk) movement.walkSpeed.set(getRootSpeed(walk))
}

export const getAvatarBoneWorldPosition = (entity: Entity, boneName: string, position: Vector3): boolean => {
  const avatarRigComponent = getOptionalComponent(entity, AvatarRigComponent)
  if (!avatarRigComponent || !avatarRigComponent.normalizedRig) return false
  const bone = avatarRigComponent.normalizedRig[boneName] as VRMHumanBone
  if (!bone) return false
  const el = bone.node.matrixWorld.elements
  position.set(el[12], el[13], el[14])
  return true
}
