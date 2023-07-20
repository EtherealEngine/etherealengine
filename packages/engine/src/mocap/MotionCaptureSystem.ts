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

import { Classifications, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { VRMExpressionPresetName } from '@pixiv/three-vrm'
// import { XRAction, XRState } from '../xr/XRState'
import { TFace, Vector } from 'kalidokit'
// import { Classifications } from '@mediapipe/tasks-vision'
// import { VRMExpression } from '@pixiv/three-vrm'
import { decode, encode } from 'msgpackr'
import { useEffect } from 'react'
import { Mesh, Vector3 } from 'three'

// import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'
import { dispatchAction, getState } from '@etherealengine/hyperflux'

import { AvatarRigComponent } from '../avatar/components/AvatarAnimationComponent'
import { RingBuffer } from '../common/classes/RingBuffer'
// import { isClient } from '../common/functions/getEnvironment'
import { Engine } from '../ecs/classes/Engine'
import { EngineState } from '../ecs/classes/EngineState'
import { getComponent } from '../ecs/functions/ComponentFunctions'
// import { removeEntity } from '../ecs/functions/EntityFunctions'
import { defineSystem } from '../ecs/functions/SystemFunctions'
import { DataChannelType, Network } from '../networking/classes/Network'
import { addDataChannelHandler, removeDataChannelHandler } from '../networking/NetworkState'
// import { UUIDComponent } from '../scene/components/UUIDComponent'
import { TransformComponent } from '../transform/components/TransformComponent'

export const motionCaptureHeadSuffix = '_motion_capture_head'
export const motionCaptureLeftHandSuffix = '_motion_capture_left_hand'
export const motionCaptureRightHandSuffix = '_motion_capture_right_hand'

export interface MotionCaptureStream {
  pose: NormalizedLandmark[] | undefined
  worldPose: NormalizedLandmark[] | undefined
  face: Classifications[] | undefined
  tFace: TFace | undefined
  hands: NormalizedLandmark[] | undefined
}

export const sendResults = (results: MotionCaptureStream) => {
  return encode({
    timestamp: Date.now(),
    peerIndex: Engine.instance.worldNetwork.peerIDToPeerIndex.get(Engine.instance.peerID)!,
    results
  })
}

export const receiveResults = (buff: ArrayBuffer) => {
  const { timestamp, peerIndex, results } = decode(new Uint8Array(buff)) as {
    timestamp: number
    peerIndex: number
    results: MotionCaptureStream
  }
  // console.log('receiveResults', results)
  const peerID = Engine.instance.worldNetwork.peerIndexToPeerID.get(peerIndex)
  return { timestamp, peerID, results }
}

export const MotionCaptureFunctions = {
  sendResults,
  receiveResults
}

export const mocapDataChannelType = 'ee.core.mocap.dataChannel' as DataChannelType

const handleMocapData = (
  network: Network,
  dataChannel: DataChannelType,
  fromPeerID: PeerID,
  message: ArrayBufferLike
) => {
  if (network.isHosting) {
    network.transport.bufferToAll(mocapDataChannelType, message)
  }
  const { peerID, results } = MotionCaptureFunctions.receiveResults(message as ArrayBuffer)
  if (!peerID) return
  if (!timeSeriesMocapData.has(peerID)) {
    timeSeriesMocapData.set(peerID, new RingBuffer(10))
  }
  timeSeriesMocapData.get(peerID)!.add(results)
}

const timeSeriesMocapData = new Map<PeerID, RingBuffer<MotionCaptureStream>>()
const timeSeriesMocapLastSeen = new Map<PeerID, number>()

// const objs = [] as Mesh[]
const debug = true

// if (debug)
//   for (let i = 0; i < 33; i++) {
//     objs.push(new Mesh(new SphereGeometry(0.05), new MeshBasicMaterial()))
//     Engine.instance.scene.add(objs[i])
//   }

// const hipsPos = new Vector3()
// const headPos = new Vector3()
// const leftHandPos = new Vector3()
// const rightHandPos = new Vector3()

const poseDebugObjs = [] as Mesh[]
const handDebugObjs = [] as Mesh[]

const execute = () => {
  const engineState = getState(EngineState)

  const localClientEntity = Engine?.instance?.localClientEntity

  const network = Engine?.instance?.worldNetwork

  for (const [peerID, mocapData] of timeSeriesMocapData) {
    if (!network?.peers?.has(peerID) || timeSeriesMocapLastSeen.get(peerID)! < Date.now() - 1000) {
      timeSeriesMocapData.delete(peerID)
      timeSeriesMocapLastSeen.delete(peerID)
    }
  }

  for (const [peerID, mocapData] of timeSeriesMocapData) {
    const userID = network?.peers?.get(peerID)!.userId
    const entity = Engine?.instance?.getUserAvatarEntity(userID)
    if (!entity) continue
    //   const ownerEntity = Engine.instance.getUserAvatarEntity(networkObject.ownerId)
    // console.log('entity', entity)
    // if (entity && entity === localClientEntity) {
    const data = mocapData.popLast()

    if (!data) continue

    timeSeriesMocapLastSeen.set(peerID, Date.now())

    const avatarRig = getComponent(entity, AvatarRigComponent)
    const avatarTransform = getComponent(entity, TransformComponent)

    if (!avatarRig) continue

    // const rawPose = avatarRig?.vrm?.humanoid?.getNormalizedPose()
    const avatarHips = avatarRig?.vrm?.humanoid?.getNormalizedBone('hips')?.node
    const hipsPos = new Vector3()
    avatarHips?.getWorldPosition(hipsPos)

    if (data?.tFace) {
      console.log('data.tFace', data.tFace)
      // const map = avatarRig?.vrm?.expressionManager
      // avatarRig?.vrm?.expressionManager?.setValue(VRMExpressionPresetName[name], faceData[i]?.score)
      // debugger
    }

    // draw face
    if (data?.face) {
      const faceData = data?.face[0]?.categories
      // console.log('faceData', faceData)
      // console.log('exp map', avatarRig?.vrm?.expressionManager?.expressionMap)
      for (let i = 0; i < faceData?.length - 1; i++) {
        // const expName = faceData[i]?.categoryName.startsWith('_') ? `VRMExpression${faceData[i]?.categoryName}` : `VRMExpression_${faceData[i]?.categoryName}`
        // console.log('exp name: ', expName)
        let name = faceData[i]?.categoryName
        name = name.charAt(0).toUpperCase() + name.slice(1)
        // console.log('Cat name: ', expName)
        // const mapExp = avatarRig?.vrm?.expressionManager?.expressionMap[expName]
        // console.log('map - exp: ', mapExp)
        const map = avatarRig?.vrm?.expressionManager?.expressionMap[name]
        if (!map) continue
        // debugger
        // map.weight = faceData[i]?.score
        // map.applyWeight({ multiplier: faceData[i]?.score })
        const currentWeight = avatarRig?.vrm?.expressionManager?.getValue(VRMExpressionPresetName[name])

        const newWeight = Vector.lerp(faceData[i]?.score, currentWeight!, engineState?.deltaSeconds * 10)
        // avatarRig?.vrm?.expressionManager?.setValue(VRMExpressionPresetName[name], faceData[i]?.score)
        avatarRig?.vrm?.expressionManager?.setValue(VRMExpressionPresetName[name], newWeight)
        // console.log('map - cat: ', map)
        // const expMap = avatarRig?.vrm?.expressionManager?.expressions.filter((c) => (c?.expressionName.toLowerCase() === expName.toLowerCase()))
        // console.log('exp', expMap)
        // const exp = avatarRig?.vrm?.expressionManager?.expressions.filter((c) => (c?.expressionName.toLowerCase() === name.toLowerCase()))
        // console.log('exp', exp)
        // avatarRig?.vrm?.expressionManager?.setValue(name, faceData[i]?.score)

        // console.log('exp', avatarRig?.vrm?.expressionManager?.expressions.filter((c) => (c?.expressionName === `VRMExpression${faceData[i]?.categoryName}`)))
        // console.log(`map ${faceData[i]?.categoryName}`, avatarRig?.vrm?.expressionManager?.expressionMap[faceData[i]?.categoryName])
        // console.log('exp', avatarRig?.vrm?.expressionManager?.expressions?.map((c) => c?.expressionName))

        // debugger
      }
      avatarRig?.vrm?.expressionManager?.update()
      // debugger
      // const faceData = data?.face[0]?.categories

      // for (let i = 0; i < faceData?.length - 1; i++) {
      // avatarRig?.vrm?.expressionManager?.expressionMap
      // []?.forEach((exp) => {
      //   // console.log('exp', exp?.name, `VRMExpression_${faceData[i]?.categoryName}`)
      //   if (exp?.name === `VRMExpression_${faceData[i]?.categoryName}`) {
      //     console.log('exp match! ', exp?.name, `VRMExpression_${faceData[i]?.categoryName}`)
      //     avatarRig?.vrm?.expressionManager?.setValue(faceData[i]?.categoryName, faceData[i]?.score)
      //   }
      // })
      // }
    }

    // // draw pose
    // if (data?.worldPose) {
    //   for (let i = 0; i < data?.worldPose?.length - 1; i++) {
    //     const name = VRMHumanBoneList[i].toLowerCase()
    //     const pose = data?.worldPose[i]
    //     const posePos = new Vector3()
    //     posePos
    //       .set(pose?.x, pose?.y, pose?.z)
    //       .multiplyScalar(-1)
    //       .applyQuaternion(avatarTransform.rotation)

    //     const Part = avatarRig?.vrm?.humanoid?.getRawBone(VRMHumanBoneList[i])

    //     if (!Part) continue

    //     const partPos = Part?.node?.worldToLocal(posePos.clone()).clone()

    //     // Part?.node?.position?.lerp(posePos.clone(), engineState.deltaSeconds * 10)

    //     if (debug) {
    //       if (poseDebugObjs[i] === undefined) {
    //         let matOptions = {}
    //         if (name === 'lefthand') {
    //           matOptions = { color: 0x0000ff }
    //         } else if (name === 'righthand') {
    //           matOptions = { color: 0xff0000 }
    //         }
    //         const mesh = new Mesh(new SphereGeometry(0.05), new MeshBasicMaterial(matOptions))
    //         poseDebugObjs[i] = mesh
    //         Engine?.instance?.scene?.add(mesh)
    //       }

    //       poseDebugObjs[i].position.lerp(partPos.clone(), engineState.deltaSeconds * 10)
    //       poseDebugObjs[i].updateMatrixWorld()

    //       // if (VRMHumanBoneList[i].toLowerCase() === 'lefthand') {
    //       //   poseDebugObjs[i]?.material?
    //       // }

    //       // draw pose
    //       // if (data?.hands && (name.startsWith('lefthand') || name.startsWith('righthand'))) {
    //       //   for (let i = 0; i < data?.hands?.length - 1; i++) {
    //       //     const pose = data?.hands[i]
    //       //     const newPos = new Vector3()
    //       //     newPos.applyQuaternion(poseDebugObjs[i].quaternion).add(new Vector3(pose?.x, -pose?.y, pose?.z))
    //       //     // .multiplyScalar(-1)

    //       //     // .setX(pose?.x)
    //       //     // .setZ(pose?.z)
    //       //     // .add(hipsPos)

    //       //     if (handDebugObjs[i] === undefined) {
    //       //       const matOptions = {}
    //       //       // if (name === 'lefthand') {
    //       //       //   matOptions = { color: 0x0000ff }
    //       //       // } else if (name === 'righthand') {
    //       //       //   matOptions = { color: 0xff0000 }
    //       //       // }
    //       //       const mesh = new Mesh(new SphereGeometry(0.0125), new MeshBasicMaterial(matOptions))
    //       //       handDebugObjs[i] = mesh
    //       //       Engine?.instance?.scene?.add(mesh)

    //       //       handDebugObjs[i].position.lerp(newPos.clone(), engineState.deltaSeconds * 10)
    //       //       handDebugObjs[i].updateMatrixWorld()
    //       //     }

    //       //     // if (VRMHumanBoneList[i].toLowerCase() === 'lefthand') {
    //       //     //   poseDebugObjs[i]?.material?
    //       //     // }
    //       //   }
    //       // }
    //     }

    //     // const bone = Object.keys(POSE_LANDMARKS)[i]
    //     // avatarRig?.rig[bone]?.node.position.lerp(newPos, engineState.deltaSeconds * 10)
    //     // avatarRig?.rig[bone]?.node.updateMatrixWorld()
    //     // const Part = avatarRig?.vrm?.humanoid?.getRawBoneNode(VRMHumanBoneList[i])
    //     // // const bonePos = new Vector3()
    //     // // bonePos
    //     // //     .set(data?.pose[i]?.x, data?.pose[i]?.y, data?.pose[i]?.z)
    //     //     // .multiplyScalar(-1)
    //     //     // .applyQuaternion(avatarTransform.rotation)
    //     //     // .add(hipsPos)
    //     // // if (!Part) return
    //     // const partPos = Part?.position || new Vector3()
    //     // const bonePos = poseDebugObjs[i]?.worldToLocal(partPos) || new Vector3()

    //     // Part?.position?.lerp(bonePos, engineState.deltaSeconds * 50)
    //   }
    // }
  }
  // }
}

const reactor = () => {
  useEffect(() => {
    addDataChannelHandler(mocapDataChannelType, handleMocapData)

    return () => {
      removeDataChannelHandler(mocapDataChannelType, handleMocapData)
    }
  }, [])
  return null
}

export const MotionCaptureSystem = defineSystem({
  uuid: 'ee.engine.MotionCaptureSystem',
  execute,
  reactor
})
