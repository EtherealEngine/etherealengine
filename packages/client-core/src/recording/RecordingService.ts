import { useEffect } from 'react'

import { RecordingResult } from '@etherealengine/common/src/interfaces/Recording'
import { IKSerialization } from '@etherealengine/engine/src/avatar/IKSerialization'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { ECSRecordingActions } from '@etherealengine/engine/src/ecs/ECSRecording'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { mocapDataChannelType } from '@etherealengine/engine/src/mocap/MotionCaptureSystem'
import { webcamVideoDataChannelType } from '@etherealengine/engine/src/networking/NetworkState'
import { PhysicsSerialization } from '@etherealengine/engine/src/physics/PhysicsSerialization'
import { createActionQueue, defineState, getMutableState, getState, removeActionQueue } from '@etherealengine/hyperflux'

import { NotificationService } from '../common/services/NotificationService'

export const RecordingState = defineState({
  name: 'RecordingState',
  initial: {
    started: false,
    recordingID: null as string | null,
    config: {
      mocap: true,
      video: true,
      pose: true
    },
    recordings: [] as RecordingResult[],
    playback: null as string | null
  }
})

export const RecordingFunctions = {
  startRecording: async () => {
    try {
      const state = getState(RecordingState)
      const schema = [] as string[]
      if (state.config.pose) {
        schema.push(PhysicsSerialization.ID)
      }
      if (state.config.mocap) {
        schema.push(IKSerialization.headID)
        schema.push(IKSerialization.leftHandID)
        schema.push(IKSerialization.rightHandID)
        schema.push(mocapDataChannelType)
      }
      if (state.config.video) {
        schema.push(webcamVideoDataChannelType)
      }
      const recording = (await Engine.instance.api.service('recording').create({
        schema: JSON.stringify(schema)
      })) as RecordingResult
      return recording.id
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  getRecordings: async () => {
    const recordings = (await Engine.instance.api.service('recording').find()).data as RecordingResult[]
    const recordingState = getMutableState(RecordingState)
    recordingState.recordings.set(recordings)
  }
}

const startRecordingQueue = createActionQueue(ECSRecordingActions.startRecording.matches)
const recordingStartedQueue = createActionQueue(ECSRecordingActions.recordingStarted.matches)
const stopRecordingQueue = createActionQueue(ECSRecordingActions.stopRecording.matches)
const playbackChangedQueue = createActionQueue(ECSRecordingActions.playbackChanged.matches)

const execute = () => {
  const recordingState = getMutableState(RecordingState)

  for (const action of recordingStartedQueue()) {
    recordingState.started.set(true)
    recordingState.recordingID.set(action.recordingID)
  }

  for (const action of startRecordingQueue()) {
    recordingState.started.set(true)
  }

  for (const action of stopRecordingQueue()) {
    recordingState.started.set(false)
    recordingState.recordingID.set(null)
  }

  for (const action of playbackChangedQueue()) {
    recordingState.playback.set(action.playing ? action.recordingID : null)
  }
}

const reactor = () => {
  useEffect(() => {
    return () => {
      removeActionQueue(startRecordingQueue)
      removeActionQueue(recordingStartedQueue)
      removeActionQueue(stopRecordingQueue)
      removeActionQueue(playbackChangedQueue)
    }
  }, [])
  return null
}

export const RecordingServiceSystem = defineSystem({
  uuid: 'ee.client.RecordingServiceSystem',
  execute,
  reactor
})
