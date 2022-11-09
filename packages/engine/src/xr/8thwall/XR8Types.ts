import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'

export type XR8Type = {
  addCameraPipelineModules
  addCameraPipelineModule
  GlTextureRenderer
  XrController
  XrPermissions
  VpsCoachingOverlay
  Vps: {
    makeWayspotWatcher: (args: {
      onVisible: () => void
      onHidden: () => void
      pollGps: boolean
      lat: number
      lng: number
    }) => {
      dispose: () => void
      pollGps: (start: boolean) => void
      setLatLng: (lat: number, lng: number) => void
    }
    projectWayspots: () => Promise<Array<any>>
  }
  Threejs: {
    xrScene: () => { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera }
    pipelineModule: () => any
  }
  stop: () => void
  run: (props: { canvas: HTMLCanvasElement }) => void
}

export type CameraPipelineModuleListeners =
  | { event: 'reality.imageloading'; process: (event: Event) => void }
  | { event: 'reality.imagescanning'; process: (event: Event) => void }
  | { event: 'reality.imagefound'; process: (event: Event) => void }
  | { event: 'reality.imageupdated'; process: (event: Event) => void }
  | { event: 'reality.imagelost'; process: (event: Event) => void }
  | { event: 'reality.meshfound'; process: (event: MeshFoundEvent) => void }
  | { event: 'reality.meshupdated'; process: (event: MeshUpdatedEvent) => void }
  | { event: 'reality.meshlost'; process: (event: MeshLostEvent) => void }
  | { event: 'reality.trackingstatus'; process: (event: Event) => void }
  | { event: 'reality.projectwayspotscanning'; process: (event: WayspotScanningEvent) => void }
  | { event: 'reality.projectwayspotfound'; process: (event: WayspotFoundEvent) => void }
  | { event: 'reality.projectwayspotupdated'; process: (event: WayspotUpdatedEvent) => void }
  | { event: 'reality.projectwayspotlost'; process: (event: WayspotLostEvent) => void }
  | { event: 'facecontroller.faceloading'; process: (event: Event) => void }
  | { event: 'facecontroller.facescanning'; process: (event: Event) => void }
  | { event: 'facecontroller.facefound'; process: (event: Event) => void }
  | { event: 'facecontroller.faceupdated'; process: (event: Event) => void }
  | { event: 'facecontroller.facelost'; process: (event: Event) => void }
  | { event: 'handcontroller.handloading'; process: (event: Event) => void }
  | { event: 'handcontroller.handscanning'; process: (event: Event) => void }
  | { event: 'handcontroller.handfound'; process: (event: Event) => void }
  | { event: 'handcontroller.handupdated'; process: (event: Event) => void }
  | { event: 'handcontroller.handlost'; process: (event: Event) => void }

export type CameraPipelineModule = {
  onAppResourcesLoaded?: () => void
  onAttach?: () => void
  onBeforeRun?: () => void
  onCameraStatusChange?: () => void
  onCanvasSizeChange?: () => void
  onDetach?: () => void
  onDeviceOrientationChange?: () => void
  onException?: () => void
  onPaused?: () => void
  onProcessCpu?: () => void
  onProcessGpu?: () => void
  onRemove?: () => void
  onRender?: () => void
  onResume?: () => void
  onStart?: () => void
  onVideoSizeChange?: () => void
  requiredPermission?: () => void
  listeners?: Array<CameraPipelineModuleListeners>
}

export type Wayspot = {
  id: string
  imageUrl: string
  lat: number
  lng: number
  name: string
  title: string
}

export type WayspotScanningEvent = {
  wayspots: Wayspot[]
  name: 'reality.projectwayspotscanning'
}

export type WayspotFoundEvent = {
  detail: {
    name: string
    position: Vec3
    rotation: Quat
  }
  name: 'reality.projectwayspotfound'
}

export type WayspotLostEvent = {
  detail: {
    name: string
    position: Vec3
    rotation: Quat
  }
  name: 'reality.projectwayspotlost'
}

export type WayspotUpdatedEvent = {
  detail: {
    name: string
    position: Vec3
    rotation: Quat
  }
  name: 'reality.projectwayspotupdated'
}

export type MeshFoundEvent = {
  name: ''
  detail: {
    geometry: {
      attributes: Array<{
        array: Float32Array
        itemSize: number
        name: 'string'
      }>
      index: {
        array: Uint32Array
        itemSize: number
      }
    }
    id: string
    position: Vec3
    rotation: Quat
  }
}
export type MeshUpdatedEvent = {
  name: ''
  detail: {
    id: string
    position: Vec3
    rotation: Quat
  }
}
export type MeshLostEvent = {
  name: ''
  detail: {
    id: string
    position: Vec3
    rotation: Quat
  }
}

export type Vec3 = {
  x: number
  y: number
  z: number
}
export type Quat = {
  x: number
  y: number
  z: number
  w: number
}

type CPUResult = {
  reality: {
    rotation: Quat
    position: Vec3
    intrinsics: number[]
    lighting: {
      exposure: number
      temperature: number
    }
    realityTexture: {
      name: number
      drawCtx: {}
    }
    trackingStatus: string
    trackingReason: string
    worldPoints: []
    detectedImages: []
    points: {
      get: () => unknown
      getLength: () => unknown
    }
    meanRGB: number
  }
}

type GPUResult = {
  gltexturerenderer: {
    viewport: {
      offsetX: number
      offsetY: number
      width: number
      height: number
    }
    shader: WebGLProgram
  }
}

export type onUpdate = {
  framework: {
    dispatchEvent: (event: any) => void
  }
  processCpuResult: CPUResult
  processGpuResult: GPUResult
  frameStartResult: {
    cameraTexture: WebGLTexture
    computeTexture: WebGLTexture
    GLctx: WebGL2RenderingContext
    computeCtx: WebGL2RenderingContext
    orientation: number
    repeatFrame: false
    frameTime: number
    textureWidth: number
    textureHeight: number
    videoTime: number
  }
  cameraTextureReadyResult: GPUResult
  fps: number
  GLctx: WebGL2RenderingContext
  cameraTexture: WebGLTexture
  video: any
  heapDataReadyResult: CPUResult
}
