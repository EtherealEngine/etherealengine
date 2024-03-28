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

import { InviteType, invitePath } from '@etherealengine/common/src/schema.type.module'

import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import { UserName } from '@etherealengine/common/src/schema.type.module'
import { State } from '@etherealengine/hyperflux'
import { useFind, useSearch } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Checkbox from '@etherealengine/ui/src/primitives/tailwind/Checkbox'
import DataTable from '../../common/Table'
import { InviteRowType, inviteColumns } from '../../common/constants/invite'
import AddEditInviteModal from './AddEditInviteModal'

export default function InviteTable({
  search,
  selectedInvites
}: {
  search: string
  selectedInvites: State<InviteType[]>
}) {
  const { t } = useTranslation()

  const adminInviteQuery = useFind(invitePath, {
    query: {
      $limit: 20,
      $sort: {
        id: 1
      }
    }
  })

  useSearch(
    adminInviteQuery,
    {
      $or: [
        {
          inviteType: {
            $like: '%' + search + '%'
          }
        },
        {
          passcode: {
            $like: '%' + search + '%'
          }
        }
      ]
    },
    search
  )

  const createRows = (rows: readonly InviteType[]): InviteRowType[] =>
    rows.map((row) => ({
      select: (
        <Checkbox
          value={selectedInvites.value.findIndex((invite) => invite.id === row.id) !== -1}
          onChange={(value) => {
            if (value) selectedInvites.merge([row])
            else selectedInvites.set((prevInvites) => prevInvites.filter((invite) => invite.id !== row.id))
          }}
        />
      ),
      id: row.id,
      name: row.invitee?.name || ((row.token || '') as UserName),
      passcode: row.passcode,
      type: row.inviteType,
      targetObjectId: row.targetObjectId,
      spawnType: row.spawnType,
      spawnDetails: row.spawnDetails ? JSON.stringify(row.spawnDetails) : '',
      action: (
        <Button
          className="bg-blue-secondary text-[#214AA6]"
          onClick={() => PopoverState.showPopupover(<AddEditInviteModal invite={row} />)}
        >
          {t('admin:components:invite.update')}
        </Button>
      )
    }))

  return (
    <DataTable
      query={adminInviteQuery}
      columns={[
        {
          id: 'select',
          label: (
            <Checkbox
              value={selectedInvites.length === adminInviteQuery.data.length}
              onChange={(value) => {
                if (value) selectedInvites.set(adminInviteQuery.data.slice())
                else selectedInvites.set([])
              }}
            />
          )
        },
        ...inviteColumns
      ]}
      rows={createRows(adminInviteQuery.data)}
    />
  )
}
