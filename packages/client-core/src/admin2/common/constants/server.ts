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

import { t } from 'i18next'
import { ITableHeadCell } from '../Table'

type IdType = 'name' | 'status' | 'type' | 'currentUsers' | 'restarts' | 'age' | 'instanceId' | 'action'

export type ServerRowType = Record<IdType, string | JSX.Element | undefined>

interface IServerColumn extends ITableHeadCell {
  id: IdType
}

export const serverColumns: IServerColumn[] = [
  { id: 'name', label: t('admin:components.server.name') },
  { id: 'status', label: t('admin:components.server.status') },
  { id: 'type', label: t('admin:components.server.type') },
  { id: 'currentUsers', label: t('admin:components.server.users') },
  { id: 'restarts', label: t('admin:components.server.restarts') },
  { id: 'age', label: t('admin:components.server.age') },
  { id: 'instanceId', label: t('admin:components.server.instance') },
  { id: 'action', label: t('admin:components.server.actions') }
]

export const serverAutoRefreshOptions = [
  {
    value: '0',
    label: t('admin:components.server.none')
  },
  {
    value: '10',
    label: `10 ${t('admin:components.server.seconds')}`
  },
  {
    value: '30',
    label: `30 ${t('admin:components.server.seconds')}`
  },
  {
    value: '60',
    label: `1 ${t('admin:components.server.minute')}`
  },
  {
    value: '300',
    label: `5 ${t('admin:components.server.minutes')}`
  },
  {
    value: '600',
    label: `10 ${t('admin:components.server.minutes')}`
  }
]
