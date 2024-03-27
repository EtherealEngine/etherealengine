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

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, virtual } from '@feathersjs/schema'
import { v4 as uuidv4 } from 'uuid'

import type { HookContext } from '@etherealengine/server-core/declarations'

import {
  recordingResourcePath,
  RecordingResourceType
} from '@etherealengine/common/src/schemas/recording/recording-resource.schema'
import {
  RecordingDatabaseType,
  RecordingID,
  RecordingQuery,
  RecordingSchemaType,
  RecordingType
} from '@etherealengine/common/src/schemas/recording/recording.schema'
import { userPath } from '@etherealengine/common/src/schemas/user/user.schema'
import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export const recordingDbToSchema = (rawData: RecordingDatabaseType): RecordingType => {
  let schema = JSON.parse(rawData.schema) as RecordingSchemaType

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof schema === 'string') {
    schema = JSON.parse(schema)
  }

  return {
    ...rawData,
    schema
  }
}

export const recordingResolver = resolve<RecordingType, HookContext>(
  {
    resources: virtual(async (recording, context) => {
      const recordingResources = (await context.app.service(recordingResourcePath).find({
        query: {
          recordingId: recording.id
        },
        paginate: false
      })) as RecordingResourceType[]

      return recordingResources.map((resource) => resource.staticResource)
    }),
    userName: virtual(async (recording, context) => {
      const user = await context.app.service(userPath).get(recording.userId)

      return user.name
    }),
    createdAt: virtual(async (recording) => fromDateTimeSql(recording.createdAt)),
    updatedAt: virtual(async (recording) => fromDateTimeSql(recording.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData) => {
      return recordingDbToSchema(rawData)
    }
  }
)

export const recordingExternalResolver = resolve<RecordingType, HookContext>({})

export const recordingDataResolver = resolve<RecordingDatabaseType, HookContext>(
  {
    id: async () => {
      return uuidv4() as RecordingID
    },
    createdAt: getDateTimeSql,
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData) => {
      return {
        ...rawData,
        schema: JSON.stringify(rawData.schema)
      }
    }
  }
)

export const recordingPatchResolver = resolve<RecordingType, HookContext>(
  {
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData) => {
      return {
        ...rawData,
        schema: JSON.stringify(rawData.schema)
      }
    }
  }
)

export const recordingQueryResolver = resolve<RecordingQuery, HookContext>({})
