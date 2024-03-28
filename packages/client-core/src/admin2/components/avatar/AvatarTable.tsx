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

import { AvatarID, AvatarType, avatarPath } from '@etherealengine/common/src/schema.type.module'

import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import { UserName } from '@etherealengine/common/src/schema.type.module'
import { useFind, useMutation, useSearch } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import AvatarImage from '@etherealengine/ui/src/primitives/tailwind/AvatarImage'
import Toggle from '@etherealengine/ui/src/primitives/tailwind/Toggle'
import { useHookstate } from '@hookstate/core'
import { HiPencil, HiTrash } from 'react-icons/hi2'
import DataTable from '../../common/Table'
import { AvatarRowType, avatarColumns } from '../../common/constants/avatar'
import AddEditAvatarModal from './AddEditAvatarModal'
import RemoveAvatarModal from './RemoveAvatarModal'

export default function AvatarTable({ search }: { search: string }) {
  const { t } = useTranslation()
  const adminAvatarQuery = useFind(avatarPath, {
    query: {
      action: 'admin',
      $limit: 20,
      $sort: {
        name: 1
      }
    }
  })
  const adminAvatarPatch = useMutation(avatarPath).patch

  useSearch(
    adminAvatarQuery,
    {
      name: {
        $like: `%${search}%`
      }
    },
    search
  )

  const IsPublicToggle = ({ id, isPublic }: { id: AvatarID; isPublic: boolean }) => {
    const disabled = useHookstate(false)
    return (
      <Toggle
        value={isPublic}
        onChange={(value) => {
          disabled.set(true)
          adminAvatarPatch(id, { isPublic: value })
            .then(() => adminAvatarQuery.refetch())
            .catch(() => disabled.set(false))
        }}
        disabled={disabled.value}
      />
    )
  }

  const createRows = (rows: readonly AvatarType[]): AvatarRowType[] =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      user: (row.user?.name || '') as UserName,
      isPublic: <IsPublicToggle id={row.id} isPublic={row.isPublic} />,
      thumbnail: <AvatarImage src={row.thumbnailResource?.url + '?' + new Date().getTime()} className="mx-auto" />,
      action: (
        <div className="flex items-center justify-around">
          <button
            title={t('admin:components.common.view')}
            className="border-theme-primary grid h-8 w-8 rounded-full border"
            onClick={() => PopoverState.showPopupover(<AddEditAvatarModal avatar={row} />)}
          >
            <HiPencil className="text-theme-iconGreen place-self-center" />
          </button>
          <button
            title={t('admin:components.common.delete')}
            className="border-theme-primary grid h-8 w-8 rounded-full border"
            onClick={() => PopoverState.showPopupover(<RemoveAvatarModal avatar={row} />)}
          >
            <HiTrash className="text-theme-iconRed place-self-center" />
          </button>
        </div>
      )
    }))

  return <DataTable query={adminAvatarQuery} columns={avatarColumns} rows={createRows(adminAvatarQuery.data)} />
}
