import { createHash } from 'crypto'
import fs from 'fs'
import fetch from 'node-fetch'
import { Op } from 'sequelize'

import { UploadFile } from '@etherealengine/common/src/interfaces/UploadAssetInterface'

import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import { addGenericAssetToS3AndStaticResources, UploadAssetArgs } from '../upload-asset/upload-asset.service'

export const modelUpload = async (app: Application, data: UploadAssetArgs) => {
  try {
    let fileHead, contentLength, extension
    if (data.url) {
      if (/http(s)?:\/\//.test(data.url)) {
        fileHead = await fetch(data.url, { method: 'HEAD' })
        if (!/^[23]/.test(fileHead.status.toString())) throw new Error('Invalid URL')
        contentLength = fileHead.headers['content-length'] || fileHead.headers?.get('content-length')
      } else {
        fileHead = await fs.statSync(data.url)
        contentLength = fileHead.size.toString()
      }
      if (!data.name) data.name = data.url.split('/').pop()!.split('.')[0]
      extension = data.url.split('.').pop()
    } else if (data.files) {
      const mainFile = data.files[0]!
      console.log(mainFile)
      switch (mainFile.mimetype) {
        case 'application/octet-stream':
          extension = mainFile.originalname.split('.').pop()
          break
        case 'model/gltf':
          extension = 'gltf'
          break
        case 'model/glb':
          extension = 'glb'
          break
        case 'model/usdz':
          extension = 'usdz'
          break
        case 'model/fbx':
          extension = 'fbx'
          break
      }
      console.log(extension)
      contentLength = mainFile.size.toString()
    }
    // if (/.LOD0/.test(data.name)) data.name = data.name.replace('.LOD0', '')
    if (!data.name) data.name = data.files![0].originalname
    const hash = createHash('sha3-256').update(contentLength).update(data.name).digest('hex')
    let existingModel
    let existingResource = await app.service('static-resource').Model.findOne({
      where: {
        hash
      }
    })

    if (existingResource)
      existingModel = await app.service('model').Model.findOne({
        where: {
          [Op.or]: [
            {
              glbStaticResourceId: {
                [Op.eq]: existingResource.id
              }
            },
            {
              gltfStaticResourceId: {
                [Op.eq]: existingResource.id
              }
            },
            {
              fbxStaticResourceId: {
                [Op.eq]: existingResource.id
              }
            },
            {
              usdzStaticResourceId: {
                [Op.eq]: existingResource.id
              }
            }
          ]
        }
      })
    if (existingResource && existingModel) return app.service('model').get(existingModel.id)
    else {
      let files: UploadFile[]
      if (data.url) {
        if (/http(s)?:\/\//.test(data.url)) {
          const file = await fetch(data.url)
          files = [Buffer.from(await file.arrayBuffer())]
        } else files = [fs.readFileSync(data.url)]
      } else {
        files = data.files!
      }
      const newModel = await app.service('model').create({})
      if (!existingResource) {
        const key = `static-resources/model/${newModel.id}`
        existingResource = await addGenericAssetToS3AndStaticResources(app, files, extension, {
          hash: hash,
          key: key,
          staticResourceType: 'model3d',
          stats: {
            size: contentLength
          }
        })
      }
      console.log(existingResource)
      const update = {} as any
      if (newModel?.id) {
        const staticResourceColumn = `${extension}StaticResourceId`
        update[staticResourceColumn] = existingResource.id
      }
      console.log(update)
      try {
        await app.service('model').patch(newModel.id, update)
      } catch (err) {
        logger.error('error updating model with resources')
        logger.error(err)
        throw err
      }
      return app.service('model').get(newModel.id)
    }
  } catch (err) {
    logger.error('model upload error')
    logger.error(err)
    throw err
  }
}
