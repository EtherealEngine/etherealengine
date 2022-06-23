import { createState, useState } from '@speigg/hookstate'

import { dispatchAction } from '@xrengine/hyperflux'

import { ClientStorage } from '../common/classes/ClientStorage'
import { Engine } from '../ecs/classes/Engine'
import InfiniteGridHelper from '../scene/classes/InfiniteGridHelper'
import { ObjectLayers } from '../scene/constants/ObjectLayers'
import { updateShadowMapOnSceneLoad } from '../scene/functions/loaders/RenderSettingsFunction'
import { RenderModes, RenderModesType } from './constants/RenderModes'
import { RenderSettingKeys } from './EngineRnedererConstants'
import { changeRenderMode } from './functions/changeRenderMode'
import { configureEffectComposer } from './functions/configureEffectComposer'
import { EngineRenderer } from './WebGLRendererSystem'

type EngineRendererStateType = {
  qualityLevel: number
  automatic: boolean
  // usePBR: boolean,
  usePostProcessing: boolean
  useShadows: boolean
  physicsDebugEnable: boolean
  avatarDebugEnable: boolean
  renderMode: RenderModesType
  nodeHelperVisibility: boolean
  gridVisibility: boolean
  gridHeight: number
}

const state = createState<EngineRendererStateType>({
  qualityLevel: 5,
  automatic: true,
  // usePBR: true,
  usePostProcessing: false,
  useShadows: false,
  physicsDebugEnable: false,
  avatarDebugEnable: false,
  renderMode: RenderModes.SHADOW as RenderModesType,
  nodeHelperVisibility: false,
  gridVisibility: false,
  gridHeight: 0
})

export async function restoreEngineRendererData(): Promise<void> {
  if (typeof window !== 'undefined') {
    const s = {} as EngineRendererStateType

    const promises = [
      ClientStorage.get(RenderSettingKeys.QUALITY_LEVEL).then((v) => {
        if (typeof v !== 'undefined') s.qualityLevel = v as number
      }),
      ClientStorage.get(RenderSettingKeys.AUTOMATIC).then((v) => {
        if (typeof v !== 'undefined') s.automatic = v as boolean
      })
    ]

    if (Engine.instance.isEditor) {
      promises.push(
        ClientStorage.get(RenderSettingKeys.PHYSICS_DEBUG_ENABLE).then((v) => {
          if (typeof v !== 'undefined') s.physicsDebugEnable = v as boolean
        }),
        ClientStorage.get(RenderSettingKeys.AVATAR_DEBUG_ENABLE).then((v) => {
          if (typeof v !== 'undefined') s.avatarDebugEnable = v as boolean
        }),
        ClientStorage.get(RenderSettingKeys.RENDER_MODE).then((v) => {
          if (typeof v !== 'undefined') s.renderMode = v as RenderModesType
        }),
        ClientStorage.get(RenderSettingKeys.NODE_HELPER_ENABLE).then((v) => {
          if (typeof v !== 'undefined') s.nodeHelperVisibility = v as boolean
        }),
        ClientStorage.get(RenderSettingKeys.GRID_VISIBLE).then((v) => {
          if (typeof v !== 'undefined') s.gridVisibility = v as boolean
        }),
        ClientStorage.get(RenderSettingKeys.GRID_HEIGHT).then((v) => {
          if (typeof v !== 'undefined') s.gridHeight = v as number
        })
      )
    } else {
      promises.push(
        ClientStorage.get(RenderSettingKeys.POST_PROCESSING).then((v) => {
          if (typeof v !== 'undefined') s.usePostProcessing = v as boolean
        }),
        ClientStorage.get(RenderSettingKeys.USE_SHADOWS).then((v) => {
          if (typeof v !== 'undefined') s.useShadows = v as boolean
        })
      )
    }

    await Promise.all(promises)

    dispatchAction(EngineRendererAction.restoreStorageData(s))
  }
}

function updateState(): void {
  setQualityLevel(state.qualityLevel.value)
  setUsePostProcessing(state.usePostProcessing.value)
  setUseShadows(state.useShadows.value)

  dispatchAction(EngineRendererAction.setPhysicsDebug(state.physicsDebugEnable.value))
  dispatchAction(EngineRendererAction.setAvatarDebug(state.avatarDebugEnable.value))

  if (Engine.instance.isEditor) {
    changeRenderMode(state.renderMode.value)

    if (state.nodeHelperVisibility.value) Engine.instance.currentWorld.camera.layers.enable(ObjectLayers.NodeHelper)
    else Engine.instance.currentWorld.camera.layers.disable(ObjectLayers.NodeHelper)

    InfiniteGridHelper.instance.setGridHeight(state.gridHeight.value)
    InfiniteGridHelper.instance.visible = state.gridVisibility.value
  } else {
    Engine.instance.currentWorld.camera.layers.disable(ObjectLayers.NodeHelper)
  }
}

export const useEngineRendererState = () => useState(state) as any as typeof state
export const accessEngineRendererState = () => state

function setQualityLevel(qualityLevel) {
  EngineRenderer.instance.scaleFactor = qualityLevel / EngineRenderer.instance.maxQualityLevel
  EngineRenderer.instance.renderer.setPixelRatio(window.devicePixelRatio * EngineRenderer.instance.scaleFactor)
  EngineRenderer.instance.needsResize = true
}

function setUseShadows(useShadows) {
  if (!Engine.instance.isEditor) updateShadowMapOnSceneLoad(useShadows)
}

function setUsePostProcessing(usePostProcessing) {
  if (state.usePostProcessing.value === usePostProcessing || Engine.instance.isEditor) return
  usePostProcessing = EngineRenderer.instance.supportWebGL2 && usePostProcessing

  configureEffectComposer(!usePostProcessing)
}

export function EngineRendererReceptor(action: EngineRendererActionType) {
  state.batch((s) => {
    switch (action.type) {
      case 'WEBGL_RENDERER_QUALITY_LEVEL':
        s.merge({ qualityLevel: action.qualityLevel })
        setQualityLevel(action.qualityLevel)
        ClientStorage.set(RenderSettingKeys.QUALITY_LEVEL, action.qualityLevel)
        break
      case 'WEBGL_RENDERER_AUTO':
        s.merge({ automatic: action.automatic })
        ClientStorage.set(RenderSettingKeys.AUTOMATIC, action.automatic)
        break
      // case 'WEBGL_RENDERER_PBR': return s.merge({ usePBR: action.usePBR })
      case 'WEBGL_RENDERER_POSTPROCESSING':
        setUsePostProcessing(action.usePostProcessing)
        s.merge({ usePostProcessing: action.usePostProcessing })
        ClientStorage.set(RenderSettingKeys.POST_PROCESSING, action.usePostProcessing)
        break
      case 'WEBGL_RENDERER_SHADOWS':
        setUseShadows(action.useShadows)
        s.merge({ useShadows: action.useShadows })
        ClientStorage.set(RenderSettingKeys.USE_SHADOWS, action.useShadows)
        break
      case 'PHYSICS_DEBUG_CHANGED':
        s.merge({ physicsDebugEnable: action.physicsDebugEnable })
        ClientStorage.set(RenderSettingKeys.PHYSICS_DEBUG_ENABLE, action.physicsDebugEnable)
        break
      case 'AVATAR_DEBUG_CHANGED':
        s.merge({ avatarDebugEnable: action.avatarDebugEnable })
        ClientStorage.set(RenderSettingKeys.AVATAR_DEBUG_ENABLE, action.avatarDebugEnable)
        break
      case 'RENDER_MODE_CHANGED':
        changeRenderMode(action.renderMode)
        s.merge({ renderMode: action.renderMode })
        ClientStorage.set(RenderSettingKeys.RENDER_MODE, action.renderMode)
        break
      case 'NODE_HELPER_VISIBILITY_CHANGED':
        s.merge({ nodeHelperVisibility: action.visibility })
        ClientStorage.set(RenderSettingKeys.NODE_HELPER_ENABLE, action.visibility)
        break
      case 'GRID_TOOL_HEIGHT_CHANGED':
        s.merge({ gridHeight: action.gridHeight })
        ClientStorage.set(RenderSettingKeys.GRID_HEIGHT, action.gridHeight)
        break
      case 'GRID_TOOL_VISIBILITY_CHANGED':
        s.merge({ gridVisibility: action.visibility })
        ClientStorage.set(RenderSettingKeys.GRID_VISIBLE, action.visibility)
        break
      case 'RESTORE_ENGINE_RENDERER_STORAGE_DATA':
        s.merge(action.state)
        updateState()
    }

    return s
  })
}

export const EngineRendererAction = {
  restoreStorageData: (state: EngineRendererStateType) => {
    return {
      type: 'RESTORE_ENGINE_RENDERER_STORAGE_DATA' as const,
      state
    }
  },
  setQualityLevel: (qualityLevel: number) => {
    return {
      type: 'WEBGL_RENDERER_QUALITY_LEVEL' as const,
      qualityLevel
    }
  },
  setAudio: (audio: number) => {
    return {
      type: 'AUDIO_VOLUME' as const,
      audio
    }
  },
  setMicrophone: (microphone: number) => {
    return {
      type: 'MICROPHONE_VOLUME' as const,
      microphone
    }
  },
  setAutomatic: (automatic: boolean) => {
    return {
      type: 'WEBGL_RENDERER_AUTO' as const,
      automatic
    }
  },
  setPBR: (usePBR: boolean) => {
    return {
      type: 'WEBGL_RENDERER_PBR' as const,
      usePBR
    }
  },
  setPostProcessing: (usePostProcessing: boolean) => {
    return {
      type: 'WEBGL_RENDERER_POSTPROCESSING' as const,
      usePostProcessing
    }
  },
  setShadows: (useShadows: boolean) => {
    return {
      type: 'WEBGL_RENDERER_SHADOWS' as const,
      useShadows
    }
  },
  setPhysicsDebug: (physicsDebugEnable: boolean) => {
    return {
      type: 'PHYSICS_DEBUG_CHANGED' as const,
      physicsDebugEnable
    }
  },
  setAvatarDebug: (avatarDebugEnable: boolean) => {
    return {
      type: 'AVATAR_DEBUG_CHANGED' as const,
      avatarDebugEnable
    }
  },
  changedRenderMode: (renderMode: RenderModesType) => {
    return {
      type: 'RENDER_MODE_CHANGED' as const,
      renderMode
    }
  },
  changeNodeHelperVisibility: (visibility: boolean) => {
    return {
      type: 'NODE_HELPER_VISIBILITY_CHANGED' as const,
      visibility
    }
  },
  changeGridToolHeight: (gridHeight: number) => {
    return {
      type: 'GRID_TOOL_HEIGHT_CHANGED' as const,
      gridHeight
    }
  },
  changeGridToolVisibility: (visibility: boolean) => {
    return {
      type: 'GRID_TOOL_VISIBILITY_CHANGED' as const,
      visibility
    }
  }
}

export type EngineRendererActionType = ReturnType<typeof EngineRendererAction[keyof typeof EngineRendererAction]>
