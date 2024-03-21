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

/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
const fs = require('fs')
const knex = require('knex')
const { staticResourcePath } = require('@etherealengine/engine/src/media/static-resource.schema')
const {
  assetsRegex,
  projectPublicRegex,
  projectRegex,
  rootImageRegex,
  rootSceneJsonRegex
} = require('@etherealengine/common/src/constants/ProjectKeyConstants')
const { ObjectCannedACL, S3Client } = require('@aws-sdk/client-s3')
const { nanoid } = require('nanoid')
const { v4 } = require('uuid')

// TODO: check for existing avatar on S3

dotenv.config({ path: process.cwd() + '/../../.env.local' })
const forceS3Upload = process.argv.includes('--force-s3-upload')

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_AWS_ACCESS_KEY_SECRET
  },
  region: process.env.STORAGE_S3_REGION
})

const onlyDBUpdate = process.argv.includes('--db-only')
const knexClient = knex({
  client: 'mysql',
  connection: {
    user: process.env.MYSQL_USER ?? 'server',
    password: process.env.MYSQL_PASSWORD ?? 'password',
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE ?? 'etherealengine',
    charset: 'utf8mb4'
  }
})

// match case of the name of the avatar and the name of corresponding file.
// also update seed file of static resource model to match changes.
const AVATAR_LIST = [
  // 'Allison',
  // 'Rose',
  // 'Andy',
  // 'Erik',
  // 'Geoff',
  // 'Jace',
  // 'Karthik'
  'Razer1',
  'Razer2',
  'Razer3',
  'Razer4',
  'Razer5',
  'Razer6'
]
const MODEL_PATH = process.cwd() + '/../client/public/models/avatars/'
const THUMBNAIL_PATH = process.cwd() + '/../client/public/static/'
const MODEL_EXTENSION = '.glb'
const THUMBNAIL_EXTENSION = '.jpg'
const BUCKET = process.env.STORAGE_S3_STATIC_RESOURCE_BUCKET
const AVATAR_FOLDER = process.env.STORAGE_S3_AVATAR_DIRECTORY
const AVATAR_RESOURCE_TYPE = 'avatar'
const THUMBNAIL_RESOURCE_TYPE = 'user-thumbnail'

const uploadFile = (Key, Body) => {
  return new Promise((resolve) => {
    s3.headObject(
      {
        Bucket: BUCKET,
        Key: Key
      },
      (err, data) => {
        if (forceS3Upload || (err && err.code === 'NotFound')) {
          s3.putObject(
            {
              Body,
              Bucket: BUCKET,
              Key,
              ACL:
                projectRegex.test(Key) &&
                !projectPublicRegex.test(Key) &&
                !assetsRegex.test(Key) &&
                !rootImageRegex.test(Key) &&
                !rootSceneJsonRegex.test(Key)
                  ? ObjectCannedACL.private
                  : ObjectCannedACL.public_read
            },
            (err, data) => {
              resolve(data)
            }
          )
        } else {
          console.log('Object Already Exist hence Skipping => ', Key)
          resolve(data)
        }
      }
    )
  })
}

const saveToDB = async (name, extension) => {
  await knexClient.from(staticResourcePath).insert({
    id: v4(),
    sid: nanoid(8),
    name,
    url: 'https://s3.amazonaws.com/' + BUCKET + '/' + AVATAR_FOLDER + '/' + name + extension,
    key: AVATAR_FOLDER + '/' + name + extension,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
}

const processFile = async (fileName, extension, dirPath) => {
  if (!onlyDBUpdate) {
    const location = dirPath + fileName + extension
    console.log('File Location => ', location)
    const file = fs.readFileSync(location)
    const result = await uploadFile(AVATAR_FOLDER + '/' + fileName + extension, file)
    console.log('Uploading status => ', result)
  }

  console.log('Saving to DB')
  await saveToDB(fileName, extension)
  console.log('Saved To DB')
}

new Promise(async (resolve, reject) => {
  try {
    console.log('Removing old DB entries.')
    await knexClient
      .from(staticResourcePath)
      .where({
        userId: null
      })
      .del()

    for (const avatar of AVATAR_LIST) {
      console.log('Uploading Avatar Model =>', avatar)
      await processFile(avatar, MODEL_EXTENSION, MODEL_PATH)

      console.log('Uploading Avatar Thumbnail =>', avatar)
      await processFile(avatar, THUMBNAIL_EXTENSION, THUMBNAIL_PATH)
    }
    resolve(true)
  } catch (err) {
    reject(err)
  }
})
  .then(() => {
    console.log('Uploading Completed.')
  })
  .catch((err) => {
    console.log('Error Occured => ', err)
  })
