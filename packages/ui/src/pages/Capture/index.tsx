/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License") you may not use this file except in compliance
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

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useHookstate } from '@hookstate/core'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { useMediaNetwork } from '@etherealengine/client-core/src/common/services/MediaInstanceConnectionService'
import { InstanceChatWrapper } from '@etherealengine/client-core/src/components/InstanceChat'
import { createDataProducer } from '@etherealengine/client-core/src/networking/DataChannelSystem'
import { RecordingFunctions, RecordingState } from '@etherealengine/client-core/src/recording/RecordingService'
import { MediaStreamService, MediaStreamState } from '@etherealengine/client-core/src/transports/MediaStreams'
import {
  SocketWebRTCClientNetwork,
  toggleWebcamPaused
} from '@etherealengine/client-core/src/transports/SocketWebRTCClientFunctions'
import { useVideoFrameCallback } from '@etherealengine/common/src/utils/useVideoFrameCallback'
import { ECSRecordingFunctions } from '@etherealengine/engine/src/ecs/ECSRecordingSystem'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'

import { CaptureClientSettingsState } from '@etherealengine/client-core/src/media/CaptureClientSettingsState'
import { useGet } from '@etherealengine/engine/src/common/functions/FeathersHooks'
import { throttle } from '@etherealengine/engine/src/common/functions/FunctionHelpers'
import { MotionCaptureFunctions, mocapDataChannelType } from '@etherealengine/engine/src/mocap/MotionCaptureSystem'
import { MediasoupDataProducerConsumerState } from '@etherealengine/engine/src/networking/systems/MediasoupDataProducerConsumerState'
import { MediaProducerActions } from '@etherealengine/engine/src/networking/systems/MediasoupMediaProducerConsumerState'
import { RecordingID } from '@etherealengine/engine/src/schemas/recording/recording.schema'
import { dispatchAction, getMutableState, getState } from '@etherealengine/hyperflux'
import Drawer from '@etherealengine/ui/src/components/tailwind/Drawer'
import Header from '@etherealengine/ui/src/components/tailwind/Header'
import RecordingsList from '@etherealengine/ui/src/components/tailwind/RecordingList'
import Canvas from '@etherealengine/ui/src/primitives/tailwind/Canvas'
import Video from '@etherealengine/ui/src/primitives/tailwind/Video'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { NormalizedLandmarkList, Options, POSE_CONNECTIONS, Pose } from '@mediapipe/pose'
import { DataProducer } from 'mediasoup-client/lib/DataProducer'
import Toolbar from '../../components/tailwind/mocap/Toolbar'

// import { VideoPlayer } from '@videojs-player/react'
import 'video.js/dist/video-js.css'

/**
 * Start playback of a recording
 * - If we are streaming data, close the data producer
 */
export const startPlayback = async (recordingID: RecordingID, twin = true) => {
  const network = Engine.instance.worldNetwork as SocketWebRTCClientNetwork
  const dataProducer = MediasoupDataProducerConsumerState.getProducerByDataChannel(
    network.id,
    mocapDataChannelType
  ) as DataProducer
  if (getState(RecordingState).playback && dataProducer) {
    dispatchAction(
      MediaProducerActions.producerClosed({
        producerID: dataProducer.id,
        $network: network.id,
        $topic: network.topic
      })
    )
  }
  ECSRecordingFunctions.startPlayback({
    recordingID,
    targetUser: twin ? undefined : Engine.instance.userID
  })
}

let creatingProducer = false
const sendResults = (results: NormalizedLandmarkList) => {
  const network = Engine.instance.worldNetwork as SocketWebRTCClientNetwork
  if (!network?.ready) return
  const dataProducer = MediasoupDataProducerConsumerState.getProducerByDataChannel(
    network.id,
    mocapDataChannelType
  ) as DataProducer
  if (!dataProducer) {
    if (creatingProducer) return
    creatingProducer = true
    createDataProducer(network, { label: mocapDataChannelType, ordered: true })
    return
  }
  if (!dataProducer?.closed && dataProducer?.readyState === 'open') {
    // console.log('sending results', results)
    const data = MotionCaptureFunctions.sendResults(results)
    dataProducer?.send(data)
  }
}

const useResizableCanvas = () => {
  const videoRef = useRef<HTMLVideoElement>()
  const canvasRef = useRef<HTMLCanvasElement>()
  const canvasCtxRef = useRef<CanvasRenderingContext2D>()

  const resizeCanvas = () => {
    if (canvasRef.current?.width !== videoRef.current?.clientWidth) {
      canvasRef.current!.width = videoRef.current!.clientWidth
    }

    if (canvasRef.current?.height !== videoRef.current?.clientHeight) {
      canvasRef.current!.height = videoRef.current!.clientHeight
    }
  }

  useEffect(() => {
    window.addEventListener('resize', () => {
      resizeCanvas()
    })
    return () => {
      window.removeEventListener('resize', () => {
        resizeCanvas()
      })
    }
  }, [])

  return {
    videoRef,
    canvasRef,
    canvasCtxRef,
    resizeCanvas
  }
}

const useVideoStatus = () => {
  const videoStream = useHookstate(getMutableState(MediaStreamState).videoStream)
  const videoPaused = useHookstate(getMutableState(MediaStreamState).videoPaused)
  const videoActive = !!videoStream.value && !videoPaused.value
  const mediaNetworkState = useMediaNetwork()
  if (!mediaNetworkState?.connected?.value) return 'loading'
  if (!videoActive) return 'ready'
  return 'active'
}

const RecordingMode = () => {
  const captureState = useHookstate(getMutableState(CaptureClientSettingsState))
  const captureSettings = captureState?.nested('settings')?.value
  const displaySettings = captureSettings.filter((s) => s?.name.toLowerCase() === 'display')[0]
  const trackingSettings = captureSettings.filter((s) => s?.name.toLowerCase() === 'tracking')[0]
  const debugSettings = captureSettings.filter((s) => s?.name.toLowerCase() === 'debug')[0]

  const mediaNetworkState = useMediaNetwork()

  const isDetecting = useHookstate(false)
  const [detectingStatus, setDetectingStatus] = useState<'loading' | 'active' | 'inactive'>('inactive')

  const poseDetector = useHookstate(null as null | Pose)

  const processingFrame = useHookstate(false)

  const videoStatus = useVideoStatus()

  const { videoRef, canvasRef, canvasCtxRef, resizeCanvas } = useResizableCanvas()

  const videoStream = useHookstate(getMutableState(MediaStreamState).videoStream)

  useEffect(() => {
    const factor = displaySettings.flipVideo === true ? '-1' : '1'
    canvasRef.current!.style.transform = `scaleX(${factor})`
    videoRef.current!.style.transform = `scaleX(${factor})`
  }, [displaySettings.flipVideo])

  useLayoutEffect(() => {
    canvasCtxRef.current = canvasRef.current!.getContext('2d')!
    videoRef.current!.srcObject = videoStream.value
    resizeCanvas()
  }, [videoStream])

  const throttledSend = throttle(sendResults, 1)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useVideoFrameCallback(videoRef.current, (videoTime, metadata) => {
    if (processingFrame.value) return

    if (poseDetector.value) {
      processingFrame.set(true)
      poseDetector.value?.send({ image: videoRef.current! }).finally(() => {
        processingFrame.set(false)
      })
    }
  })

  useEffect(() => {
    if (!isDetecting?.value) return

    if (!poseDetector.value) {
      if (Pose !== undefined) {
        setDetectingStatus('loading')
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          }
        })
        pose.setOptions({
          // enableFaceGeometry: trackingSettings?.enableFaceGeometry,
          selfieMode: displaySettings?.flipVideo,
          modelComplexity: trackingSettings?.modelComplexity,
          smoothLandmarks: trackingSettings?.smoothLandmarks,
          enableSegmentation: trackingSettings?.enableSegmentation,
          smoothSegmentation: trackingSettings?.smoothSegmentation,
          // refineFaceLandmarks: trackingSettings?.refineFaceLandmarks,
          minDetectionConfidence: trackingSettings?.minDetectionConfidence,
          minTrackingConfidence: trackingSettings?.minTrackingConfidence
        } as Options)
        poseDetector.set(pose)
      }
    }

    processingFrame.set(false)

    if (poseDetector.value) {
      poseDetector.value.onResults((results) => {
        if (Object.keys(results).length === 0) return
        if (detectingStatus !== 'active') setDetectingStatus('active')

        const { poseLandmarks, poseWorldLandmarks } = results

        if (debugSettings?.throttleSend) {
          throttledSend(poseWorldLandmarks)
        } else {
          sendResults(poseWorldLandmarks)
        }

        processingFrame.set(false)

        if (displaySettings?.show2dSkeleton) {
          if (!canvasCtxRef.current || !canvasRef.current || !poseLandmarks) return

          //draw!!!
          canvasCtxRef.current.save()
          canvasCtxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          canvasCtxRef.current.globalCompositeOperation = 'source-over'

          // Pose Connections
          drawConnectors(canvasCtxRef.current, poseLandmarks, POSE_CONNECTIONS, {
            color: '#fff',
            lineWidth: 4
          })
          // Pose Landmarks
          drawLandmarks(canvasCtxRef.current, poseLandmarks, {
            color: '#fff',
            radius: 2
          })

          // // Left Hand Connections
          // drawConnectors(
          //   canvasCtxRef.current,
          //   leftHandLandmarks !== undefined ? leftHandLandmarks : [],
          //   HAND_CONNECTIONS,
          //   {
          //     color: '#fff',
          //     lineWidth: 4
          //   }
          // )

          // // Left Hand Landmarks
          // drawLandmarks(canvasCtxRef.current, leftHandLandmarks !== undefined ? leftHandLandmarks : [], {
          //   color: '#fff',
          //   radius: 2
          // })

          // // Right Hand Connections
          // drawConnectors(
          //   canvasCtxRef.current,
          //   rightHandLandmarks !== undefined ? rightHandLandmarks : [],
          //   HAND_CONNECTIONS,
          //   {
          //     color: '#fff',
          //     lineWidth: 4
          //   }
          // )

          // // Right Hand Landmarks
          // drawLandmarks(canvasCtxRef.current, rightHandLandmarks !== undefined ? rightHandLandmarks : [], {
          //   color: '#fff',
          //   radius: 2
          // })

          // // Face Connections
          // drawConnectors(canvasCtxRef.current, faceLandmarks, FACEMESH_TESSELATION, {
          //   color: '#fff',
          //   lineWidth: 1
          // })
          // Face Landmarks
          // drawLandmarks(canvasCtxRef.current, faceLandmarks, {
          //   color: '#fff',
          //   lineWidth: 1
          // })
          canvasCtxRef.current.restore()
        }
      })
    }

    return () => {
      setDetectingStatus('inactive')
      if (poseDetector.value) {
        poseDetector.value.close()
      }
      poseDetector.set(null)
    }
  }, [isDetecting])

  return (
    <>
      <div className="absolute w-full h-full top-0 left-0 flex items-center" style={{ backgroundColor: '#000000' }}>
        <Video
          ref={videoRef}
          className={twMerge('w-full h-auto opacity-100', !displaySettings?.showVideo && 'opacity-0')}
        />
      </div>
      <div
        className="object-contain absolute top-0 left-0 z-1 min-w-full h-auto"
        style={{ objectFit: 'contain', top: '0px' }}
      >
        <Canvas ref={canvasRef} />
      </div>
      <button
        onClick={() => {
          if (mediaNetworkState?.connected?.value) toggleWebcamPaused()
        }}
        className="absolute btn btn-ghost bg-none h-full w-full container mx-auto m-0 p-0 top-0 left-0 z-2"
      >
        {videoStatus === 'ready' && <h1>Enable Camera</h1>}
        {videoStatus === 'loading' && <h1>Loading...</h1>}
      </button>
    </>
  )
}

const PlaybackMode = () => {
  const captureState = useHookstate(getMutableState(CaptureClientSettingsState))
  const captureSettings = captureState?.nested('settings')?.value
  const displaySettings = captureSettings.filter((s) => s?.name.toLowerCase() === 'display')[0]

  const recordingID = useHookstate(getMutableState(RecordingState).playback)

  const recording = useGet('recording', recordingID.value!)
  console.log({ recording })

  const { videoRef, canvasRef, canvasCtxRef } = useResizableCanvas()

  useEffect(() => {}, [])

  useEffect(() => {
    if (!recording.data || !videoRef.current) return
    const res = recording.data.resources[0]
    if (!res) return
    // videoRef.current.src = res.url
    // videoRef.current.play()
  }, [videoRef.current, recording])

  const src = recording.data?.resources?.[0]?.url

  return (
    <>
      <div className="absolute w-full h-full top-0 left-0 flex items-center" style={{ backgroundColor: '#000000' }}>
        {/* <Video
          ref={videoRef}
          className={twMerge('w-full h-auto opacity-100', !displaySettings?.showVideo && 'opacity-0')}
        /> */}

        {/* {src && (
          <VideoPlayer
            src={src}
            liveui={false}
            crossorigin="anonymous"
            autoplay={true}
            // poster="/your-path/poster.jpg"
            controls
            fluid={true}
            playbackRates={[0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]}
            disablePictureInPicture={true}
            volume={0.0}
          />
        )} */}
      </div>
      <div
        className="object-contain absolute top-0 left-0 z-1 min-w-full h-auto"
        style={{ objectFit: 'contain', top: '0px' }}
      >
        <Canvas ref={canvasRef} />
      </div>
    </>
  )
}

const CaptureDashboard = () => {
  const mode = useHookstate<'playback' | 'capture'>('capture')
  const recordingID = useHookstate(getMutableState(RecordingState).recordingID)
  const playback = useHookstate(getMutableState(RecordingState).playback)
  const started = useHookstate(getMutableState(RecordingState).started)

  useEffect(() => {
    RecordingFunctions.getRecordings()
  }, [])

  // todo include a mechanism to confirm that the recording has started/stopped
  const onToggleRecording = () => {
    if (recordingID.value) {
      ECSRecordingFunctions.stopRecording({
        recordingID: recordingID.value
      })
      RecordingFunctions.getRecordings()
    } else if (!started.value) {
      RecordingFunctions.startRecording({
        user: { Avatar: true },
        peers: { [Engine.instance.peerID]: { Audio: true, Video: true, Mocap: true } }
      }).then((recordingID) => {
        if (recordingID) ECSRecordingFunctions.startRecording({ recordingID })
      })
    }
  }

  const videoStatus = useVideoStatus()

  const getRecordingStatus = () => {
    if (!recordingID.value) return 'inactive'
    if (playback.value) return 'active'
    return 'ready'
  }
  const recordingStatus = getRecordingStatus()

  return (
    <div className="w-full container mx-auto max-w-[1024px] overflow-hidden">
      <Drawer settings={<div></div>}>
        <Header mode={mode} />
        <div className="w-full container mx-auto pointer-events-auto">
          <div className="w-full h-auto px-2">
            <div className="w-full h-auto relative aspect-video overflow-hidden">
              {mode.value === 'playback' ? <PlaybackMode /> : <RecordingMode />}
            </div>
          </div>
          {mode.value === 'capture' && (
            <div className="w-full container mx-auto">
              <Toolbar
                className="w-full"
                videoStatus={videoStatus}
                // detectingStatus={mocap.detectingStatus}
                onToggleRecording={onToggleRecording}
                toggleWebcam={toggleWebcamPaused}
                // toggleDetecting={() => mocap.isDetecting.set((v) => !v)}
                isRecording={started.value}
                recordingStatus={recordingStatus}
                cycleCamera={MediaStreamService.cycleCamera}
              />
            </div>
          )}
          {mode.value === 'playback' && (
            <div className="w-full container mx-auto flex">
              <div className="w-full relative m-2">
                <RecordingsList
                  {...{
                    startPlayback,
                    stopPlayback: ECSRecordingFunctions.stopPlayback
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <footer className="footer fixed bottom-0">
          <div style={{ display: 'none' }}>
            <InstanceChatWrapper />
          </div>
        </footer>
      </Drawer>
    </div>
  )
}

CaptureDashboard.displayName = 'CaptureDashboard'

CaptureDashboard.defaultProps = {}

export default CaptureDashboard
