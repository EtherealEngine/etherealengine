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

import { EffectComposer, NormalPass, RenderPass } from 'postprocessing'
import { useEffect } from 'react'
import {
  LinearToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
  ShadowMapType,
  ToneMapping,
  WebGL1Renderer,
  WebGLRenderer,
  WebGLRendererParameters
} from 'three'

import { defineState, getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { CameraComponent } from '../camera/components/CameraComponent'
import { ExponentialMovingAverage } from '../common/classes/ExponentialAverageCurve'
import { overrideOnBeforeCompile } from '../common/functions/OnBeforeCompilePlugin'
import { isClient } from '../common/functions/getEnvironment'
import { nowMilliseconds } from '../common/functions/nowMilliseconds'
import { Engine } from '../ecs/classes/Engine'
import { EngineState } from '../ecs/classes/EngineState'
import { getComponent } from '../ecs/functions/ComponentFunctions'
import { defineSystem } from '../ecs/functions/SystemFunctions'
import { PresentationSystemGroup } from '../ecs/functions/SystemGroups'
import { ObjectLayers } from '../scene/constants/ObjectLayers'
import { EffectMapType, defaultPostProcessingSchema } from '../scene/constants/PostProcessing'
import { WebXRManager, createWebXRManager } from '../xr/WebXRManager'
import { XRState } from '../xr/XRState'
import { RendererState } from './RendererState'
import WebGL from './THREE.WebGL'
import { updateShadowMap } from './functions/RenderSettingsFunction'
import { changeRenderMode } from './functions/changeRenderMode'
import { configureEffectComposer } from './functions/configureEffectComposer'

export type EffectComposerWithSchema = EffectComposer & EffectMapType

let lastRenderTime = 0

export class EngineRenderer {
  static instance: EngineRenderer

  /** Is resize needed? */
  needsResize: boolean

  /** Maximum Quality level of the rendered. **Default** value is 5. */
  maxQualityLevel = 5
  /** point at which we downgrade quality level (large delta) */
  maxRenderDelta = 1000 / 28 // 28 fps = 35 ms  (on some devices, rAF updates at 30fps, e.g., Low Power Mode)
  /** point at which we upgrade quality level (small delta) */
  minRenderDelta = 1000 / 55 // 55 fps = 18 ms
  /** Resoulion scale. **Default** value is 1. */
  scaleFactor = 1

  renderPass: RenderPass
  normalPass: NormalPass
  renderContext: WebGLRenderingContext | WebGL2RenderingContext

  supportWebGL2: boolean
  canvas: HTMLCanvasElement

  averageFrameTime = 1000 / 60
  timeSamples = new Array(60 * 1).fill(1000 / 60) // 3 seconds @ 60fps
  index = 0

  averageTimePeriods = 3 * 60 // 3 seconds @ 60fps
  /** init ExponentialMovingAverage */
  movingAverage = new ExponentialMovingAverage(this.averageTimePeriods)

  renderer: WebGLRenderer = null!
  /** used to optimize proxified threejs objects during render time, see loadGLTFModel and https://github.com/EtherealEngine/etherealengine/issues/9308 */
  rendering = false
  effectComposer: EffectComposerWithSchema = null!
  /** @todo deprecate and replace with engine implementation */
  xrManager: WebXRManager = null!
  webGLLostContext: any = null

  initialize() {
    overrideOnBeforeCompile()
    this.onResize = this.onResize.bind(this)
    this.handleWebGLConextLost = this.handleWebGLConextLost.bind(this)
    this.handleWebGLConextRestore = this.handleWebGLConextRestore.bind(this)

    this.supportWebGL2 = WebGL.isWebGL2Available()

    if (!this.supportWebGL2 && !WebGL.isWebGLAvailable()) {
      WebGL.dispatchWebGLDisconnectedEvent()
    }

    const canvas: HTMLCanvasElement = document.querySelector('canvas')!
    const context = this.supportWebGL2 ? canvas.getContext('webgl2')! : canvas.getContext('webgl')!

    if (!context) {
      /** @todo - add notice for webgl not supported */
    }

    this.renderContext = context!
    const options: WebGLRendererParameters = {
      precision: 'highp',
      powerPreference: 'high-performance',
      stencil: false,
      antialias: false,
      depth: true,
      logarithmicDepthBuffer: false,
      canvas,
      context,
      preserveDrawingBuffer: false,
      //@ts-ignore
      multiviewStereo: true
    }

    this.canvas = canvas
    canvas.focus()

    canvas.ondragstart = (e) => {
      e.preventDefault()
      return false
    }

    const renderer = this.supportWebGL2 ? new WebGLRenderer(options) : new WebGL1Renderer(options)
    this.renderer = renderer
    this.renderer.outputColorSpace = SRGBColorSpace

    // DISABLE THIS IF YOU ARE SEEING SHADER MISBEHAVING - UNCHECK THIS WHEN TESTING UPDATING THREEJS
    this.renderer.debug.checkShaderErrors = false

    // @ts-ignore
    this.xrManager = renderer.xr = createWebXRManager()
    this.xrManager.cameraAutoUpdate = false
    this.xrManager.enabled = true

    window.addEventListener('resize', this.onResize, false)
    this.onResize()

    this.renderer.autoClear = true
    this.effectComposer = new EffectComposer(this.renderer) as any

    //Todo: WebGL restore context
    this.webGLLostContext = context.getExtension('WEBGL_lose_context')

    // TODO: for test purpose, need to remove when PR is merging
    // webGLLostContext.loseContext() in inspect can simulate the conext lost
    //@ts-ignore
    window.webGLLostContext = this.webGLLostContext

    if (this.webGLLostContext) {
      canvas.addEventListener('webglcontextlost', this.handleWebGLConextLost)
      canvas.addEventListener('webglcontextrestored', this.handleWebGLConextRestore)
    } else {
      console.log('Browser does not support `WEBGL_lose_context` extension')
    }
  }

  handleWebGLConextLost(e) {
    console.log('Browser lost the context.', e)
    e.preventDefault()
    this.needsResize = false
    setTimeout(() => {
      this.effectComposer.setSize(0, 0, true)
      if (this.webGLLostContext) this.webGLLostContext.restoreContext()
    }, 1000)
  }

  handleWebGLConextRestore(e) {
    console.log("Browser's context is restored.", e)
    this.canvas.removeEventListener('webglcontextlost', this.handleWebGLConextLost)
    this.canvas.removeEventListener('webglcontextrestored', this.handleWebGLConextRestore)
    this.initialize()
    this.needsResize = true
  }

  /** Called on resize, sets resize flag. */
  onResize(): void {
    this.needsResize = true
  }

  /**
   * Executes the system. Called each frame by default from the Engine.instance.
   * @param delta Time since last frame.
   */
  execute(delta: number): void {
    const xrCamera = EngineRenderer.instance.xrManager.getCamera()
    const xrFrame = getState(XRState).xrFrame

    const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)

    const canvasParent = document.getElementById('engine-renderer-canvas')?.parentElement
    if (!canvasParent) return

    /** Postprocessing does not support multipass yet, so just use basic renderer when in VR */
    if (xrFrame) {
      // Assume camera.layers is source of truth for all xr cameras
      xrCamera.layers.mask = camera.layers.mask
      for (const c of xrCamera.cameras) c.layers.mask = camera.layers.mask

      this.rendering = true
      this.renderer.render(Engine.instance.scene, camera)
      this.rendering = false
    } else {
      const state = getState(RendererState)
      const engineState = getState(EngineState)
      if (!engineState.isEditor && state.automatic) this.changeQualityLevel()
      if (this.needsResize) {
        const curPixelRatio = this.renderer.getPixelRatio()
        const scaledPixelRatio = window.devicePixelRatio * this.scaleFactor

        if (curPixelRatio !== scaledPixelRatio) this.renderer.setPixelRatio(scaledPixelRatio)

        const width = canvasParent.clientWidth
        const height = canvasParent.clientHeight

        if (camera.isPerspectiveCamera) {
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }

        state.qualityLevel > 0 && state.csm?.updateFrustums()
        // Effect composer calls renderer.setSize internally
        this.effectComposer.setSize(width, height, true)

        this.needsResize = false
      }

      /**
       * Editor should always use post processing, even if no postprocessing schema is in the scene,
       *   it still uses post processing for effects such as outline.
       */
      this.rendering = true
      this.effectComposer.render(delta)
      this.rendering = false
    }
  }

  /**
   * Change the quality of the renderer.
   */
  changeQualityLevel(): void {
    const time = nowMilliseconds()
    const delta = time - lastRenderTime
    lastRenderTime = time

    const { qualityLevel } = getState(RendererState)
    let newQualityLevel = qualityLevel

    this.movingAverage.update(Math.min(delta, 50))
    const averageDelta = this.movingAverage.mean

    if (averageDelta > this.maxRenderDelta && newQualityLevel > 1) {
      newQualityLevel--
    } else if (averageDelta < this.minRenderDelta && newQualityLevel < this.maxQualityLevel) {
      newQualityLevel++
    }

    if (newQualityLevel !== qualityLevel) {
      getMutableState(RendererState).qualityLevel.set(newQualityLevel)
    }
  }
}

export const RenderSettingsState = defineState({
  name: 'RenderSettingsState',
  initial: {
    primaryLight: '' as EntityUUID,
    csm: true,
    toneMapping: LinearToneMapping as ToneMapping,
    toneMappingExposure: 0.8,
    shadowMapType: PCFSoftShadowMap as ShadowMapType
  }
})

export const PostProcessingSettingsState = defineState({
  name: 'PostProcessingSettingsState',
  initial: {
    enabled: false,
    effects: defaultPostProcessingSchema
  }
})

const execute = () => {
  if (!EngineRenderer.instance) return
  const deltaSeconds = getState(EngineState).deltaSeconds
  EngineRenderer.instance.execute(deltaSeconds)
}

globalThis.EngineRenderer = EngineRenderer

const reactor = () => {
  const renderSettings = useHookstate(getMutableState(RenderSettingsState))
  const engineRendererSettings = useHookstate(getMutableState(RendererState))
  const postprocessing = useHookstate(getMutableState(PostProcessingSettingsState))
  const xrState = useHookstate(getMutableState(XRState))

  useEffect(() => {
    EngineRenderer.instance.renderer.toneMapping = renderSettings.toneMapping.value
  }, [renderSettings.toneMapping])

  useEffect(() => {
    EngineRenderer.instance.renderer.toneMappingExposure = renderSettings.toneMappingExposure.value
  }, [renderSettings.toneMappingExposure])

  useEffect(() => {
    updateShadowMap()
  }, [xrState.supportedSessionModes, renderSettings.shadowMapType, engineRendererSettings.useShadows])

  useEffect(() => {
    configureEffectComposer()
  }, [postprocessing.enabled, postprocessing.effects, engineRendererSettings.usePostProcessing])

  useEffect(() => {
    EngineRenderer.instance.scaleFactor =
      engineRendererSettings.qualityLevel.value / EngineRenderer.instance.maxQualityLevel
    EngineRenderer.instance.renderer.setPixelRatio(window.devicePixelRatio * EngineRenderer.instance.scaleFactor)
    EngineRenderer.instance.needsResize = true
  }, [engineRendererSettings.qualityLevel])

  useEffect(() => {
    changeRenderMode()
  }, [engineRendererSettings.renderMode])

  useEffect(() => {
    const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
    if (engineRendererSettings.physicsDebug.value) camera.layers.enable(ObjectLayers.PhysicsHelper)
    else camera.layers.disable(ObjectLayers.PhysicsHelper)
  }, [engineRendererSettings.physicsDebug])

  useEffect(() => {
    const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
    if (engineRendererSettings.avatarDebug.value) camera.layers.enable(ObjectLayers.AvatarHelper)
    else camera.layers.disable(ObjectLayers.AvatarHelper)
  }, [engineRendererSettings.avatarDebug])

  useEffect(() => {
    const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
    if (engineRendererSettings.gridVisibility.value) camera.layers.enable(ObjectLayers.Gizmos)
    else camera.layers.disable(ObjectLayers.Gizmos)
  }, [engineRendererSettings.gridVisibility])

  useEffect(() => {
    const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
    if (engineRendererSettings.nodeHelperVisibility.value) camera.layers.enable(ObjectLayers.NodeHelper)
    else camera.layers.disable(ObjectLayers.NodeHelper)
  }, [engineRendererSettings.nodeHelperVisibility])

  return null
}

export const WebGLRendererSystem = defineSystem({
  uuid: 'ee.engine.WebGLRendererSystem',
  insert: { with: PresentationSystemGroup },
  execute,
  reactor: isClient ? reactor : undefined
})
