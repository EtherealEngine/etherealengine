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

import { SceneJson } from '@etherealengine/common/src/interfaces/SceneInterface'
import { dispatchAction, getMutableState } from '@etherealengine/hyperflux'
import { clamp } from 'three/src/math/MathUtils'
import { AnimationManager } from '../../../../../avatar/AnimationManager'
import { LoopAnimationComponent } from '../../../../../avatar/components/LoopAnimationComponent'
import { CameraActions } from '../../../../../camera/CameraState'
import { Entity } from '../../../../../ecs/classes/Entity'
import { SceneState } from '../../../../../ecs/classes/Scene'
import { setComponent } from '../../../../../ecs/functions/ComponentFunctions'
import { getCallback } from '../../../../../scene/components/CallbackComponent'
import { MediaComponent } from '../../../../../scene/components/MediaComponent'
import { VideoComponent } from '../../../../../scene/components/VideoComponent'
import { PlayMode } from '../../../../../scene/constants/PlayMode'
import { TransformComponent } from '../../../../../transform/components/TransformComponent'
import { ContentFitType } from '../../../../../xrui/functions/ObjectFitFunctions'
import { NodeCategory, makeFlowNodeDefinition, makeFunctionNodeDefinition } from '../../../Nodes/NodeDefinitions'
import { eulerToQuat } from '../../Scene/Values/Internal/Vec4'
import { toQuat, toVector3 } from '../../Scene/buildScene'

export const teleportEntity = makeFlowNodeDefinition({
  typeName: 'engine/teleportEntity',
  category: NodeCategory.Action,
  label: 'Teleport Entity',
  in: {
    flow: 'flow',
    entity: 'entity',
    targetPosition: 'vec3',
    targetRotation: 'vec3'
  },
  out: { flow: 'flow' },
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    const position = toVector3(read('targetPosition'))

    const rotation = toQuat(eulerToQuat(read('targetRotation')))
    const entity = Number(read('entity')) as Entity
    setComponent(entity, TransformComponent, { position: position, rotation: rotation })
    commit('flow')
  }
})

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
    const media: string = read('mediaPath')
    const paused: boolean = read('paused')
    const volume = clamp(read('volume'), 0, 1)
    const playMode: PlayMode = read('playMode')
    const videoFit: ContentFitType = read('videoFit')
    const entity = Number(read('entity')) as Entity
    setComponent(entity, VideoComponent, { fit: videoFit }) // play
    setComponent(entity, MediaComponent, { paused: paused, paths: [media], volume: volume, playMode: playMode! }) // play
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
    const media: string = read('mediaPath')
    const paused: boolean = read('paused')
    const volume = clamp(read('volume'), 0, 1)
    const playMode: PlayMode = read('playMode')
    const entity = Number(read('entity')) as Entity
    setComponent(entity, MediaComponent, { paused: paused, paths: [media], volume: volume, playMode: playMode! }) // play
    commit('flow')
  }
})

export const getAvatarAnimations = makeFunctionNodeDefinition({
  typeName: 'engine/getAvatarAnimations',
  category: NodeCategory.Query,
  label: 'Get Avatar Animations',
  in: {
    animationName: (_, graphApi) => {
      const choices = Array.from(AnimationManager.instance._animations)
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
    const animation: string = read('animationName')
    const animations = AnimationManager.instance._animations
    const isAvatar: boolean = read('isAvatar')
    const entity = Number(read('entity')) as Entity
    const animIndex: number = animations.findIndex((clip) => clip.name === animation)
    setComponent(entity, LoopAnimationComponent, { activeClipIndex: animIndex, hasAvatarAnimations: isAvatar })
    getCallback(entity, 'xre.play')!()
    commit('flow')
  }
})

export const fadeToBlackCamera = makeFlowNodeDefinition({
  typeName: 'engine/cameraFadeToBlack',
  category: NodeCategory.Action,
  label: 'Camera fade to black',
  in: {
    flow: 'flow'
  },
  out: { flow: 'flow' },
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    console.log('DEBUG Fade to black')
    dispatchAction(CameraActions.fadeToBlack({ in: true }))
    commit('flow')
  }
})

export const fadeFromBlackCamera = makeFlowNodeDefinition({
  typeName: 'engine/cameraFadeFromBlack',
  category: NodeCategory.Action,
  label: 'Camera fade from black',
  in: {
    flow: 'flow'
  },
  out: { flow: 'flow' },
  initialState: undefined,
  triggered: ({ read, commit, graph: { getDependency } }) => {
    console.log('DEBUG Fade from black')
    dispatchAction(CameraActions.fadeToBlack({ in: false }))
    commit('flow')
  }
})

const loadSceneJsonOffline = async (projectName, sceneName) => {
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
    const sceneName = read('sceneName')
    console.log('DEBUG Switch Scene to', sceneName)
    const locationName = `${projectName}/${sceneName}`
    const sceneData = await(await fetch(`${fileServer}/projects/${locationName}.scene.json`)).json() as SceneJson
    const hasKTX2 = await fetch(`${fileServer}/projects/${locationName}.thumbnail.ktx2`).then((res) => res.ok)
    getMutableState(SceneState).sceneData.set({
      scene: parseSceneDataCacheURLsLocal(projectName, sceneData),
      name: sceneName,
      thumbnailUrl: `${fileServer}/projects/${locationName}.thumbnail.${hasKTX2 ? 'ktx2' : 'jpeg'}`,
      project: projectName
    })
  }
})
//scene transition
