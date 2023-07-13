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
import {
  Classifications,
  DrawingUtils,
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  NormalizedLandmark,
  PoseLandmarker
} from '@mediapipe/tasks-vision'
// import * as Kalidokit from 'kalidokit'
// import PoseSolver from './kalidokit/PoseSolver'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { useMediaInstance } from '@etherealengine/client-core/src/common/services/MediaInstanceConnectionService'
import { InstanceChatWrapper } from '@etherealengine/client-core/src/components/InstanceChat'
import { CaptureClientSettingsState } from '@etherealengine/client-core/src/media/CaptureClientSettingsState'
import { RecordingFunctions, RecordingState } from '@etherealengine/client-core/src/recording/RecordingService'
import { MediaStreamService, MediaStreamState } from '@etherealengine/client-core/src/transports/MediaStreams'
import {
  closeDataProducer,
  SocketWebRTCClientNetwork,
  toggleWebcamPaused
} from '@etherealengine/client-core/src/transports/SocketWebRTCClientFunctions'
import { useVideoFrameCallback } from '@etherealengine/common/src/utils/useVideoFrameCallback'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { ECSRecordingFunctions } from '@etherealengine/engine/src/ecs/ECSRecording'
import {
  mocapDataChannelType,
  MotionCaptureFunctions,
  MotionCaptureStream
} from '@etherealengine/engine/src/mocap/MotionCaptureSystem'
import { getMutableState, getState } from '@etherealengine/hyperflux'
import Drawer from '@etherealengine/ui/src/components/tailwind/Drawer'
import Header from '@etherealengine/ui/src/components/tailwind/Header'
import RecordingsList from '@etherealengine/ui/src/components/tailwind/RecordingList'
import Toolbar from '@etherealengine/ui/src/components/tailwind/Toolbar'
import Canvas from '@etherealengine/ui/src/primitives/tailwind/Canvas'
import Video from '@etherealengine/ui/src/primitives/tailwind/Video'

let creatingProducer = false
const startDataProducer = async () => {
  const network = Engine.instance.worldNetwork as SocketWebRTCClientNetwork
  if (!network?.sendTransport || creatingProducer) return
  creatingProducer = true
  const dataProducer = await network.sendTransport.produceData({
    appData: { data: {} },
    ordered: true,
    label: mocapDataChannelType,
    // maxPacketLifeTime: 0,
    maxRetransmits: 1,
    protocol: 'raw'
  })
  dataProducer.on('transportclose', () => {
    network.dataProducers.delete(mocapDataChannelType)
  })
  network.dataProducers.set(mocapDataChannelType, dataProducer)
}

/**
 * Start playback of a recording
 * - If we are streaming data, close the data producer
 */
const startPlayback = async (recordingID: string, twin = true) => {
  const network = Engine?.instance?.worldNetwork as SocketWebRTCClientNetwork
  if (getState(RecordingState)?.playback && network?.dataProducers?.has(mocapDataChannelType)) {
    await closeDataProducer(network, mocapDataChannelType)
  }
  ECSRecordingFunctions.startPlayback({
    recordingID,
    targetUser: twin ? undefined : Engine.instance.userId
  })
}

const sendResults = (results: MotionCaptureStream) => {
  const network = Engine?.instance?.worldNetwork as SocketWebRTCClientNetwork
  if (!network?.sendTransport) return
  const dataProducer = network?.dataProducers?.get(mocapDataChannelType)
  if (!dataProducer) {
    startDataProducer()
    return
  }
  if (!dataProducer?.closed && dataProducer?.readyState === 'open') {
    // console.log('sending results', results)
    const data = MotionCaptureFunctions.sendResults(results)
    dataProducer?.send(data)
  }
}

const CaptureDashboard = () => {
  const captureState = useHookstate(getMutableState(CaptureClientSettingsState))
  const displaySettings = captureState?.nested('settings')?.value?.filter((s) => s?.name.toLowerCase() === 'display')[0]
  const trackingSettings = captureState
    ?.nested('settings')
    ?.value?.filter((s) => s?.name.toLowerCase() === 'tracking')[0]

  const isDetecting = useHookstate(false)
  const [detectingStatus, setDetectingStatus] = useState('inactive')

  const poseDetector = useHookstate(null as null | PoseLandmarker)
  const handDetector = useHookstate(null as null | HandLandmarker)
  const faceDetector = useHookstate(null as null | FaceLandmarker)

  const processingFrame = useHookstate(false)

  const videoRef = useRef<HTMLVideoElement>()
  const canvasRef = useRef<HTMLCanvasElement>()
  const canvasCtxRef = useRef<CanvasRenderingContext2D>()
  const drawUtilsRef = useRef<DrawingUtils>()

  const videoStream = useHookstate(getMutableState(MediaStreamState).videoStream)

  const mediaConnection = useMediaInstance()
  const mediaStreamState = useHookstate(getMutableState(MediaStreamState))
  const recordingState = useHookstate(getMutableState(RecordingState))

  const videoActive = useHookstate(false)

  const resizeCanvas = () => {
    canvasRef.current!.width = videoRef.current!.clientWidth
    canvasRef.current!.height = videoRef.current!.clientHeight
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

  useEffect(() => {
    RecordingFunctions.getRecordings()
  }, [])

  useEffect(() => {
    const factor = displaySettings.flipVideo === true ? '-1' : '1'
    canvasRef.current!.style.transform = `scaleX(${factor})`
    videoRef.current!.style.transform = `scaleX(${factor})`
  }, [displaySettings.flipVideo])

  useLayoutEffect(() => {
    canvasCtxRef.current = canvasRef.current!.getContext('2d')!
    videoRef.current!.srcObject = videoStream.value
    videoRef.current!.onplay = () => videoActive.set(true)
    videoRef.current!.onpause = () => videoActive.set(false)
    drawUtilsRef.current = new DrawingUtils(canvasRef.current!.getContext('2d')!)
    resizeCanvas()
  }, [videoStream])

  // useEffect(() => {
  //   detector.value?.setOptions(poseOptions.value)
  // }, [detector, poseOptions])

  useEffect(() => {
    if (!isDetecting?.value) return

    if (!poseDetector.value) {
      const loadWASM = async () => {
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm')
        createDetectors(vision)
      }
      const createDetectors = async (vision) => {
        setDetectingStatus('loading')

        if (trackingSettings?.trackBody === true) {
          const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.25,
            minPosePresenceConfidence: 0.25,
            minTrackingConfidence: 0.25,
            outputSegmentationMasks: false
          })
          poseDetector.set(poseLandmarker)
        }
        if (trackingSettings?.trackHands === true) {
          const handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
            },
            runningMode: 'VIDEO',
            numHands: 2
            // minHandDetectionConfidence: 0.5,
            // minHandPresenceConfidence: 0.5,
            // minTrackingConfidence: 0.5,
          })
          handDetector.set(handLandmarker)
        }
        if (trackingSettings?.trackFace === true) {
          const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
            },
            runningMode: 'VIDEO',
            // numFaces: 1,
            // minFaceDetectionConfidence: 0.5,
            // minFacePresenceConfidence: 0.5,
            // minTrackingConfidence: 0.5,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true
          })
          faceDetector.set(faceLandmarker)
        }
      }
      loadWASM()
    }

    processingFrame.set(false)

    return () => {
      setDetectingStatus('inactive')
      if (poseDetector.value) {
        poseDetector.value.close()
      }
      poseDetector.set(null)
      if (handDetector.value) {
        handDetector.value.close()
      }
      handDetector.set(null)
      if (faceDetector.value) {
        faceDetector.value.close()
      }
      faceDetector.set(null)
    }
  }, [isDetecting])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useVideoFrameCallback(videoRef.current, (videoTime, metadata) => {
    resizeCanvas()

    if (processingFrame.value || !poseDetector.value) return

    poseDetector?.value?.detectForVideo(videoRef.current!, videoTime * 1000, (poseResults) => {
      if (detectingStatus !== 'active') setDetectingStatus('active')
      if (displaySettings?.show2dSkeleton) {
        // const poseRig = PoseSolver(poseResults.landmarks, poseResults.worldLandmarks, true)
        // console.log(`poseRig`, poseRig)

        const faceResults = faceDetector?.value?.detectForVideo(videoRef.current!, videoTime * 1000)
        const handResults = handDetector?.value?.detectForVideo(videoRef.current!, videoTime * 1000)
        sendResults({
          pose: poseResults.landmarks[0],
          worldPose: poseResults.worldLandmarks[0],
          face: faceResults?.faceBlendshapes,
          hands: handResults?.landmarks[0]
        })

        canvasCtxRef?.current?.save()
        canvasCtxRef?.current?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)

        for (const landmark of poseResults.landmarks) {
          // drawUtilsRef.current?.drawLandmarks(landmark, {
          //   // color: 'none',
          //   radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
          // })
          drawUtilsRef.current?.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS)
        }

        for (const landmark of poseResults.landmarks) {
          drawUtilsRef.current?.drawLandmarks(landmark, {
            // color: 'none',
            radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
          })
          drawUtilsRef.current?.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS)
        }

        if (trackingSettings?.trackFace === true && faceDetector?.value) {
          // for (const landmark of faceResults!.faceLandmarks) {
          //   drawUtilsRef.current?.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_TESSELATION)
          // }
        }

        if (trackingSettings?.trackHands === true && handDetector?.value) {
          for (const landmark of handResults?.landmarks || []) {
            drawUtilsRef.current?.drawConnectors(landmark, HandLandmarker.HAND_CONNECTIONS)
          }
        }

        canvasCtxRef.current?.restore()
      }
    })
  })

  // todo include a mechanism to confirm that the recording has started/stopped
  const onToggleRecording = () => {
    if (recordingState.recordingID.value) {
      ECSRecordingFunctions.stopRecording({
        recordingID: recordingState.recordingID.value
      })
      RecordingFunctions.getRecordings()
    } else if (!recordingState.started.value) {
      RecordingFunctions.startRecording().then((recordingID) => {
        if (recordingID) ECSRecordingFunctions.startRecording({ recordingID })
      })
    }
  }

  const isCamVideoEnabled =
    mediaStreamState?.camVideoProducer?.value !== null && mediaStreamState?.videoPaused?.value === false
  const videoStatus =
    !mediaConnection?.connected?.value && !videoActive?.value
      ? 'loading'
      : isCamVideoEnabled !== true
      ? 'ready'
      : 'active'
  const recordingStatus =
    !recordingState?.recordingID?.value && isDetecting?.value !== true
      ? 'inactive'
      : recordingState?.started?.value
      ? 'active'
      : 'ready'

  return (
    <div className="w-full container mx-auto">
      <Drawer
        settings={
          <div></div>
          // <div className="w-100 bg-base-100">
          //   <div tabIndex={0} className="collapse collapse-open">
          //     <div className="collapse-title w-full h-[50px]">
          //       <h1>Pose Options</h1>
          //     </div>
          //     <div className="collapse-content w-full h-auto">
          //       <ul className="text-base-content w-full h-auto">
          //         <li>
          //           <label className="label">
          //             <span className="label-text">Model Complexity: {poseOptions.modelComplexity.value}</span>
          //           </label>
          //           <input
          //             type="range"
          //             min="0"
          //             max="2"
          //             step="1"
          //             value={poseOptions.modelComplexity.value}
          //             className="range w-full"
          //             onChange={(e) => {
          //               poseOptions.modelComplexity.set(parseInt(e.currentTarget.value) as 0 | 1 | 2)
          //             }}
          //           />
          //         </li>
          //         <li>
          //           <label className="cursor-pointer label">
          //             <span className="label-text">
          //               Min Detection Confidence: {poseOptions.minDetectionConfidence.value}
          //             </span>
          //           </label>
          //           <input
          //             type="range"
          //             min="0.0"
          //             max="1.0"
          //             step="0.1"
          //             value={poseOptions.minDetectionConfidence.value}
          //             className="w-full range"
          //             onChange={(e) => {
          //               poseOptions.minDetectionConfidence.set(parseFloat(e.currentTarget.value))
          //             }}
          //           />
          //         </li>
          //         <li>
          //           <label className="cursor-pointer label">
          //             <span className="label-text">
          //               Min Tracking Confidence: {poseOptions.minTrackingConfidence.value}
          //             </span>
          //           </label>
          //           <input
          //             type="range"
          //             min="0.0"
          //             max="1.0"
          //             step="0.1"
          //             value={poseOptions.minTrackingConfidence.value}
          //             className="w-full range"
          //             onChange={(e) => {
          //               poseOptions.minTrackingConfidence.set(parseFloat(e.currentTarget.value))
          //             }}
          //           />
          //         </li>
          //         <li>
          //           <label className="label">
          //             <span className="label-text">Smooth Landmarks</span>
          //             <input
          //               type="checkbox"
          //               className="toggle toggle-primary"
          //               defaultChecked={poseOptions.smoothLandmarks?.value}
          //               onChange={(e) => {
          //                 poseOptions.smoothLandmarks.set(e.currentTarget.checked)
          //               }}
          //             />
          //           </label>
          //         </li>
          //         <li>
          //           <label className="cursor-pointer label">
          //             <span className="label-text">Enable Segmentation</span>
          //             <input
          //               type="checkbox"
          //               className="toggle toggle-primary"
          //               defaultChecked={poseOptions.enableSegmentation?.value}
          //               onChange={(e) => {
          //                 poseOptions.enableSegmentation.set(e.currentTarget.checked)
          //               }}
          //             />
          //           </label>
          //         </li>
          //         <li>
          //           <label className="cursor-pointer label">
          //             <span className="label-text">Smooth Segmentation</span>
          //             <input
          //               type="checkbox"
          //               className="toggle toggle-primary"
          //               defaultChecked={poseOptions.smoothSegmentation?.value}
          //               onChange={(e) => {
          //                 poseOptions.smoothSegmentation.set(e.currentTarget.checked)
          //               }}
          //             />
          //           </label>
          //         </li>
          //       </ul>
          //     </div>
          //   </div>
          // </div>
        }
      >
        <Header />
        <div className="w-full container mx-auto pointer-events-auto">
          <div className="w-full h-auto px-2">
            <div className="w-full h-auto relative aspect-video overflow-hidden">
              <div
                className="absolute w-full h-full top-0 left-0 flex items-center"
                style={{ backgroundColor: '#000000' }}
              >
                <Video
                  ref={videoRef}
                  className={twMerge('w-full h-auto opacity-100', !displaySettings?.showVideo && 'opacity-0')}
                />
              </div>
              <div
                className="object-contain absolute top-0 left-0 z-20 w-full h-full flex items-center"
                style={{ objectFit: 'contain', top: '0px' }}
              >
                <Canvas ref={canvasRef} />
              </div>
              {videoStatus !== 'active' ? (
                <button
                  onClick={() => {
                    if (mediaConnection?.connected?.value) toggleWebcamPaused()
                  }}
                  className="absolute top-0 left-0 z-30 w-full h-full btn btn-ghost bg-none flex items-center"
                >
                  <h1>{mediaConnection?.connected?.value ? 'Enable Camera' : 'Loading...'}</h1>
                </button>
              ) : null}
            </div>
          </div>
          <div className="w-full container mx-auto">
            <Toolbar
              className="w-full"
              videoStatus={videoStatus}
              detectingStatus={detectingStatus}
              onToggleRecording={onToggleRecording}
              toggleWebcam={toggleWebcamPaused}
              toggleDetecting={() => isDetecting.set((v) => !v)}
              isRecording={recordingState?.started?.value}
              recordingStatus={recordingStatus}
              cycleCamera={MediaStreamService.cycleCamera}
            />
          </div>
          <div className="w-full container mx-auto">
            <div className="w-full relative">
              <RecordingsList
                {...{
                  startPlayback,
                  stopPlayback: ECSRecordingFunctions.stopPlayback,
                  recordingState
                }}
              />
            </div>
          </div>
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
