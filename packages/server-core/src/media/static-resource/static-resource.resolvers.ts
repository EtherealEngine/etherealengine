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

import {
  StaticResourceDatabaseType,
  StaticResourceQuery,
  StaticResourceType
} from '@etherealengine/common/src/schemas/media/static-resource.schema'
import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import type { HookContext } from '@etherealengine/server-core/declarations'
import { nanoid } from 'nanoid'

export const staticResourceDbToSchema = (rawData: StaticResourceDatabaseType): StaticResourceType => {
  let metadata = JSON.parse(rawData.metadata) as any

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof metadata === 'string') {
    metadata = JSON.parse(metadata)
  }

  let tags = JSON.parse(rawData.tags) as string[]

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof tags === 'string') {
    tags = JSON.parse(tags)
  }

  let stats = JSON.parse(rawData.stats) as Record<string, any>

  // Usually above JSON.parse should be enough. But since our pre-feathers 5 data
  // was serialized multiple times, therefore we need to parse it twice.
  if (typeof stats === 'string') {
    stats = JSON.parse(stats)
  }

  return {
    ...rawData,
    metadata,
    tags,
    stats
  }
}

export const staticResourceResolver = resolve<StaticResourceType, HookContext>(
  {
    createdAt: virtual(async (staticResource) => fromDateTimeSql(staticResource.createdAt)),
    updatedAt: virtual(async (staticResource) => fromDateTimeSql(staticResource.updatedAt))
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return staticResourceDbToSchema(rawData)
    }
  }
)

export const staticResourceExternalResolver = resolve<StaticResourceType, HookContext>({})

export const staticResourceDataResolver = resolve<StaticResourceType, HookContext>(
  {
    id: async () => {
      return uuidv4()
    },
    sid: async () => {
      return nanoid(8)
    },
    createdAt: getDateTimeSql,
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        metadata: JSON.stringify(rawData.metadata),
        tags: JSON.stringify(rawData.tags),
        stats: JSON.stringify(rawData.stats)
      }
    }
  }
)

export const staticResourcePatchResolver = resolve<StaticResourceType, HookContext>(
  {
    updatedAt: getDateTimeSql
  },
  {
    // Convert the raw data into a new structure before running property resolvers
    converter: async (rawData, context) => {
      return {
        ...rawData,
        metadata: JSON.stringify(rawData.metadata),
        tags: JSON.stringify(rawData.tags),
        stats: JSON.stringify(rawData.stats)
      }
    }
  }
)

export const staticResourceQueryResolver = resolve<StaticResourceQuery, HookContext>({})
