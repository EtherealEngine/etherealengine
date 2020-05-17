import collectAnalytics from '../../hooks/collect-analytics'
import * as authentication from '@feathersjs/authentication'
import { disallow } from 'feathers-hooks-common'
import { BadRequest } from '@feathersjs/errors'

import { HookContext } from '@feathersjs/feathers'
import setResponseStatusCode from '../../hooks/set-response-status-code'
import attachOwnerIdInBody from '../../hooks/set-loggedin-user-in-body'
import attachOwnerIdInQuery from '../../hooks/set-loggedin-user-in-query'
import { extractLoggedInUserFromParams } from '../auth-management/auth-management.utils'

// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks

const mapProjectSaveData = () => {
  return (context: HookContext) => {
    context.data.project_owned_file_id = context.data.project.project_file_id
    context.data.name = context.data.project.name
    context.data.thumbnail_owned_file_id = context.data.project.thumbnail_file_id
    context.data.projectJson = context.data.project.projectJson
    return context
  }
}

const validateCollectionData = () => {
  return async (context: HookContext) => {
    if (!context?.data?.projectJson) {
      return await Promise.reject(new BadRequest('Project Collection Data is required!'))
    }
    return context
  }
}

const generateSceneCollection = () => {
  return async (context: HookContext) => {
    const sceneData = context.data.projectJson
    if (!sceneData) {

    }
    const seqeulizeClient = context.app.get('sequelizeClient')
    const models = seqeulizeClient.models
    const CollectionModel = models.collection
    const EntityModel = models.entity
    const ComponentModel = models.component
    const ComponentTypeModel = models.component_type
    const loggedInUser = extractLoggedInUserFromParams(context.params)

    const savedCollection = await CollectionModel.create({
      type: 'scene',
      name: context.data.name,
      metaData: sceneData.metadata,
      userId: loggedInUser.userId
    })

    const sceneEntitiesArray: any = []

    for (const prop in sceneData.entities) {
      sceneEntitiesArray.push(sceneData.entities[prop])
    }

    const entites = sceneEntitiesArray.map((entity: any) => {
      entity.name = entity.name.toLowerCase()
      entity.type = 'default'
      entity.userId = loggedInUser.userId
      entity.collectionId = savedCollection.id
      return entity
    })

    const savedEntities = await EntityModel.bulkCreate(entites)

    const components: any = []
    const componetTypeSet = new Set()
    savedEntities.forEach((savedEntity: any, index: number) => {
      const entity = sceneEntitiesArray[index]
      entity.components.forEach((component: any) => {
        componetTypeSet.add(component.name.toLowerCase())
        components.push(
          {
            data: component.props,
            entityId: savedEntity.id,
            type: component.name.toLowerCase(),
            userId: loggedInUser.userId,
            collection: savedCollection.id
            // TODO: Manage Static_RESOURCE
          }
        )
      })
    })

    // Now we check if any of component-type is missing, then create that one
    let savedComponentTypes = await ComponentTypeModel.findAll({
      where: {
        type: Array.from(componetTypeSet)
      },
      raw: true,
      attributes: ['type']
    })

    savedComponentTypes = savedComponentTypes.map((item: any) => item.type)
    if (savedComponentTypes.length <= componetTypeSet.size) {
      let nonExistedComponentTypes = Array.from(componetTypeSet).filter((item) => savedComponentTypes.indexOf(item) < 0)

      nonExistedComponentTypes = nonExistedComponentTypes.map((item) => {
        return {
          type: item
        }
      })
      await ComponentTypeModel.bulkCreate(nonExistedComponentTypes)
    }
    await ComponentModel.bulkCreate(components)

    return context
  }
}

export default {
  before: {
    all: [authenticate('jwt'), collectAnalytics()],
    find: [],
    get: [],
    create: [attachOwnerIdInBody('created_by_account_id'), mapProjectSaveData(), validateCollectionData(), generateSceneCollection()],
    update: [disallow()],
    patch: [attachOwnerIdInBody('created_by_account_id'), mapProjectSaveData(), validateCollectionData()],
    remove: [
      attachOwnerIdInQuery('created_by_account_id')
    ]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      // Spoke is expecting 200, while feather is sending 201 for creation
      setResponseStatusCode(200)
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}
