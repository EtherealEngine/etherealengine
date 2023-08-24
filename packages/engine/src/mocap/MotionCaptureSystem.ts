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

import { decode, encode } from 'msgpackr'
import { useEffect } from 'react'

import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'

import { DataChannelType } from '@etherealengine/common/src/interfaces/DataChannelType'
import { RingBuffer } from '../common/classes/RingBuffer'

import { Engine } from '../ecs/classes/Engine'

import { defineSystem } from '../ecs/functions/SystemFunctions'
import { addDataChannelHandler, removeDataChannelHandler } from '../networking/NetworkState'
import { Network } from '../networking/classes/Network'
import { NetworkObjectComponent } from '../networking/components/NetworkObjectComponent'

import { Landmark, Results } from '@mediapipe/holistic'

import { AvatarRigComponent } from '../avatar/components/AvatarAnimationComponent'
import { getComponent } from '../ecs/functions/ComponentFunctions'
import { TransformComponent } from '../transform/components/TransformComponent'

import UpdateLandmarkPose from './UpdateLandmarkPose'

const useSolvers = false

export interface MotionCaptureStream extends Results {
  za: Landmark[]
}

export const sendResults = (results: MotionCaptureStream) => {
  return encode({
    timestamp: Date.now(),
    peerID: Engine.instance.peerID,
    results
  })
}

export const receiveResults = (buff: ArrayBuffer) => {
  const { timestamp, peerID, results } = decode(new Uint8Array(buff)) as {
    timestamp: number
    peerID: PeerID
    results: MotionCaptureStream
  }
  // console.log('received mocap data', peerID, results)
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

export const timeSeriesMocapData = new Map<PeerID, RingBuffer<MotionCaptureStream>>()
const timeSeriesMocapLastSeen = new Map<PeerID, number>()

const execute = () => {
  const network = Engine.instance.worldNetwork

  for (const [peerID, mocapData] of timeSeriesMocapData) {
    if (!network?.peers?.has(peerID) || timeSeriesMocapLastSeen.get(peerID)! < Date.now() - 1000) {
      timeSeriesMocapData.delete(peerID)
      timeSeriesMocapLastSeen.delete(peerID)
    }
  }

  for (const [peerID, mocapData] of timeSeriesMocapData) {
    const data = mocapData.popLast()
    timeSeriesMocapLastSeen.set(peerID, Date.now())
    const userID = network.peers.get(peerID)!.userId
    updatePose(userID, data)
  }
}

function updatePose(userID, data: MotionCaptureStream) {
  const entity = NetworkObjectComponent.getUserAvatarEntity(userID)
  if (!entity) return
  const avatarRig = getComponent(entity, AvatarRigComponent)
  const avatarTransform = getComponent(entity, TransformComponent)
  if (!avatarRig || !avatarTransform) return

  const restPose: any = captureRestPose(userID, avatarRig)

  //const avatarHips = avatarRig?.bindRig?.hips?.node
  //const avatarHipsPosition = avatarHips.position.clone().applyMatrix4(avatarTransform.matrix)
  //const avatarRotation = avatarTransform.rotation

  // get a mapping of landmarks to idealized target positions; this is basically the kalikokit approach
  const changes = {}

  //UpdateLandmarkFace(data?.faceLandmarks, changes)
  //UpdateLandmarkHands(data?.leftHandLandmarks, data?.rightHandLandmarks, changes)
  UpdateLandmarkPose(data?.za, data?.poseLandmarks, restPose, changes)

  // test
  applyChanges(changes, avatarRig)

  // resolve these parts using ik
  //UpdateIkPose(data.za, position, rotation)
}

///////////////////////////////////////////////////////////////////////////////
// @todo move this code

import { VRMHumanBoneName } from '@pixiv/three-vrm'
import { Euler } from 'three'
import { updateRigPosition, updateRigRotation } from './UpdateUtils'

function applyChanges(changes, rig) {
  Object.entries(changes).forEach(([key, args]) => {
    const scratch: any = args
    const dampener = scratch.dampener || 1
    const lerp = scratch.lerp || 1
    if (scratch.euler) {
      updateRigRotation(rig, key, scratch.euler, scratch.dampener, scratch.lerp)
    }
    if (scratch.xyz) {
      updateRigPosition(rig, key, scratch.xyz, scratch.dampener, scratch.lerp)
    }
  })
}

const rigs = {}
function captureRestPose(userID, rig) {
  let parts = rigs[userID]
  if (parts) return parts
  parts = rigs[userID] = {}
  Object.entries(VRMHumanBoneName).forEach(([key, key2]) => {
    const part = rig.vrm.humanoid!.getNormalizedBoneNode(key2)
    if (!part) return
    parts[key2] = {
      vrmkey: key2,
      xyz: part.position.clone(),
      quaternion: part.quaternion.clone(),
      euler: new Euler().setFromQuaternion(part.quaternion)
    }
    /*
    console.log(
      key2,
      parts[key2].xyz.x.toFixed(3),
      parts[key2].xyz.y.toFixed(3),
      parts[key2].xyz.z.toFixed(3),
      parts[key2].euler.x.toFixed(3),
      parts[key2].euler.y.toFixed(3),
      parts[key2].euler.z.toFixed(3)
      )
    */
  })
  return parts
}

////////////////////////////////////////////////////////////////////////////////

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
