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

import { filterAndSortSystemsByAvgDuration } from '@etherealengine/ecs'
import { profile } from '@etherealengine/ecs/src/Timer'
import { State, defineState, getMutableState, getState, useMutableState } from '@etherealengine/hyperflux'
import { EngineRenderer, RenderSettingsState } from '@etherealengine/spatial/src/renderer/WebGLRendererSystem'
import { GetGPUTier, getGPUTier } from 'detect-gpu'
import { debounce } from 'lodash'
import { SMAAPreset } from 'postprocessing'
import { useEffect } from 'react'
import { Camera, Scene } from 'three'
import { EngineState } from '../EngineState'
import { RendererState } from './RendererState'

type PerformanceTier = 0 | 1 | 2 | 3 | 4 | 5

const tieredSettings = {
  [0]: {
    engine: { useShadows: false, shadowMapResolution: 0, usePostProcessing: false, forceBasicMaterials: true },
    render: { smaaPreset: SMAAPreset.LOW }
  },
  [1]: {
    engine: { useShadows: false, shadowMapResolution: 0, usePostProcessing: false, forceBasicMaterials: false },
    render: { smaaPreset: SMAAPreset.LOW }
  },
  [2]: {
    engine: { useShadows: true, shadowMapResolution: 256, usePostProcessing: false, forceBasicMaterials: false },
    render: { smaaPreset: SMAAPreset.LOW }
  },
  [3]: {
    engine: { useShadows: true, shadowMapResolution: 512, usePostProcessing: false, forceBasicMaterials: false },
    render: { smaaPreset: SMAAPreset.MEDIUM }
  },
  [4]: {
    engine: { useShadows: true, shadowMapResolution: 1024, usePostProcessing: true, forceBasicMaterials: false },
    render: { smaaPreset: SMAAPreset.HIGH }
  },
  [5]: {
    engine: { useShadows: true, shadowMapResolution: 2048, usePostProcessing: true, forceBasicMaterials: false },
    render: { smaaPreset: SMAAPreset.ULTRA }
  }
} as {
  [key in PerformanceTier]: {
    engine: Partial<typeof RendererState._TYPE>
    render: Partial<typeof RenderSettingsState._TYPE>
  }
}

export const PerformanceState = defineState({
  name: 'PerformanceState',
  initial: () => ({
    tier: 3 as PerformanceTier,
    // The lower the performance the higher the offset
    performanceOffset: 0,
    isMobileGPU: false as boolean | undefined,
    // averageRenderTime: 0,
    gpu: 'unknown',
    device: 'unknown',
    budgets: {
      maxTextureSize: 0,
      max3DTextureSize: 0,
      maxBufferSize: 0,
      maxIndices: 0,
      maxVerticies: 0
    }
  }),
  reactor: () => {
    const performanceState = useMutableState(PerformanceState)
    const renderSettings = useMutableState(RenderSettingsState)
    const engineSettings = useMutableState(RendererState)

    useEffect(() => {
      if (getState(EngineState).isEditing) return

      const performanceTier = performanceState.tier.value
      const settings = tieredSettings[performanceTier]
      engineSettings.merge(settings.engine)
      renderSettings.merge(settings.render)
    }, [performanceState.tier])
  }
})

// API to get GPU timings, not currently in use due to poor support
// Probably only useful right now as a debug metric for use in the editor
const timeBeforeCheck = 3
let timeAccum = 0
let checkingRenderTime = false
const startGPUTiming = (renderer: EngineRenderer, dt: number): (() => void) => {
  timeAccum += dt
  if (checkingRenderTime || timeAccum < timeBeforeCheck) return () => {}
  checkingRenderTime = true

  return timeRenderFrameGPU(renderer, (renderTime) => {
    checkingRenderTime = false
    timeAccum = 0
    const performanceState = getMutableState(PerformanceState)
    // performanceState.averageRenderTime.set((performanceState.averageRenderTime.value + renderTime) / 2)
  })
}

const timeRenderFrameGPU = (renderer: EngineRenderer, callback: (number) => void = () => {}): (() => void) => {
  const fallback = () => {
    const end = profile()
    return () => {
      callback(end())
    }
  }

  if (renderer.supportWebGL2) {
    const gl = renderer.renderContext as WebGL2RenderingContext
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2')

    // Not super well supported, no Safari support
    if (ext) {
      const startQuery = gl.createQuery()
      const endQuery = gl.createQuery()

      if (startQuery && endQuery) {
        ext.queryCounterEXT(startQuery, ext.TIMESTAMP_EXT)

        return () => {
          ext.queryCounterEXT(endQuery, ext.TIMESTAMP_EXT)

          requestAnimationFrame(function poll() {
            const available = gl.getQueryParameter(endQuery!, gl.QUERY_RESULT_AVAILABLE)
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT)

            if (available && !disjoint) {
              // Gets times in nanoseconds
              const timeStart = gl.getQueryParameter(startQuery!, gl.QUERY_RESULT)
              const timeEnd = gl.getQueryParameter(endQuery!, gl.QUERY_RESULT)
              const renderTime = (timeEnd - timeStart) * 0.000001
              callback(renderTime)
            } else if (disjoint) {
              console.warn('WebGL GPU timing disjointed')
            }

            if (available || disjoint) {
              gl.deleteQuery(startQuery)
              gl.deleteQuery(endQuery)
              checkingRenderTime = false
              timeAccum = 0
            } else {
              requestAnimationFrame(poll)
            }
          })
        }
      } else return fallback()
    } else return fallback()
  } else return fallback()
}

const timeRender = (renderer: EngineRenderer, scene: Scene, camera: Camera, onFinished: (ms: number) => void) => {
  const end = timeRenderFrameGPU(renderer, (renderTime) => {
    onFinished(renderTime)
  })
  renderer.renderer.render(scene, camera)
  end()

  scene.remove(camera)
}

const updatePerformanceState = (
  performanceState: State<typeof PerformanceState._TYPE>,
  tier: number,
  offset: number
) => {
  if (tier !== performanceState.tier.value) {
    performanceState.tier.set(tier as PerformanceTier)
  }
  if (offset !== performanceState.performanceOffset.value) {
    performanceState.performanceOffset.set(offset)
  }
}

const debounceTime = 1000
const increment = debounce(
  (state: State<typeof PerformanceState._TYPE>, tier: number, offset: number) => {
    updatePerformanceState(state, tier, offset)
  },
  debounceTime,
  { trailing: true, maxWait: debounceTime * 2 }
)
const decrement = debounce(
  (state: State<typeof PerformanceState._TYPE>, tier: number, offset: number) => {
    updatePerformanceState(state, tier, offset)
  },
  debounceTime,
  { trailing: true, maxWait: debounceTime * 2 }
)

const incrementPerformance = () => {
  const performanceState = getMutableState(PerformanceState)
  increment(
    performanceState,
    Math.min(performanceState.tier.value + 1, 5),
    Math.max(performanceState.performanceOffset.value - 1, 0)
  )
}

const maxOffset = 12
const decrementPerformance = () => {
  const performanceState = getMutableState(PerformanceState)
  decrement(
    performanceState,
    Math.max(performanceState.tier.value - 1, 0),
    Math.min(performanceState.performanceOffset.value + 1, maxOffset)
  )
}

const maxSystemTimeMS = 1.0
const profileSystemTime = 2500
const profileSystemPerformance = () => {
  const systems = filterAndSortSystemsByAvgDuration(maxSystemTimeMS)
}

const buildPerformanceState = async (
  renderer: EngineRenderer,
  onFinished: () => void,
  override?: GetGPUTier['override']
) => {
  const performanceState = getMutableState(PerformanceState)
  const gpuTier = await getGPUTier({
    glContext: renderer.renderContext,
    desktopTiers: [0, 15, 30, 60, 120, 240],
    //Mobile is harder to determine, most phones lock benchmark rendering at 60fps
    mobileTiers: [0, 15, 30, 45, 60, 75],
    override
  })
  let tier = gpuTier.tier
  performanceState.isMobileGPU.set(gpuTier.isMobile)
  if (gpuTier.gpu) performanceState.gpu.set(gpuTier.gpu)
  if (gpuTier.device) performanceState.device.set(gpuTier.device)

  const gl = renderer.renderContext as WebGL2RenderingContext
  const max3DTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE)
  performanceState.budgets.set({
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    max3DTextureSize: max3DTextureSize,
    maxBufferSize:
      window.screen.availWidth *
      window.screen.availHeight *
      window.devicePixelRatio *
      window.devicePixelRatio *
      gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxIndices: gl.getParameter(gl.MAX_ELEMENTS_INDICES) * 2,
    maxVerticies: gl.getParameter(gl.MAX_ELEMENTS_VERTICES) * 2
  })

  if (gpuTier.isMobile) tier = Math.max(tier - 2, 0)

  performanceState.tier.set(tier as PerformanceTier)
  onFinished()
  setInterval(profileSystemPerformance, profileSystemTime)
}

export const PerformanceManager = {
  buildPerformanceState,
  incrementPerformance,
  decrementPerformance,
  startGPUTiming
}
