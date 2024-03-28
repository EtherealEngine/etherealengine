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

import { ServerPodInfoType } from '@etherealengine/common/src/schema.type.module'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { timeAgo } from '@etherealengine/common/src/utils/datetime-sql'
import Badge from '@etherealengine/ui/src/primitives/tailwind/Badge'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Tooltip from '@etherealengine/ui/src/primitives/tailwind/ToolTip'
import { HiTrash } from 'react-icons/hi2'
import { useServerInfoFind } from '../../../admin/services/ServerInfoQuery'
import { PopoverState } from '../../../common/services/PopoverState'
import DataTable from '../../common/Table'
import { ServerRowType, serverColumns } from '../../common/constants/server'
import RemoveServerModal from './RemoveServerModal'
import ServerLogsModal from './ServerLogsModal'

const containerColor = {
  Succeeded: 'bg-theme-tagGreen',
  Running: 'bg-theme-tagYellow',
  Terminated: 'bg-theme-tagRed'
}

function ServerStatus({ serverPodInfo }: { serverPodInfo: ServerPodInfoType }) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between gap-3">
      {serverPodInfo.status === 'Succeeded' && (
        <Badge className="rounded" variant="success" label={t('admin:components.server.serverStatus.succeeded')} />
      )}
      {serverPodInfo.status === 'Running' && (
        <Badge className="rounded" variant="warning" label={t('admin:components.server.serverStatus.running')} />
      )}
      {serverPodInfo.status === 'Terminated' && (
        <Badge className="rounded" variant="danger" label={t('admin:components.server.serverStatus.terminated')} />
      )}
      <div className="flex gap-1">
        {serverPodInfo.containers.map((container) => (
          <Tooltip key={container.name} title={`${t('admin:components.server.name')}: ${container.name}`}>
            <div className={`${containerColor[serverPodInfo.status]} h-3.5 w-3.5 rounded-full`} />
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

export default function ServerTable({
  serverType,
  serverInfoQuery
}: {
  serverType: string
  serverInfoQuery: ReturnType<typeof useServerInfoFind>
}) {
  const { t } = useTranslation()

  const createRows = (rows: readonly ServerPodInfoType[]): ServerRowType[] =>
    rows.map((row) => ({
      name: row.name,
      status: <ServerStatus serverPodInfo={row} />,
      type: row.type,
      currentUsers: row.currentUsers?.toString(),
      age: t('common:timeAgo', { time: timeAgo(new Date(row.age)) }),
      restarts: row.containers.map((container) => container.restarts).join(', '),
      instanceId: row.instanceId,
      action: (
        <div className="flex items-center gap-5">
          <Button
            size="small"
            className="bg-blue-secondary h-min"
            onClick={() => {
              PopoverState.showPopupover(
                <ServerLogsModal podName={row.name} containerName={row.containers?.at(-1)?.name} />
              )
            }}
          >
            {t('admin:components.server.viewLogs')}
          </Button>
          <Button
            variant="outline"
            className="border-0"
            startIcon={<HiTrash className="text-theme-iconRed" />}
            onClick={() => PopoverState.showPopupover(<RemoveServerModal serverPodInfo={row} />)}
          />
        </div>
      )
    }))

  return (
    <DataTable
      query={serverInfoQuery}
      columns={serverColumns}
      rows={createRows(serverInfoQuery.data.find((serverInfo) => serverInfo.id === serverType)?.pods || [])}
    />
  )
}
