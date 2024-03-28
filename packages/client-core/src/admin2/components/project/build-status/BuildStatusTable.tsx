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

import React from 'react'
import { useTranslation } from 'react-i18next'

import { BuildStatusType, buildStatusPath } from '@etherealengine/common/src/schema.type.module'

import { useFind } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import { HiEye } from 'react-icons/hi2'
import { PopoverState } from '../../../../common/services/PopoverState'
import DataTable from '../../../common/Table'
import { BuildStatusRowType, buildStatusColumns } from '../../../common/constants/build-status'
import BuildStatusLogsModal, { BuildStatusBadge, getStartOrEndDate } from './BuildStatusLogsModal'

export default function BuildStatusTable() {
  const { t } = useTranslation()

  const adminBuildStatusQuery = useFind(buildStatusPath, {
    query: {
      $limit: 10,
      $sort: {
        id: -1
      }
    }
  })

  const createRows = (rows: readonly BuildStatusType[]): BuildStatusRowType[] =>
    rows.map((row) => ({
      id: row.id.toString(),
      commitSHA: row.commitSHA,
      status: <BuildStatusBadge status={row.status} />,
      dateStarted: getStartOrEndDate(row.dateStarted),
      dateEnded: getStartOrEndDate(row.dateEnded, true),
      logs: (
        <Button
          disabled={!row.logs || !row.logs.length}
          startIcon={<HiEye />}
          onClick={() => {
            PopoverState.showPopupover(<BuildStatusLogsModal buildStatus={row} />)
          }}
        >
          {t('admin:components.buildStatus.viewLogs')}
        </Button>
      )
    }))

  return (
    <DataTable
      query={adminBuildStatusQuery}
      columns={buildStatusColumns}
      rows={createRows(adminBuildStatusQuery.data)}
    />
  )
}
