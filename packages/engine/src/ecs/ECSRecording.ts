import { defineAction, dispatchAction } from '@etherealengine/hyperflux'

import { matches, matchesUserId } from '../common/functions/MatchesUtils'
import { NetworkTopics } from '../networking/classes/Network'
import { Engine } from './classes/Engine'

export const startRecording = (args: { recordingID: string; mocap: boolean; video: boolean; avatarPose: boolean }) => {
  const { recordingID, mocap, video, avatarPose } = args
  const action = ECSRecordingActions.startRecording({
    recordingID,
    mocap,
    video,
    avatarPose
  })

  dispatchAction({
    ...action,
    $topic: NetworkTopics.world,
    $to: Engine.instance.worldNetwork.hostId
  })

  if (video) {
    dispatchAction({
      ...action,
      $topic: NetworkTopics.media,
      $to: Engine.instance.mediaNetwork.hostId
    })
  }
}

export const stopRecording = (args: { recordingID: string; video: boolean }) => {
  const recording = ECSRecordingActions.stopRecording({
    recordingID: args.recordingID
  })
  dispatchAction({
    ...recording,
    $topic: NetworkTopics.world,
    $to: Engine.instance.worldNetwork.hostId
  })
  if (args.video) {
    dispatchAction({
      ...recording,
      $topic: NetworkTopics.media,
      $to: Engine.instance.mediaNetwork.hostId
    })
  }
}

export const ECSRecordingFunctions = {
  startRecording,
  stopRecording
}

export class ECSRecordingActions {
  static startRecording = defineAction({
    type: 'ee.core.motioncapture.START_RECORDING' as const,
    recordingID: matches.string,
    mocap: matches.boolean,
    video: matches.boolean,
    avatarPose: matches.boolean
  })

  static recordingStarted = defineAction({
    type: 'ee.core.motioncapture.RECORDING_STARTED' as const,
    recordingID: matches.string
  })

  static stopRecording = defineAction({
    type: 'ee.core.motioncapture.STOP_RECORDING' as const,
    recordingID: matches.string
  })

  static startPlayback = defineAction({
    type: 'ee.core.motioncapture.PLAY_RECORDING' as const,
    recordingID: matches.string,
    targetUser: matchesUserId
  })

  static stopPlayback = defineAction({
    type: 'ee.core.motioncapture.STOP_PLAYBACK' as const,
    recordingID: matches.string,
    targetUser: matchesUserId
  })

  static error = defineAction({
    type: 'ee.core.motioncapture.ERROR' as const,
    error: matches.string
  })
}
