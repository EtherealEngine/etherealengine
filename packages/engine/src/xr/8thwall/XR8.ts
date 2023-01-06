import { useEffect } from 'react'
import { Matrix4, Quaternion, Vector3 } from 'three'

import config from '@xrengine/common/src/config'
import { dispatchAction, getState, startReactor } from '@xrengine/hyperflux'

import { GLTFLoader } from '../../assets/loaders/gltf/GLTFLoader'
import { FollowCameraComponent } from '../../camera/components/FollowCameraComponent'
import { EventDispatcher } from '../../common/classes/EventDispatcher'
import { isMobile } from '../../common/functions/isMobile'
import { Engine } from '../../ecs/classes/Engine'
import { World } from '../../ecs/classes/World'
import {
  addComponent,
  defineQuery,
  getComponent,
  removeComponent,
  removeQuery,
  useQuery
} from '../../ecs/functions/ComponentFunctions'
import { EngineRenderer } from '../../renderer/WebGLRendererSystem'
import { SkyboxComponent } from '../../scene/components/SkyboxComponent'
import { updateSkybox } from '../../scene/functions/loaders/SkyboxFunctions'
import { PersistentAnchorComponent, SkyAnchorComponent } from '../XRAnchorComponents'
import { endXRSession, requestXRSession } from '../XRSessionFunctions'
import { XRAction, XRState } from '../XRState'
import { XR8Pipeline } from './XR8Pipeline'
import { XR8Type } from './XR8Types'

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

const initialize8thwallDevice = async (existingCanvas: HTMLCanvasElement | null, world: World) => {
  if (existingCanvas) {
    const engineContainer = document.getElementById('engine-container')!
    engineContainer.appendChild(existingCanvas)
    XR8.run({ canvas: existingCanvas })
    return existingCanvas
  }

  const cameraCanvas = document.createElement('canvas')
  cameraCanvas.id = 'camera-canvas'
  cameraCanvas.style.position = 'fixed'
  cameraCanvas.style.zIndex = '-10000' // put behind canvas (and everything else)
  cameraCanvas.style.height = '100%'
  cameraCanvas.style.width = '100%'
  cameraCanvas.style.pointerEvents = 'none'
  cameraCanvas.style.userSelect = 'none'

  const engineContainer = document.getElementById('engine-container')!
  engineContainer.appendChild(cameraCanvas)

  const requiredPermissions = XR8.XrPermissions.permissions()
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const enableVps = !!vpsQuery().length
    const enableSkyAnchor = !!skyAnchorQuery().length
    /** Layers API cannot be used at the same time as the XrController */

    if (!enableSkyAnchor)
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
      enableSkyAnchor ? XR8.LayersController.pipelineModule() : XR8.XrController.pipelineModule(),
      // VpsCoachingOverlay.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule()
    ])

    if (enableSkyAnchor) {
      XR8.LayersController.configure({ layers: { sky: { layerName: 'sky', invertLayerMask: false } } })
    }

    const permissions = [
      requiredPermissions.CAMERA,
      requiredPermissions.DEVICE_MOTION,
      requiredPermissions.DEVICE_ORIENTATION
      // requiredPermissions.MICROPHONE
    ]
    if (enableVps) permissions.push(requiredPermissions.DEVICE_GPS)

    XR8.addCameraPipelineModule({
      name: 'XRE_camera_persmissions',
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

    XR8.addCameraPipelineModule(XR8Pipeline(world, cameraCanvas))

    // if (enableVps) {
    //   VpsCoachingOverlay.configure({
    //     // persistentanchorName: vpsPersistentAnchorName // todo - support multiple persistentanchors, for now just use the nearest one
    //   })
    // }

    XR8.run({ canvas: cameraCanvas })
  })
}

class XRHitTestResultProxy {
  #mat4: Matrix4
  constructor(position: Vector3, rotation: Quaternion) {
    this.#mat4 = new Matrix4().compose(
      new Vector3().copy(position),
      new Quaternion().copy(rotation).normalize(),
      new Vector3(1, 1, 1)
    )
  }

  /** for now, assume it is always relative to the absolute world origin (0, 0, 0) */
  getPose(baseSpace: XRSpace) {
    const scope = this
    return {
      get transform() {
        return {
          get matrix() {
            return scope.#mat4.toArray()
          },
          get inverse() {
            throw new Error("[XR8]: 'XRHitTestResult.getViewerPose.transform.inverse' not implemented")
          },
          get position() {
            const _vec = new Vector3()
            scope.#mat4.decompose(_vec, new Quaternion(), new Vector3())
            return _vec
          },
          get orientation() {
            const _quat = new Quaternion()
            scope.#mat4.decompose(new Vector3(), _quat, new Vector3())
            return _quat
          }
        }
      }
    } as unknown as Partial<XRPose>
  }

  // not supported
  createAnchor = undefined
}

class XRReferenceSpace {}

class XRHitTestSource {}

class XRSessionProxy extends EventDispatcher {
  readonly inputSources: XRInputSource[]

  constructor(inputSources: XRInputSource[]) {
    super()
    this.inputSources = inputSources
  }
  async requestReferenceSpace(type: 'local' | 'viewer') {
    const space = new XRReferenceSpace()
    return space
  }

  async requestHitTestSource(args: { space: XRReferenceSpace }) {
    const source = new XRHitTestSource()
    return source as XRHitTestSource
  }
}

/**
 * currently, the hit test proxy only supports viewer space
 */
class XRFrameProxy {
  getHitTestResults(source: XRHitTestSource) {
    const hits = XR8.XrController.hitTest(0.5, 0.5, ['FEATURE_POINT'])
    return hits.map(({ position, rotation }) => new XRHitTestResultProxy(position as Vector3, rotation as Quaternion))
  }

  get session() {
    return EngineRenderer.instance.xrSession
  }

  /**
   * XRFrame.getPose is only currently used for anchors and controllers, which are not implemented in 8thwall
   */
  getPose = undefined

  getViewerPose(space: XRReferenceSpace) {
    return {
      get transform() {
        return {
          get matrix() {
            return Engine.instance.currentWorld.camera.matrix.toArray()
          },
          get inverse() {
            throw new Error("[XR8]: 'XRFrame.getViewerPose.transform.inverse' not implemented")
          },
          get position() {
            return Engine.instance.currentWorld.camera.position
          },
          get orientation() {
            return Engine.instance.currentWorld.camera.quaternion
          }
        }
      }
    }
  }
}

const skyboxQuery = defineQuery([SkyboxComponent])
const vpsQuery = defineQuery([PersistentAnchorComponent])
const skyAnchorQuery = defineQuery([SkyAnchorComponent])

export default async function XR8System(world: World) {
  let _8thwallScripts = null as XR8Assets | null
  const xrState = getState(XRState)

  const using8thWall = true //isMobile && (!navigator.xr || !(await navigator.xr.isSessionSupported('immersive-ar')))

  let cameraCanvas: HTMLCanvasElement | null = null

  let originalRequestXRSessionImplementation = requestXRSession.implementation
  let originalEndXRSessionImplementation = endXRSession.implementation

  let prevFollowCamera
  const inputSources = [] as XRInputSource[]
  const viewerInputSource = {
    handedness: 'none',
    targetRayMode: 'screen',
    get targetRaySpace() {
      return new Error("[XR8]: 'viewerInputSource.targetRaySpace' not currently implemented ") as any
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
    EngineRenderer.instance.xrSession.dispatchEvent({
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
    EngineRenderer.instance.xrSession.dispatchEvent({
      type: 'inputsourceschange',
      removed: [viewerInputSource],
      added: []
    } as any)
    inputSources.splice(inputSources.indexOf(viewerInputSource), 1)
  }

  const overrideXRSessionFunctions = () => {
    if (requestXRSession.implementation !== originalRequestXRSessionImplementation) return

    xrState.supportedSessionModes['immersive-ar'].set(true)

    requestXRSession.implementation = async (action) => {
      if (xrState.requestingSession.value) return
      xrState.requestingSession.set(true)

      try {
        /** Initialize 8th wall if not previously initialized */
        if (!_8thwallScripts) _8thwallScripts = await initialize8thwall()
        cameraCanvas = await initialize8thwallDevice(cameraCanvas, world)
      } catch (e) {
        xrState.requestingSession.set(false)
        console.error(e)
        return
      }

      EngineRenderer.instance.xrSession = new XRSessionProxy(inputSources) as any as XRSession
      xrState.sessionActive.set(true)
      xrState.sessionMode.set('immersive-ar')
      xrState.is8thWallActive.set(true)

      document.body.addEventListener('touchstart', onTouchStart)
      document.body.addEventListener('touchmove', onTouchMove)
      document.body.addEventListener('touchend', onTouchEnd)

      prevFollowCamera = getComponent(world.cameraEntity, FollowCameraComponent)
      removeComponent(world.cameraEntity, FollowCameraComponent)

      xrState.requestingSession.set(false)
      dispatchAction(XRAction.sessionChanged({ active: true }))
    }

    endXRSession.implementation = async () => {
      XR8.stop()
      xrState.sessionActive.set(false)
      xrState.sessionMode.set('none')
      xrState.is8thWallActive.set(false)
      EngineRenderer.instance.xrSession = null!

      xrState.originReferenceSpace.set(null)
      xrState.viewerReferenceSpace.set(null)

      const engineContainer = document.getElementById('engine-container')!
      engineContainer.removeChild(cameraCanvas!)

      document.body.removeEventListener('touchstart', onTouchStart)
      document.body.removeEventListener('touchmove', onTouchMove)
      document.body.removeEventListener('touchend', onTouchEnd)

      addComponent(world.cameraEntity, FollowCameraComponent, prevFollowCamera)
      const skybox = skyboxQuery()[0]
      if (skybox) updateSkybox(skybox)
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
      .then((supported) => xrState.supportedSessionModes['immersive-ar'].set(supported))
  }

  /**
   * Scenes that specify that they have VPS should override using webxr to use 8thwall.
   * - this will not cover the problem of going through a portal to a scene that has VPS,
   *     or exiting one that does to one that does not. This requires exiting the immersive
   *     session, changing the overrides, and entering the session again
   */
  const vpsReactor = startReactor(function XR8VPSReactor() {
    const hasPersistentAnchor = useQuery(vpsQuery).length
    const hasSkyAnchor = useQuery(skyAnchorQuery).length

    useEffect(() => {
      /** data oriented approach to overriding functions, check if it's already changed, and abort if as such */
      if (hasPersistentAnchor || hasSkyAnchor || using8thWall) {
        overrideXRSessionFunctions()
      } else {
        revertXRSessionFunctions()
      }
    }, [hasPersistentAnchor])

    return null
  })

  let lastSeenBackground = world.scene.background

  const execute = () => {
    if (!XR8) return

    /**
     * Update the background to be invisble if the AR session is active,
     * as well as updating the camera transform from the 8thwall camera
     */
    const sessionActive = xrState.sessionActive.value
    const xr8scene = XR8.Threejs.xrScene()
    if (sessionActive && xr8scene) {
      if (world.scene.background) lastSeenBackground = world.scene.background
      world.scene.background = null
      const { camera } = xr8scene
      /** update the camera in world space as updateXRInput will update it to local space */
      world.camera.position.copy(camera.position)
      world.camera.quaternion.copy(camera.quaternion).normalize()
      /** 8thwall always expects the camera to be unscaled */
      world.camera.scale.set(1, 1, 1)
    } else {
      if (!world.scene.background && lastSeenBackground) world.scene.background = lastSeenBackground
      lastSeenBackground = null
      return
    }

    Engine.instance.xrFrame = new XRFrameProxy() as any as XRFrame
  }

  const cleanup = async () => {
    if (_8thwallScripts) {
      _8thwallScripts.xr8Script.remove()
      _8thwallScripts.xrExtrasScript.remove()
      // _8thwallScripts.xrCoachingOverlayScript.remove()
    }
    if (cameraCanvas) cameraCanvas.remove()
    revertXRSessionFunctions()
    vpsReactor.stop()
    removeQuery(world, vpsQuery)
    removeQuery(world, skyAnchorQuery)
  }

  return {
    execute,
    cleanup
  }
}
