import { client } from '../../feathers'
import { store, useDispatch } from '../../store'
import { createState, useState } from '@hookstate/core'
import { SceneData } from '@xrengine/common/src/interfaces/SceneData'

//State
export const SCENE_PAGE_LIMIT = 100

const state = createState({
  scenes: [] as Array<SceneData>
})

store.receptors.push((action: SceneActionType): any => {
  let result: any
  state.batch((s) => {
    switch (action.type) {
      case 'ADMIN_SCENES_RETRIEVED':
        result = action.sceneData
        return s.merge({
          scenes: result
        })
    }
  }, action.type)
})

export const accessSceneState = () => state

export const useSceneState = () => useState(state) as any as typeof state

export const SceneService = {
  fetchAdminScenes: async (incDec?: 'increment' | 'decrement' | 'all') => {
    console.warn('deprecated - use fetchProjectScenes')
  },

  deleteScene: async (sceneId: string) => {},

  getScene: async (projectName: string) => {
    const dispatch = useDispatch()
    const scenes = await client.service('scenes').get({ projectName })
    dispatch(SceneAction.scenesFetched(scenes))
  },

  createScene: async (projectName: string, sceneName: string) => {
    const dispatch = useDispatch()
    const result = await client.service('scene').create({ projectName, sceneName })
    console.log('Upload project result', result)
    dispatch(SceneAction.sceneCreated())
  }
}

//Action
export const SceneAction = {
  scenesFetched: (sceneData: SceneData[]) => {
    return {
      type: 'ADMIN_SCENES_RETRIEVED' as const,
      sceneData: sceneData
    }
  },
  sceneCreated: () => {
    return {
      type: 'ADMIN_SCENE_CREATED' as const
    }
  }
}

export type SceneActionType = ReturnType<typeof SceneAction[keyof typeof SceneAction]>
