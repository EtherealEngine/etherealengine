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

import { NodeCategory, makeFlowNodeDefinition, makeFunctionNodeDefinition } from '@behave-graph/core'
import config from '@etherealengine/common/src/config'
import { SceneJson } from '@etherealengine/common/src/interfaces/SceneInterface'
import { dispatchAction, getMutableState } from '@etherealengine/hyperflux'
import { MathUtils } from 'three'
import { PositionalAudioComponent } from '../../../../../audio/components/PositionalAudioComponent'
import { AnimationManager } from '../../../../../avatar/AnimationManager'
import { LoopAnimationComponent } from '../../../../../avatar/components/LoopAnimationComponent'
import { CameraActions } from '../../../../../camera/CameraState'
import { Entity } from '../../../../../ecs/classes/Entity'
import { SceneState } from '../../../../../ecs/classes/Scene'
import { getComponent, hasComponent, setComponent } from '../../../../../ecs/functions/ComponentFunctions'
import { getCallback } from '../../../../../scene/components/CallbackComponent'
import { MediaComponent } from '../../../../../scene/components/MediaComponent'
import { VideoComponent } from '../../../../../scene/components/VideoComponent'
import { PlayMode } from '../../../../../scene/constants/PlayMode'
import { ContentFitType } from '../../../../../xrui/functions/ObjectFitFunctions'

export const playVideo = makeFlowNodeDefinition({
  typeName: 'engine/playVideo',
  category: NodeCategory.Action,
  label: 'Play video',
  in: {
    flow: 'flow',
    entity: 'entity',
    mediaPath: 'string',
    paused: 'boolean',
    volume: 'float',
    playMode: (_, graphApi) => {
      const choices = Object.keys(PlayMode).map((key) => ({
        text: key,
        value: PlayMode[key as keyof typeof PlayMode]
      }))
      return {
        valueType: 'string',
        choices: choices
      }
    },
    videoFit: (_, graphApi) => {
      const choices = [
        { text: 'cover', value: 'cover' },
        { text: 'contain', value: 'contain' },
        { text: 'vertical', value: 'vertical' },
        { text: 'horizontal', value: 'horizontal' }
      ]
      return {
        valueType: 'string',
        choices: choices
      }
    }
  },
  out: { flow: 'flow' },
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    const entity = Number(read('entity')) as Entity
    let resources, volume
    if (hasComponent(entity, MediaComponent)) {
      const component = getComponent(entity, MediaComponent)
      resources = component.resources.length > 0 ? component.resources : []
      volume = component.volume
    }
    setComponent(entity, PositionalAudioComponent)
    const media = read<string>('mediaPath')
    resources = media ? [media, ...resources] : resources
    const paused = read<boolean>('paused')
    volume = MathUtils.clamp(read('volume') ?? volume, 0, 1)
    const videoFit: ContentFitType = read('videoFit')
    const playMode = read<PlayMode>('playMode')

    setComponent(entity, VideoComponent, { fit: videoFit }) // play
    setComponent(entity, MediaComponent, { paused: paused, resources: resources, volume: volume, playMode: playMode! }) // play
    commit('flow')
  }
})

export const playAudio = makeFlowNodeDefinition({
  typeName: 'engine/playAudio',
  category: NodeCategory.Action,
  label: 'Play audio',
  in: {
    flow: 'flow',
    entity: 'entity',
    mediaPath: 'string',
    paused: 'boolean',
    isMusic: 'boolean',
    volume: 'float',
    playMode: (_, graphApi) => {
      const choices = Object.keys(PlayMode).map((key) => ({
        text: key,
        value: PlayMode[key as keyof typeof PlayMode]
      }))
      return {
        valueType: 'string',
        choices: choices
      }
    }
  },
  out: { flow: 'flow' },
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    const entity = Number(read('entity')) as Entity
    let resources, volume
    if (hasComponent(entity, MediaComponent)) {
      const component = getComponent(entity, MediaComponent)
      resources = component.resources.length > 0 ? component.resources : []
      volume = component.volume
    }
    setComponent(entity, PositionalAudioComponent)
    const media = read<string>('mediaPath')
    resources = media ? [media, ...resources] : resources
    const paused = read<boolean>('paused')
    volume = MathUtils.clamp(read('volume') ?? volume, 0, 1)
    const playMode = read<PlayMode>('playMode')
    setComponent(entity, MediaComponent, { paused: paused, resources: resources, volume: volume, playMode: playMode! }) // play
    const component = getComponent(entity, MediaComponent)
    commit('flow')
  }
})

export const getAvatarAnimations = makeFunctionNodeDefinition({
  typeName: 'engine/getAvatarAnimations',
  category: NodeCategory.Query,
  label: 'Get Avatar Animations',
  in: {
    animationName: (_, graphApi) => {
      const getAnims = async () => {
        return await AnimationManager.instance.loadDefaultAnimations()
      }
      const animations = AnimationManager.instance?._animations ?? getAnims()

      const choices = Array.from(animations)
        .map((clip) => clip.name)
        .sort()
      choices.unshift('none')
      return {
        valueType: 'string',
        choices: choices
      }
    }
  },
  out: { animationName: 'string' },
  exec: ({ read, write, graph }) => {
    const animationName: string = read('animationName')
    write('animationName', animationName)
  }
})

export const playGltfAnimation = makeFlowNodeDefinition({
  typeName: 'engine/playGltfAnimation',
  category: NodeCategory.Action,
  label: 'Play gltf animation',
  in: {
    flow: 'flow',
    entity: 'entity',
    animationName: 'string',
    isAvatar: 'boolean'
  },
  out: { flow: 'flow' },
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    const entity = read<Entity>('entity')
    const animation: string = read('animationName')
    const animations = AnimationManager.instance._animations
    const isAvatar: boolean = read('isAvatar')
    const animIndex: number = animations.findIndex((clip) => clip.name === animation)
    setComponent(entity, LoopAnimationComponent, { activeClipIndex: animIndex, hasAvatarAnimations: isAvatar })
    const play = getCallback(entity, 'xre.play')
    play!()
    commit('flow')
  }
})

export const fadeCamera = makeFlowNodeDefinition({
  typeName: 'engine/cameraFade',
  category: NodeCategory.Action,
  label: 'Camera fade',
  in: {
    flow: 'flow',
    toBlack: 'boolean'
  },
  out: { flow: 'flow' },
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    dispatchAction(CameraActions.fadeToBlack({ in: read('toBlack') }))
    commit('flow')
  }
})

const fileServer = config.client.fileServer ?? `https://localhost:8642`
const corsPath = config.client.cors.serverPort ? config.client.cors.proxyUrl : `https://localhost:3029`

const parseSceneDataCacheURLsLocal = (projectName: string, sceneData: any) => {
  for (const [key, val] of Object.entries(sceneData)) {
    if (val && typeof val === 'object') {
      sceneData[key] = parseSceneDataCacheURLsLocal(projectName, val)
    }
    if (typeof val === 'string') {
      if (val.includes('__$project$__')) {
        sceneData[key] = `${fileServer}/projects` + sceneData[key].replace('__$project$__', '')
      }

      if (val.startsWith('__$cors-proxy$__')) sceneData[key] = sceneData[key].replace('__$cors-proxy$__', corsPath)
    }
  }
  return sceneData
}

const loadSceneJsonOffline = async (projectName, sceneName) => {
  console.log('DEBUG switching scene')
  const locationName = `${projectName}/${sceneName}`
  const sceneData = (await (await fetch(`${fileServer}/projects/${locationName}.scene.json`)).json()) as SceneJson
  const hasKTX2 = await fetch(`${fileServer}/projects/${locationName}.thumbnail.ktx2`).then((res) => res.ok)
  getMutableState(SceneState).sceneData.set({
    scene: parseSceneDataCacheURLsLocal(projectName, sceneData),
    name: sceneName,
    thumbnailUrl: `${fileServer}/projects/${locationName}.thumbnail.${hasKTX2 ? 'ktx2' : 'jpeg'}`,
    project: projectName
  })
}

export const switchScene = makeFlowNodeDefinition({
  typeName: 'engine/switchScene',
  category: NodeCategory.Action,
  label: 'Switch Scene',
  in: {
    flow: 'flow',
    sceneName: 'string'
  },
  out: {},
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    const projectName = getMutableState(SceneState).sceneData.value?.project
    const sceneName = read('sceneName')
    console.log('DEBUG Switch Scene to', sceneName)
    loadSceneJsonOffline(projectName, sceneName).then(() => {
      console.log('DEBUG switch scene')
    })
  }
})

//scene transition
