import { Quaternion, Vector3 } from 'three'

import { dispatchAction } from '@xrengine/hyperflux'

import { World } from '../../ecs/classes/World'
import { PersistentAnchorActions } from '../XRAnchorComponents'
import { XR8 } from './XR8'
import {
  CameraPipelineModule,
  LayerFoundEvent,
  onUpdate,
  WayspotFoundEvent,
  WayspotLostEvent,
  WayspotScanningEvent,
  WayspotUpdatedEvent
} from './XR8Types'

/**
 * Orients the camera canvas according to 8th wall's internal orientation and the window
 * Updates the camera orientation according to 8th wall's world tracking
 * Hooks up Lightship VPS to EE VPS abstraction
 * @param world
 * @param cameraCanvas
 * @returns {CameraPipelineModule}
 */
export const XR8Pipeline = (world: World, cameraCanvas: HTMLCanvasElement): CameraPipelineModule => {
  const orientCameraFeed = function (orientation: number) {
    /** orientation can take a frame or two to complete, so wait until it matches what 8th wall expects */
    const needsUpdate =
      ((orientation === 0 || orientation === 180) && window.innerWidth > window.innerHeight) ||
      ((orientation === 90 || orientation === -90) && window.innerHeight > window.innerWidth)
    if (needsUpdate) {
      window.requestAnimationFrame(function () {
        return orientCameraFeed(orientation)
      })
    } else {
      cameraCanvas.width = window.innerWidth
      cameraCanvas.height = window.innerHeight
    }
  }

  const onWayspotScanning = (event: WayspotScanningEvent) => {
    console.log(event)
  }

  const onWayspotFound = (event: WayspotFoundEvent) => {
    const { name, position, rotation } = event.detail
    dispatchAction(
      PersistentAnchorActions.anchorFound({ name, position: position as Vector3, rotation: rotation as Quaternion })
    )
  }

  const onWayspotUpdated = (event: WayspotUpdatedEvent) => {
    const { name, position, rotation } = event.detail
    dispatchAction(
      PersistentAnchorActions.anchorUpdated({ name, position: position as Vector3, rotation: rotation as Quaternion })
    )
  }

  const onWayspotLost = (event: WayspotLostEvent) => {
    const { name } = event.detail
    dispatchAction(PersistentAnchorActions.anchorLost({ name }))
  }

  const onLayerFound = (event: LayerFoundEvent) => {
    console.log(event)
    if (event.detail?.name === 'sky') {
      XR8.LayersController.recenter()
    }
  }

  return {
    name: 'EE_CameraPipeline',
    onAttach: ({ canvas, orientation }) => {
      orientCameraFeed(orientation)
    },
    onDeviceOrientationChange: ({ orientation }) => {
      orientCameraFeed(orientation)
    },
    onStart: () => {
      const { camera, renderer, layerScenes } = XR8.Threejs.xrScene()
      console.log({ layerScenes })
      renderer.render = (scene, camera) => {
        /** disable the 8thwall threejs renderer */
      }
      /** sync camera */
      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion
      })
      XR8.LayersController.configure({
        coordinates: {
          origin: {
            position: camera.position,
            rotation: camera.quaternion
          }
        }
      })
      const watcher = XR8.Vps.makeWayspotWatcher({
        onVisible: () => {},
        onHidden: () => {},
        pollGps: true,
        lat: 0,
        lng: 0
      })
    },
    // onUpdate: (props) => {
    //   const { processCpuResult } = props
    //   // console.log(processCpuResult)
    //   if (processCpuResult.reality) {
    //     /** @todo support lighting */
    //   }
    // }
    listeners: [
      { event: 'reality.projectwayspotfound', process: onWayspotFound },
      { event: 'reality.projectwayspotscanning', process: onWayspotScanning },
      { event: 'reality.projectwayspotlost', process: onWayspotLost },
      { event: 'reality.projectwayspotupdated', process: onWayspotUpdated },
      { event: 'layerscontroller.layerfound', process: onLayerFound }
      // { event: 'reality.meshfound', process: onMeshFound },
      // { event: 'reality.meshupdated', process: onMeshUpdate },
      // { event: 'reality.meshlost', process: onMeshLost }
    ]
  }
}
