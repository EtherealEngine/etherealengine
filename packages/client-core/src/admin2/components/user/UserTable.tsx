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

import { UserType, userPath } from '@etherealengine/common/src/schema.type.module'
import { State, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { useFind, useSearch } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import AvatarImage from '@etherealengine/ui/src/primitives/tailwind/AvatarImage'
import Checkbox from '@etherealengine/ui/src/primitives/tailwind/Checkbox'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { HiPencil, HiTrash } from 'react-icons/hi2'

import { PopoverState } from '../../../common/services/PopoverState'
import { AuthState } from '../../../user/services/AuthService'
import { userHasAccess } from '../../../user/userHasAccess'
import DataTable from '../../common/Table'
import { UserRowType, userColumns } from '../../common/constants/user'
import AccountIdentifiers from './AccountIdentifiers'
import AddEditUserModal from './AddEditUserModal'
import RemoveUserModal from './RemoveUserModal'

export default function UserTable({
  search,
  skipGuests,
  selectedUsers
}: {
  skipGuests: boolean
  search: string
  selectedUsers: State<UserType[]>
}) {
  const { t } = useTranslation()
  const user = useHookstate(getMutableState(AuthState).user)

  const adminUserQuery = useFind(userPath, {
    query: {
      isGuest: skipGuests ? false : undefined,
      $skip: 0,
      $limit: 20,
      $sort: {
        name: 1
      }
    }
  })

  useSearch(
    adminUserQuery,
    {
      search
    },
    search
  )

  const createRows = (rows: readonly UserType[]): UserRowType[] =>
    rows.map((row) => {
      return {
        select: (
          <Checkbox
            value={selectedUsers.value.findIndex((invite) => invite.id === row.id) !== -1}
            onChange={(value) => {
              if (value) selectedUsers.merge([row])
              else selectedUsers.set((prevInvites) => prevInvites.filter((invite) => invite.id !== row.id))
            }}
          />
        ),
        id: row.id,
        name: row.name,
        avatar: <AvatarImage src={row.avatar.thumbnailResource?.url || ''} name={row.name} />,
        accountIdentifier: <AccountIdentifiers user={row} />,
        action: (
          <div className="flex items-center gap-2">
            <button
              disabled={!userHasAccess('location:write')}
              title={t('admin:components.common.view')}
              className="border-theme-primary grid h-8 w-8 rounded-full border"
              onClick={() => PopoverState.showPopupover(<AddEditUserModal user={row} />)}
            >
              <HiPencil className="text-theme-iconGreen place-self-center" />
            </button>
            <button
              disabled={user.id.value === row.id}
              title={t('admin:components.common.delete')}
              className="border-theme-primary grid h-8 w-8 rounded-full border disabled:opacity-50"
              onClick={() => PopoverState.showPopupover(<RemoveUserModal users={[row]} />)}
            >
              <HiTrash className="text-theme-iconRed place-self-center" />
            </button>
          </div>
        )
      }
    })

  return (
    <DataTable
      query={adminUserQuery}
      columns={[
        {
          id: 'select',
          label: (
            <Checkbox
              value={selectedUsers.length === adminUserQuery.data.length}
              onChange={(value) => {
                if (value) selectedUsers.set(adminUserQuery.data.slice())
                else selectedUsers.set([])
              }}
            />
          )
        },
        ...userColumns
      ]}
      rows={createRows(adminUserQuery.data)}
    />
  )
}
