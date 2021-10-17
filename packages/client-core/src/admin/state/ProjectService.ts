import { ProjectAction } from './ProjectActions'
import { client } from '../../feathers'
import { accessProjectState } from './ProjectState'
import { store, useDispatch } from '../../store'

export async function fetchAdminProjects(incDec?: 'increment' | 'decrement') {
  const adminProjectState = accessProjectState().projects
  const limit = adminProjectState.limit.value
  const skip = adminProjectState.skip.value
  const projects = await client.service('project').find({
    query: {
      $limit: limit,
      $skip: incDec === 'increment' ? skip + limit : incDec === 'decrement' ? skip - limit : skip
    }
  })
  store.dispatch(ProjectAction.projectsFetched(projects))
}
