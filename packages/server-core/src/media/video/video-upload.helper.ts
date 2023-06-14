import * as ffprobe from '@ffprobe-installer/ffprobe'
import appRootPath from 'app-root-path'
import { createHash } from 'crypto'
import execa from 'execa'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import { Op } from 'sequelize'
import { Readable } from 'stream'

import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import { getResourceFiles } from '../static-resource/static-resource-helper'
import { addAssetAsStaticResource, UploadAssetArgs } from '../upload-asset/upload-asset.service'

const relativePath = path.join(appRootPath.path, '/packages/')

export const videoUpload = async (app: Application, data: UploadAssetArgs, parentId?: string, parentType?: string) => {
  console.trace('videoUpload', data, parentId, parentType)
  try {
    const project = data.project
    let relativeContainingFolderPath = `/projects/${project}/assets`
    let fileHead, contentLength, extension
    if (data.url) {
      const isHTTP = /http(s)?:\/\//.test(data.url)
      console.log({ isHTTP })
      if (isHTTP) {
        fileHead = await fetch(data.url, { method: 'HEAD' })
        if (!/^[23]/.test(fileHead.status.toString())) throw new Error('Invalid URL')
        contentLength = fileHead.headers['content-length'] || fileHead.headers?.get('content-length')
      } else {
        fileHead = await fs.statSync(data.url)
        contentLength = fileHead.size.toString()
      }
      if (parentType === 'volumetric') {
        if (!/^[23]/.test(fileHead.status.toString())) {
          let parts = data.url.split('.')
          if (parts.length === 2) parts.splice(1, 0, 'LOD0')
          // else if (parts.length === 3 && /LOD[0-9]?[0-9]/.test(parts[1]))
          //     parts[1] = 'LOD0'
          data.url = parts.join('.')
          fileHead = await fetch(data.url, { method: 'HEAD' })
          contentLength = fileHead.size.toString()
        }
      }
      if (!data.name) data.name = data.url.split('/').pop()!.split('.')[0]
      extension = data.url.split('.').pop()
      if (!isHTTP) {
        relativeContainingFolderPath = data.url.replace(relativePath, '').split('/').slice(0, -1).join('/')
      }
    } else if (data.files) {
      const mainFile = data.files[0]!
      switch (mainFile.mimetype) {
        case 'video/mp4':
          extension = 'mp4'
          break
        case 'video/m3u8':
          extension = 'm3u8'
          break
      }
      contentLength = mainFile.size.toString()
      if (!data.name) data.name = mainFile.originalname
    }
    const hash = createHash('sha3-256').update(contentLength).update(data.name!).digest('hex')
    let existingVideo, thumbnail
    let existingResource = await app.service('static-resource').Model.findOne({
      where: {
        hash,
        project
      }
    })

    const include = [
      {
        model: app.service('static-resource').Model,
        as: 'm3u8StaticResource'
      },
      {
        model: app.service('static-resource').Model,
        as: 'mp4StaticResource'
      }
    ]

    if (existingResource) {
      existingVideo = await app.service('video').Model.findOne({
        where: {
          [Op.or]: [
            {
              mp4StaticResourceId: {
                [Op.eq]: existingResource.id
              }
            },
            {
              m3u8StaticResourceId: {
                [Op.eq]: existingResource.id
              }
            }
          ],
          project
        },
        include
      })
    }
    if (existingResource && existingVideo) return existingVideo

    console.log({ relativeContainingFolderPath })
    const files = await getResourceFiles(data)
    console.log(files)
    const stats = (await getVideoStats(files[0].buffer)) as any
    stats.size = contentLength
    const newVideo = await app.service('video').create({
      duration: stats.duration
    })
    if (!existingResource) {
      console.log('adding generic asset to s3 and static resources')

      console.log({
        hash,
        relativeContainingFolderPath,
        stats
      })
      existingResource = await addAssetAsStaticResource(app, files, {
        hash: hash,
        path: relativeContainingFolderPath,
        project,
        staticResourceType: 'video',
        stats
      })
    }
    const update = {} as any
    if (existingResource?.id) {
      const staticResourceColumn = `${extension}StaticResourceId`
      update[staticResourceColumn] = existingResource.id
    }
    try {
      await app.service('video').patch(newVideo.id, update)
    } catch (err) {
      logger.error('error updating video with resources')
      logger.error(err)
      throw err
    }
    return app.service('video').Model.findOne({
      where: {
        id: newVideo.id
      },
      include
    })
  } catch (err) {
    logger.error('video upload error')
    logger.error(err)
    throw err
  }
}

export const getVideoStats = async (input: Buffer | string) => {
  let out = ''
  if (typeof input === 'string') {
    out = (await execa(ffprobe.path, ['-v', 'error', '-show_format', '-show_streams', input])).stdout
  } else {
    const stream = new Readable()
    stream.push(input)
    stream.push(null)
    out = (
      await execa(ffprobe.path, ['-v', 'error', '-show_format', '-show_streams', '-i', 'pipe:0'], {
        reject: false,
        input: stream
      })
    ).stdout
  }
  const width = /width=(\d+)/.exec(out)
  const height = /height=(\d+)/.exec(out)
  const duration = /duration=(\d+)/.exec(out)
  const channels = /channels=(\d+)/.exec(out)
  const bitrate = /bit_rate=(\d+)/.exec(out)
  return {
    width: width ? parseInt(width[1]) : null,
    height: height ? parseInt(height[1]) : null,
    duration: duration ? parseInt(duration[1]) : 0,
    channels: channels ? parseInt(channels[1]) : null,
    bitrate: bitrate ? parseInt(bitrate[1]) : null
  }
}
