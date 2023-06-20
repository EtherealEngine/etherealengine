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

import * as ffprobe from '@ffprobe-installer/ffprobe'
import { createHash } from 'crypto'
import execa from 'execa'
import fs from 'fs'
import fetch from 'node-fetch'
import { Op } from 'sequelize'
import { Readable } from 'stream'

import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import { getResourceFiles } from '../static-resource/static-resource-helper'
import { addGenericAssetToS3AndStaticResources, UploadAssetArgs } from '../upload-asset/upload-asset.service'

export const videoUpload = async (app: Application, data: UploadAssetArgs, parentId?: string, parentType?: string) => {
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
        hash
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
          ]
        },
        include
      })
    }
    if (existingResource && existingVideo) return existingVideo

    const files = await getResourceFiles(data)
    const stats = (await getVideoStats(files[0].buffer)) as any
    stats.size = contentLength
    const newVideo = await app.service('video').create({
      duration: stats.duration
    })
    if (!existingResource) {
      const key = `static-resources/${parentType ?? 'video'}/${parentId ?? newVideo.id}`
      existingResource = await addGenericAssetToS3AndStaticResources(app, files, extension, {
        hash: hash,
        key: key,
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
