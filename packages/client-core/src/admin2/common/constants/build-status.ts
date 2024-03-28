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

type IdType = 'id' | 'status' | 'dateStarted' | 'dateEnded' | 'logs' | 'commitSHA'

export type BuildStatusRowType = Record<IdType, string | JSX.Element | undefined>

interface IBuildStatusColumn extends ITableHeadCell {
  id: IdType
}

export const buildStatusColumns: IBuildStatusColumn[] = [
  { id: 'id', label: t('admin:components.buildStatus.columns.id') },
  { id: 'status', label: t('admin:components.buildStatus.columns.status') },
  { id: 'commitSHA', label: t('admin:components.buildStatus.columns.commitSHA') },
  { id: 'logs', label: t('admin:components.buildStatus.columns.logs') },
  { id: 'dateStarted', label: t('admin:components.buildStatus.columns.dateStarted'), sortable: true },
  { id: 'dateEnded', label: t('admin:components.buildStatus.columns.dateEnded'), sortable: true }
]
