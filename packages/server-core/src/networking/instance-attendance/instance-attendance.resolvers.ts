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
  InstanceAttendanceQuery,
  InstanceAttendanceType
} from '@etherealengine/common/src/schemas/networking/instance-attendance.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { fromDateTimeSql, getDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'

export const instanceAttendanceResolver = resolve<InstanceAttendanceType, HookContext>({
  createdAt: virtual(async (instanceAttendance) => fromDateTimeSql(instanceAttendance.createdAt)),
  updatedAt: virtual(async (instanceAttendance) => fromDateTimeSql(instanceAttendance.updatedAt))
})

export const instanceAttendanceExternalResolver = resolve<InstanceAttendanceType, HookContext>({})

export const instanceAttendanceDataResolver = resolve<InstanceAttendanceType, HookContext>({
  id: async () => {
    return uuidv4()
  },
  createdAt: getDateTimeSql,
  updatedAt: getDateTimeSql
})

export const instanceAttendancePatchResolver = resolve<InstanceAttendanceType, HookContext>({
  updatedAt: getDateTimeSql
})

export const instanceAttendanceQueryResolver = resolve<InstanceAttendanceQuery, HookContext>({})
