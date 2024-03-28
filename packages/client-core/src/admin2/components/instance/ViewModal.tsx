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

import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import {
  InstanceID,
  UserID,
  instanceAttendancePath,
  userKickPath,
  userPath
} from '@etherealengine/common/src/schema.type.module'
import { toDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import { useFind, useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Modal from '@etherealengine/ui/src/primitives/tailwind/Modal'
import Table, { TableBody, TableCell, TableRow } from '@etherealengine/ui/src/primitives/tailwind/Table'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import { useHookstate } from '@hookstate/core'
import React from 'react'
import { useTranslation } from 'react-i18next'

const useKickUser = () => {
  const createUserKick = useMutation(userKickPath).create

  return (kickData: { userId: UserID; instanceId: InstanceID; duration: string }) => {
    const duration = new Date()
    if (kickData.duration === 'INFINITY') {
      duration.setFullYear(duration.getFullYear() + 10) // ban for 10 years
    } else {
      duration.setHours(duration.getHours() + parseInt(kickData.duration, 10))
    }
    createUserKick({ ...kickData, duration: toDateTimeSql(duration) })
  }
}

const useUsersInInstance = (instanceId: InstanceID) => {
  const instanceAttendances = useFind(instanceAttendancePath, {
    query: {
      instanceId
    }
  })

  const userIds = instanceAttendances.data.map((d: any) => d.userId)
  return useFind(userPath, {
    query: {
      id: {
        $in: userIds
      },
      $sort: {
        createdAt: 1
      },
      $limit: 10
    }
  })
}

// TODO: Needs styles polishing
export default function ViewUsersModal({ instanceId }: { instanceId: string }) {
  const { t } = useTranslation()

  const kickData = useHookstate({
    userId: '' as UserID,
    instanceId: '' as InstanceID,
    duration: '8'
  })

  const instanceUsersQuery = useUsersInInstance(instanceId as InstanceID)
  const kickUser = useKickUser()

  return (
    <Modal
      title="View"
      className="w-[50vw]"
      onClose={() => {
        PopoverState.hidePopupover()
      }}
    >
      {instanceUsersQuery.data.length === 0 ? (
        <Text theme="secondary" className="w-full text-center">
          {t('admin:components.instance.noInstanceUsers')}
        </Text>
      ) : null}
      <Table>
        <TableBody>
          {instanceUsersQuery.data.map((el) => (
            <TableRow>
              <TableCell>
                <img src={el.avatar.thumbnailResource?.url} className="mx-auto max-h-full max-w-full rounded-full" />
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => {
                    kickData.merge({
                      userId: el.id,
                      instanceId: instanceId as InstanceID,
                      duration: '8'
                    })
                    kickUser(kickData.value)
                  }}
                >
                  {t('admin:components.instance.kick')}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => {
                    kickData.merge({
                      userId: el.id,
                      instanceId: instanceId as InstanceID,
                      duration: 'INFINITY'
                    })
                    kickUser(kickData.value)
                  }}
                >
                  {t('admin:components.instance.ban')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Modal>
  )
}
