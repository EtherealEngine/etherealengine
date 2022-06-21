import { createState, useState } from '@speigg/hookstate'

import { ProjectInterface } from '@xrengine/common/src/interfaces/ProjectInterface'
import multiLogger from '@xrengine/common/src/logger'

import { API } from '../../API'
import { store, useDispatch } from '../../store'

const logger = multiLogger.child({ component: 'client-core:projects' })

//State
export const PROJECT_PAGE_LIMIT = 100

export const state = createState({
  projects: [] as Array<ProjectInterface>,
  updateNeeded: true
})

store.receptors.push((action: ProjectActionType): any => {
  state.batch((s) => {
    switch (action.type) {
      case 'PROJECTS_RETRIEVED':
        return s.merge({
          projects: action.projectResult,
          updateNeeded: false
        })
    }
  }, action.type)
})

export const accessProjectState = () => state

export const useProjectState = () => useState(state) as any as typeof state

//Service
export const ProjectService = {
  fetchProjects: async () => {
    const projects = await API.instance.client.service('project').find({ paginate: false })
    store.dispatch(ProjectAction.projectsFetched(projects.data))
  },

  // restricted to admin scope
  createProject: async (name: string) => {
    const dispatch = useDispatch()
    const result = await API.instance.client.service('project').create({ name })
    logger.info({ result }, 'Create project result')
    dispatch(ProjectAction.createdProject())
    ProjectService.fetchProjects()
  },

  // restricted to admin scope
  uploadProject: async (url: string) => {
    const dispatch = useDispatch()
    const result = await API.instance.client.service('project').update({ url })
    logger.info({ result }, 'Upload project result')
    dispatch(ProjectAction.postProject())
    ProjectService.fetchProjects()
  },

  // restricted to admin scope
  removeProject: async (id: string) => {
    const result = await API.instance.client.service('project').remove(id)
    logger.info({ result }, 'Remove project result')
    ProjectService.fetchProjects()
  },

  // restricted to admin scope
  triggerReload: async () => {
    const result = await API.instance.client.service('project-build').patch({ rebuild: true })
    logger.info({ result }, 'Reload project result')
  },

  // restricted to admin scope
  invalidateProjectCache: async (projectName: string) => {
    try {
      await API.instance.client.service('project-invalidate').patch({ projectName })
      ProjectService.fetchProjects()
    } catch (err) {
      logger.error(err, 'Error invalidating project cache.')
    }
  }
}
// TODO
// client.service('project-build').on('patched', (params) => {
//   store.dispatch(ProjectAction.buildProgress(params.message))
// })

//Action
export const ProjectAction = {
  projectsFetched: (projectResult: ProjectInterface[]) => {
    return {
      type: 'PROJECTS_RETRIEVED' as const,
      projectResult: projectResult
    }
  },
  postProject: () => {
    return {
      type: 'PROJECT_POSTED' as const
    }
  },
  createdProject: () => {
    return {
      type: 'PROJECT_CREATED' as const
    }
  }
  // TODO
  // buildProgress: (message: string) => {
  //   return {
  //     type: 'PROJECT_BUILDER_UPDATE' as const,
  //     message
  //   }
  // }
}

export type ProjectActionType = ReturnType<typeof ProjectAction[keyof typeof ProjectAction]>
