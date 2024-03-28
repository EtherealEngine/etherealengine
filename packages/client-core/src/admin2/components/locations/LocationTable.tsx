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

import { LocationType, SceneID, locationPath } from '@etherealengine/common/src/schema.type.module'

import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import { useFind, useSearch } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Badge from '@etherealengine/ui/src/primitives/tailwind/Badge'
import { HiPencil, HiTrash } from 'react-icons/hi2'
import { userHasAccess } from '../../../user/userHasAccess'
import DataTable from '../../common/Table'
import { LocationRowType, locationColumns } from '../../common/constants/location'
import AddEditLocationModal from './AddEditLocationModal'
import RemoveLocationModal from './RemoveLocationModal'

const transformLink = (link: string) => link.toLowerCase().replace(' ', '-')

export default function LocationTable({ search }: { search: string }) {
  const { t } = useTranslation()

  const adminLocationQuery = useFind(locationPath, {
    query: {
      action: 'admin',
      $limit: 20,
      $sort: {
        name: 1
      }
    }
  })

  useSearch(
    adminLocationQuery,
    {
      name: {
        $like: `%${search}%`
      },
      sceneId: {
        $like: `%${search}%` as SceneID
      }
    },
    search
  )

  const createRows = (rows: readonly LocationType[]): LocationRowType[] =>
    rows.map((row) => ({
      name: <a href={`/location/${transformLink(row.name)}`}>{row.name}</a>,
      sceneId: <a href={`/studio/${row.sceneId.split('/')[0]}`}>{row.sceneId}</a>,
      maxUsersPerInstance: row.maxUsersPerInstance.toString(),
      scene: row.slugifiedName,
      locationType: row.locationSetting.locationType,
      tags: (
        <>
          {row.isFeatured ? <Badge label={t('admin:components.location.featured')} /> : null}{' '}
          {row.isLobby ? <Badge label={t('admin:components.location.isLobby')} /> : null}
        </>
      ),
      videoEnabled: row.locationSetting.videoEnabled
        ? t('admin:components.common.yes')
        : t('admin:components.common.no'),
      action: (
        <div className="flex items-center justify-around">
          <button
            disabled={!userHasAccess('location:write')}
            title={t('admin:components.common.view')}
            className="border-theme-primary grid h-8 w-8 rounded-full border"
            onClick={() => PopoverState.showPopupover(<AddEditLocationModal location={row} />)}
          >
            <HiPencil className="text-theme-iconGreen place-self-center" />
          </button>
          <button
            title={t('admin:components.common.delete')}
            className="border-theme-primary grid h-8 w-8 rounded-full border"
            onClick={() => PopoverState.showPopupover(<RemoveLocationModal location={row} />)}
          >
            <HiTrash className="text-theme-iconRed place-self-center" />
          </button>
        </div>
      )
    }))

  return <DataTable query={adminLocationQuery} columns={locationColumns} rows={createRows(adminLocationQuery.data)} />
}
