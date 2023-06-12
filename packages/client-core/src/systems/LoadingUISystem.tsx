import getImagePalette from 'image-palette-core'
import { useEffect } from 'react'
import React from 'react'
import {
  Color,
  CompressedTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Texture,
  Vector2,
  Vector3
} from 'three'

import { AssetLoader } from '@etherealengine/engine/src/assets/classes/AssetLoader'
import createReadableTexture from '@etherealengine/engine/src/assets/functions/createReadableTexture'
import { AppLoadingState, AppLoadingStates } from '@etherealengine/engine/src/common/AppLoadingService'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineActions, EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { SceneState } from '@etherealengine/engine/src/ecs/classes/Scene'
import {
  addComponent,
  getComponent,
  removeComponent
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { removeEntity } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { EngineRenderer } from '@etherealengine/engine/src/renderer/WebGLRendererSystem'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { setVisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { ObjectLayers } from '@etherealengine/engine/src/scene/constants/ObjectLayers'
import { setObjectLayers } from '@etherealengine/engine/src/scene/functions/setObjectLayers'
import {
  ComputedTransformComponent,
  setComputedTransformComponent
} from '@etherealengine/engine/src/transform/components/ComputedTransformComponent'
import { XRUIComponent } from '@etherealengine/engine/src/xrui/components/XRUIComponent'
import { createTransitionState } from '@etherealengine/engine/src/xrui/functions/createTransitionState'
import { ObjectFitFunctions } from '@etherealengine/engine/src/xrui/functions/ObjectFitFunctions'
import { defineActionQueue, defineState, getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'
import type { WebLayer3D } from '@etherealengine/xrui'

import { getAppTheme } from '../common/services/AppThemeState'
import { LoadingSystemState } from './state/LoadingState'
import { createLoaderDetailView } from './ui/LoadingDetailView'

const SCREEN_SIZE = new Vector2()

const transitionPeriodSeconds = 1

const LoadingUISystemState = defineState({
  name: 'LoadingUISystemState',
  initial: () => {
    const transition = createTransitionState(transitionPeriodSeconds, 'OUT')
    const ui = createLoaderDetailView()
    addComponent(ui.entity, NameComponent, 'Loading XRUI')

    const mesh = new Mesh(
      new SphereGeometry(10),
      new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: true, depthTest: false, color: 'green' })
    )

    // flip inside out
    mesh.scale.set(-1, 1, 1)
    mesh.renderOrder = 1
    Engine.instance.camera.add(mesh)
    setObjectLayers(mesh, ObjectLayers.UI)

    return {
      metadataLoaded: false,
      ui,
      mesh,
      transition
    }
  }
})

const avatarModelChangedQueue = defineActionQueue(EngineActions.avatarModelChanged.matches)
const spectateUserQueue = defineActionQueue(EngineActions.spectateUser.matches)

function LoadingReactor() {
  const loadingState = useHookstate(getMutableState(AppLoadingState))
  const engineState = useHookstate(getMutableState(EngineState))
  const state = useHookstate(getMutableState(LoadingUISystemState))
  const sceneData = useHookstate(getMutableState(SceneState).sceneData)
  const mesh = state.mesh.value
  const metadataLoaded = state.metadataLoaded

  /** Handle loading state changes */
  useEffect(() => {
    const transition = getState(LoadingUISystemState).transition
    console.log('metadataLoaded', metadataLoaded.value)
    if (
      loadingState.state.value === AppLoadingStates.SCENE_LOADING &&
      transition.state === 'OUT' &&
      metadataLoaded.value
    ) {
      transition.setState('IN')
    }
    if (loadingState.state.value === AppLoadingStates.FAIL && transition.state === 'IN') {
      transition.setState('OUT')
    }
  }, [loadingState.state, metadataLoaded])

  /** Scene Colors */
  function setDefaultPalette() {
    const uiState = getState(LoadingUISystemState).ui.state
    const colors = uiState.colors
    colors.main.set('black')
    colors.background.set('white')
    colors.alternate.set('black')
  }

  const setColors = (texture: Texture) => {
    const image = texture.image as HTMLImageElement
    const uiState = getState(LoadingUISystemState).ui.state
    const colors = uiState.colors
    const palette = getImagePalette(image)
    if (palette) {
      colors.main.set(palette.color)
      colors.background.set(palette.backgroundColor)
      colors.alternate.set(palette.alternativeColor)
      console.log('palette', palette)
    }
  }

  /** Scene data changes */
  useEffect(() => {
    if (!sceneData.value) return
    const envmapURL = sceneData.value.thumbnailUrl
      .replace('thumbnail.jpeg', 'envmap.png')
      .replace('thumbnail.ktx2', 'envmap.ktx2')
    if (envmapURL && mesh.userData.url !== envmapURL) {
      mesh.userData.url = envmapURL
      setDefaultPalette()

      /** Load envmap and parse colours */
      AssetLoader.load(
        envmapURL,
        {},
        (texture: Texture | CompressedTexture) => {
          const compressedTexture = texture as CompressedTexture
          if (compressedTexture.isCompressedTexture) {
            try {
              createReadableTexture(compressedTexture).then((texture: Texture) => {
                setColors(texture)
                mesh.material.map = texture
                metadataLoaded.set(true)
              })
            } catch (e) {
              console.error(e)
              setDefaultPalette()
              metadataLoaded.set(true)
            }
          } else {
            setColors(texture)
            mesh.material.map = texture
            metadataLoaded.set(true)
          }
        },
        undefined,
        (error: ErrorEvent) => {
          console.error(error)
          setDefaultPalette()
          metadataLoaded.set(true)
        }
      )
    }
  }, [sceneData])

  useEffect(() => {
    const xrui = getComponent(state.ui.entity.value, XRUIComponent)
    const progressBar = xrui.getObjectByName('progress-container') as WebLayer3D | undefined
    if (!progressBar) return

    if (progressBar.position.lengthSq() <= 0) progressBar.shouldApplyDOMLayout = 'once'
    const percentage = engineState.loadingProgress.value
    const scaleMultiplier = 0.01
    const centerOffset = 0.05
    progressBar.scale.setX(percentage * scaleMultiplier)
    progressBar.position.setX(percentage * scaleMultiplier * centerOffset - centerOffset)
  }, [engineState.loadingProgress])

  return null
}

const mainThemeColor = new Color()
const defaultColor = new Color()

const execute = () => {
  const { transition, ui, mesh, metadataLoaded } = getState(LoadingUISystemState)
  if (!transition) return

  const appLoadingState = getState(AppLoadingState)
  const engineState = getState(EngineState)

  for (const action of spectateUserQueue()) {
    if (appLoadingState.state === AppLoadingStates.SUCCESS && engineState.sceneLoaded) transition.setState('OUT')
  }

  for (const action of avatarModelChangedQueue()) {
    if (
      (action.entity === Engine.instance.localClientEntity || engineState.spectating) &&
      appLoadingState.state === AppLoadingStates.SUCCESS &&
      engineState.sceneLoaded
    )
      transition.setState('OUT')
  }

  if (transition.state === 'OUT' && transition.alpha === 0) {
    removeComponent(ui.entity, ComputedTransformComponent)
    return
  }

  const xrui = getComponent(ui.entity, XRUIComponent)

  if (transition.state === 'IN' && transition.alpha === 1) {
    setComputedTransformComponent(ui.entity, Engine.instance.cameraEntity, () => {
      const distance = 0.1
      const uiContainer = ui.container.rootLayer.querySelector('#loading-ui')
      if (!uiContainer) return
      const uiSize = uiContainer.domSize
      const screenSize = EngineRenderer.instance.renderer.getSize(SCREEN_SIZE)
      const aspectRatio = screenSize.x / screenSize.y
      const scaleMultiplier = aspectRatio < 1 ? 1 / aspectRatio : 1
      const scale =
        ObjectFitFunctions.computeContentFitScaleForCamera(distance, uiSize.x, uiSize.y, 'contain') *
        0.25 *
        scaleMultiplier
      ObjectFitFunctions.attachObjectInFrontOfCamera(ui.entity, scale, distance)
    })
  }

  mesh.quaternion.copy(Engine.instance.camera.quaternion).invert()

  // add a slow rotation to animate on desktop, otherwise just keep it static for VR
  // if (!getState(EngineState).joinedWorld) {
  //   Engine.instance.camera.rotateY(world.delta * 0.35)
  // } else {
  //   // todo: figure out how to make this work properly for VR #7256
  // }

  defaultColor.set(getAppTheme()!.textColor)
  mainThemeColor.set(ui.state.colors.alternate.value)

  transition.update(engineState.deltaSeconds, (opacity) => {
    getMutableState(LoadingSystemState).loadingScreenOpacity.set(opacity)
  })

  const opacity = getState(LoadingSystemState).loadingScreenOpacity
  const ready = metadataLoaded && opacity > 0
  console.log({ ready, metadataLoaded, opacity })
  console.log(mesh)

  mesh.material.opacity = opacity
  mesh.visible = ready

  xrui.rootLayer.traverseLayersPreOrder((layer: WebLayer3D) => {
    const mat = layer.contentMesh.material as MeshBasicMaterial
    mat.opacity = opacity
    mat.visible = ready
    layer.visible = ready
    mat.color.lerpColors(defaultColor, mainThemeColor, engineState.loadingProgress * 0.01)
  })
  // setVisibleComponent(ui.entity, ready)
}

const reactor = () => {
  useEffect(() => {
    // return () => {
    //   const { ui, mesh } = getState(LoadingUISystemState)
    //   removeEntity(ui.entity)
    //   mesh.removeFromParent()
    //   getMutableState(LoadingUISystemState).set({
    //     metadataLoaded: false,
    //     ui: null!,
    //     mesh: null!,
    //     transition: null!
    //   })
    // }
  }, [])

  return (
    <>
      <LoadingReactor />
    </>
  )
}

export const LoadingUISystem = defineSystem({
  uuid: 'ee.client.LoadingUISystem',
  execute,
  reactor
})
