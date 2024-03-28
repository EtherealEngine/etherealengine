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

import { RecordingType, recordingPath } from '@etherealengine/common/src/schema.type.module'

import { useFind, useSearch } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import DataTable from '../../common/Table'

import { recordingColumns } from '../../common/constants/recordings'

import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import { HiTrash } from 'react-icons/hi2'
import { PopoverState } from '../../../common/services/PopoverState'
import DeleteRecordingModal from './DeleteRecordingModal'

export default function RecordingsTable({ search }: { search: string }) {
  const { t } = useTranslation()
  const recordingsQuery = useFind(recordingPath, {
    query: {
      $sort: { createdAt: 1 },
      $limit: 20,
      action: 'admin'
    }
  })

  useSearch(recordingsQuery, { search }, search)

  const createRows = (rows: readonly RecordingType[]) =>
    rows.map((row) => ({
      id: row.id,
      user: row.userName,
      ended: row.ended ? t('admin:components.common.yes') : t('admin:components.common.no'),
      schema: JSON.stringify(row.schema),
      action: (
        <div className="flex w-full justify-center px-2 py-1">
          {/* <Button className="border-theme-primary h-8 w-8 justify-center border bg-transparent p-0" rounded>
            <HiEye className="place-self-center" />
          </Button> */}
          <Button
            className="border-theme-primary h-8 w-8 justify-center border bg-transparent p-0"
            rounded
            onClick={() => {
              PopoverState.showPopupover(<DeleteRecordingModal recordingId={row.id} />)
            }}
          >
            <HiTrash className="place-self-center text-[#E11D48] dark:text-[#FB7185]" />
          </Button>
        </div>
      )
    }))

  return <DataTable query={recordingsQuery} columns={recordingColumns} rows={createRows(recordingsQuery.data)} />
}
