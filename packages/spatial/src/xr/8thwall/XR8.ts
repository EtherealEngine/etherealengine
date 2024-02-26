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

import config from '@etherealengine/common/src/config'
import { dispatchAction, getMutableState, getState, getStateUnsafe, useHookstate } from '@etherealengine/hyperflux'

import { getComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { defineQuery, useQuery } from '@etherealengine/ecs/src/QueryFunctions'
import { defineSystem } from '@etherealengine/ecs/src/SystemFunctions'
import { CameraComponent } from '../../camera/components/CameraComponent'
import { isMobile } from '../../common/functions/isMobile'
import { PersistentAnchorComponent } from '../XRAnchorComponents'
import { endXRSession, getReferenceSpaces, requestXRSession } from '../XRSessionFunctions'
import { ReferenceSpace, XRAction, XRState } from '../XRState'
import { XRSystem } from '../XRSystem'
import { XR8Pipeline } from './XR8Pipeline'
import { XR8Type } from './XR8Types'
import { XRFrameProxy, XRRigidTransform, XRSessionProxy, XRSpace } from './XR8WebXRProxy'

type XR8Assets = {
  xr8Script: HTMLScriptElement
  xrExtrasScript: HTMLScriptElement
  // xrCoachingOverlayScript: HTMLScriptElement
}

function loadScript(url): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.addEventListener('load', () => resolve(script))
    script.addEventListener('error', () => reject())
    document.head.appendChild(script)
    script.src = url
  })
}
/**
 * Initializes the scripts that loads 8thwall
 * @returns
 */
const initialize8thwall = async (): Promise<XR8Assets> => {
  const [xr8Script, xrExtrasScript /*, xrCoachingOverlayScript*/] = await Promise.all([
    loadScript(`https://apps.8thwall.com/xrweb?appKey=${config.client.key8thWall}`),
    loadScript(`https://cdn.8thwall.com/web/xrextras/xrextras.js`)
    // loadScript(`https://cdn.8thwall.com/web/coaching-overlay/coaching-overlay.js`)
  ])

  /** the global XR8 object will not exist immediately, so wait for it */
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (globalThis.XR8) {
        clearTimeout(timeout)
        clearInterval(interval)
        resolve()
      }
    }, 100)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      reject()
    }, 30000) // 30 seconds
  })

  XR8 = globalThis.XR8
  XRExtras = globalThis.XRExtras
  // VpsCoachingOverlay = globalThis.VpsCoachingOverlay

  return {
    xr8Script,
    xrExtrasScript
    // xrCoachingOverlayScript
  }
}

export let XR8: XR8Type
export let XRExtras
// export let VpsCoachingOverlay

const initialize8thwallDevice = async (existingCanvas: HTMLCanvasElement | null) => {
  if (existingCanvas) {
    const engineContainer = document.getElementById('engine-container')!
    engineContainer.appendChild(existingCanvas)
    XR8.run({ canvas: existingCanvas })
    return existingCanvas
  }

  const cameraCanvas = document.createElement('canvas')
  cameraCanvas.id = 'camera-canvas'
  cameraCanvas.style.position = 'absolute'
  cameraCanvas.style.top = '0px'
  cameraCanvas.style.zIndex = '-10000' // put behind canvas (and everything else)
  cameraCanvas.style.height = '100%'
  cameraCanvas.style.width = '100%'
  cameraCanvas.style.pointerEvents = 'none'
  cameraCanvas.style.userSelect = 'none'

  document.body.appendChild(cameraCanvas)

  const requiredPermissions = XR8.XrPermissions.permissions()
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const enableVps = !!vpsQuery().length

    XR8.XrController.configure({
      // enableLighting: true
      // enableWorldPoints: true,
      // imageTargets: true,
      scale: 'absolute',
      enableVps
    })

    // if (enableVps) {
    //   VpsCoachingOverlay.configure({
    //     textColor: '#ffffff'
    //   })
    // }

    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule() /** draw the camera feed */,
      XR8.Threejs.pipelineModule(),
      XR8.XrController.pipelineModule(),
      // VpsCoachingOverlay.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule()
    ])

    const permissions = [
      requiredPermissions.CAMERA,
      requiredPermissions.DEVICE_MOTION,
      requiredPermissions.DEVICE_ORIENTATION
      // requiredPermissions.MICROPHONE
    ]
    if (enableVps) permissions.push(requiredPermissions.DEVICE_GPS)

    XR8.addCameraPipelineModule({
      name: 'EE_camera_persmissions',
      onCameraStatusChange: (args) => {
        const { status, reason } = args
        console.log(`[XR8] Camera Status Change: ${status}`)
        if (status == 'requesting') {
          return
        } else if (status == 'hasStream') {
          return
        } else if (status == 'hasVideo') {
          resolve(cameraCanvas)
        } else if (status == 'failed') {
          console.error(args)
          reject(`[XR8] Failed to get camera feed with reason ${reason}`)
        }
      },
      requiredPermissions: () => permissions
    })

    XR8.addCameraPipelineModule(XR8Pipeline(cameraCanvas))

    // if (enableVps) {
    //   VpsCoachingOverlay.configure({
    //     // persistentanchorName: vpsPersistentAnchorName // todo - support multiple persistentanchors, for now just use the nearest one
    //   })
    // }

    XR8.run({ canvas: cameraCanvas })
  })
}

const vpsQuery = defineQuery([PersistentAnchorComponent])

let _8thwallScripts = null as XR8Assets | null

let cameraCanvas: HTMLCanvasElement | null = null

const originalRequestXRSessionImplementation = requestXRSession.implementation
const originalEndXRSessionImplementation = endXRSession.implementation

const inputSources = [] as XRInputSource[]
const viewerInputSource = {
  handedness: 'none',
  targetRayMode: 'screen',
  get targetRaySpace() {
    const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
    return new XRSpace(camera.position, camera.quaternion) as any
  },
  gamepad: {
    axes: [0, 0],
    buttons: {} as any,
    connected: false,
    hapticActuators: [],
    id: '',
    index: 0,
    mapping: '',
    timestamp: Date.now() - performance.timeOrigin
  },
  profiles: [] as string[]
} as XRInputSource

/**
 * touch events used to mimic viewer input source
 * - for some reason, pointer events are intermittent
 * */
const onTouchStart = (ev) => {
  ;(viewerInputSource.gamepad!.axes as number[]) = [
    (ev.touches[0].screenX / window.innerWidth) * 2 - 1,
    (ev.touches[0].screenY / window.innerHeight) * -2 + 1
  ]
  const xrState = getState(XRState)
  xrState.session!.dispatchEvent({
    type: 'inputsourceschange',
    added: [viewerInputSource],
    removed: []
  } as any)
  inputSources.push(viewerInputSource)
}

const onTouchMove = (ev: TouchEvent) => {
  ;(viewerInputSource.gamepad!.axes as number[]) = [
    (ev.touches[0].screenX / window.innerWidth) * 2 - 1,
    (ev.touches[0].screenY / window.innerHeight) * -2 + 1
  ]
}

const onTouchEnd = (ev) => {
  const xrState = getState(XRState)
  xrState.session!.dispatchEvent({
    type: 'inputsourceschange',
    removed: [viewerInputSource],
    added: []
  } as any)
  inputSources.splice(inputSources.indexOf(viewerInputSource), 1)
}

const originalXRRigidTransform = XRRigidTransform

const overrideXRSessionFunctions = () => {
  if (requestXRSession.implementation !== originalRequestXRSessionImplementation) return

  const xrState = getMutableState(XRState)
  xrState.supportedSessionModes['immersive-ar'].set(true)

  requestXRSession.implementation = async (action) => {
    if (xrState.requestingSession.value) return

    xrState.is8thWallActive.set(true)
    xrState.requestingSession.set(true)

    try {
      /** Initialize 8th wall if not previously initialized */
      if (!_8thwallScripts) _8thwallScripts = await initialize8thwall()
      cameraCanvas = await initialize8thwallDevice(cameraCanvas)
    } catch (e) {
      xrState.requestingSession.set(false)
      console.error(e)
      return
    }

    // bind public constructors to global object
    ;(globalThis as any).XRRigidTransform = XRRigidTransform

    const xrSession = new XRSessionProxy(inputSources) as any as XRSession

    xrState.session.set(xrSession)
    xrState.sessionActive.set(true)
    xrState.sessionMode.set('immersive-ar')

    getReferenceSpaces(xrSession)

    document.body.addEventListener('touchstart', onTouchStart)
    document.body.addEventListener('touchmove', onTouchMove)
    document.body.addEventListener('touchend', onTouchEnd)

    xrState.requestingSession.set(false)
    dispatchAction(XRAction.sessionChanged({ active: true }))
  }

  endXRSession.implementation = async () => {
    XR8.stop()
    const xrState = getMutableState(XRState)
    xrState.sessionActive.set(false)
    xrState.sessionMode.set('none')
    xrState.is8thWallActive.set(false)
    xrState.session.set(null)

    ReferenceSpace.origin = null
    ReferenceSpace.localFloor = null
    ReferenceSpace.viewer = null
    ;(globalThis as any).XRRigidTransform = originalXRRigidTransform

    const engineContainer = document.getElementById('engine-container')!
    engineContainer.removeChild(cameraCanvas!)

    document.body.removeEventListener('touchstart', onTouchStart)
    document.body.removeEventListener('touchmove', onTouchMove)
    document.body.removeEventListener('touchend', onTouchEnd)

    dispatchAction(XRAction.sessionChanged({ active: false }))
  }
}

/** When VPS support is no longer needed, or this system is no longer required, revert xr session implementations */
const revertXRSessionFunctions = () => {
  if (requestXRSession.implementation === originalRequestXRSessionImplementation) return

  requestXRSession.implementation = originalRequestXRSessionImplementation
  endXRSession.implementation = originalEndXRSessionImplementation

  /** revert overridden ar support to whatever it actually is */
  navigator.xr
    ?.isSessionSupported('immersive-ar')
    .then((supported) => getMutableState(XRState).supportedSessionModes['immersive-ar'].set(supported))
}

/**
 * Scenes that specify that they have VPS should override using webxr to use 8thwall.
 * - this will not cover the problem of going through a portal to a scene that has VPS,
 *     or exiting one that does to one that does not. This requires exiting the immersive
 *     session, changing the overrides, and entering the session again
 */

const execute = () => {
  if (!XR8) return

  getStateUnsafe(XRState).xrFrame = new XRFrameProxy() as any as XRFrame
}

const reactor = () => {
  const hasPersistentAnchor = useQuery([PersistentAnchorComponent]).length
  const arSupported = useHookstate(getMutableState(XRState).supportedSessionModes['immersive-ar'])
  const using8thWall = isMobile && (!navigator.xr || !arSupported.value)

  useEffect(() => {
    /** data oriented approach to overriding functions, check if it's already changed, and abort if as such */
    if (hasPersistentAnchor || using8thWall) {
      overrideXRSessionFunctions()
    } else {
      revertXRSessionFunctions()
    }
  }, [hasPersistentAnchor, arSupported])

  useEffect(() => {
    return () => {
      if (_8thwallScripts) {
        _8thwallScripts.xr8Script.remove()
        _8thwallScripts.xrExtrasScript.remove()
        // _8thwallScripts.xrCoachingOverlayScript.remove()
      }
      if (cameraCanvas) cameraCanvas.remove()
      revertXRSessionFunctions()
    }
  }, [])
  return null
}

export const XR8System = defineSystem({
  uuid: 'ee.engine.XR8System',
  insert: { with: XRSystem },
  execute,
  reactor
})
