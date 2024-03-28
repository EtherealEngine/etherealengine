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

import Badge from '@etherealengine/ui/src/primitives/tailwind/Badge'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Select from '@etherealengine/ui/src/primitives/tailwind/Select'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import { useHookstate } from '@hookstate/core'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HiOutlineRefresh } from 'react-icons/hi'
import { useServerInfoFind } from '../../../admin/services/ServerInfoQuery'
import { serverAutoRefreshOptions } from '../../common/constants/server'
import ServerTable from './ServerTable'

export default function Servers() {
  const { t } = useTranslation()
  const serverType = useHookstate('all')
  const serverInfoQuery = useServerInfoFind()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoRefresh = useHookstate('60')

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const refreshValue = parseInt(autoRefresh.value, 10)
    if (!refreshValue) return
    intervalRef.current = setInterval(serverInfoQuery.refetch, refreshValue * 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh])

  return (
    <>
      <div className="flex justify-between">
        <Text fontSize="xl" className="mb-6">
          {t('admin:components.server.servers')}
        </Text>
        <div className="flex items-center gap-2">
          <Text theme="secondary" fontSize="sm">
            {t('admin:components.server.autoRefresh')}
          </Text>
          <div className="flex items-center gap-1">
            <Button
              title={t('admin:components.common.refresh')}
              onClick={serverInfoQuery.refetch}
              startIcon={<HiOutlineRefresh />}
              variant="outline"
              className="justify-self-end border-0"
            />
            <Select
              options={serverAutoRefreshOptions}
              currentValue={autoRefresh.value}
              onChange={(value) => autoRefresh.set(value)}
            />
          </div>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {serverInfoQuery.data.map((info) => (
          <div
            key={info.id}
            className={`bg-theme-highlight flex h-16 w-44 cursor-pointer items-start justify-between rounded-2xl p-4 ${
              serverType.value === info.id && 'border-b-blue-primary border-b-2'
            }`}
            onClick={() => serverType.set(info.id)}
          >
            <Text fontSize="sm">{info.label}</Text>
            <Badge
              className="bg-blue-primary h-6 rounded-[90px] text-white"
              label={`${info.pods.filter((inf) => inf.status === 'Running').length}/${info.pods.length}`}
            />
          </div>
        ))}
      </div>
      <ServerTable serverType={serverType.value} serverInfoQuery={serverInfoQuery} />
    </>
  )
}
