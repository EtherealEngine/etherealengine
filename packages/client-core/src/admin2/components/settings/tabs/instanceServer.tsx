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

import { instanceServerSettingPath } from '@etherealengine/common/src/schema.type.module'
import { useHookstate } from '@etherealengine/hyperflux'
import { useFind } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Accordion from '@etherealengine/ui/src/primitives/tailwind/Accordion'
import Input from '@etherealengine/ui/src/primitives/tailwind/Input'
import Toggle from '@etherealengine/ui/src/primitives/tailwind/Toggle'
import React, { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HiMinus, HiPlusSmall } from 'react-icons/hi2'

const InstanceServerTab = forwardRef(({ open }: { open: boolean }, ref: React.MutableRefObject<HTMLDivElement>) => {
  const { t } = useTranslation()
  const instanceServerSettings = useFind(instanceServerSettingPath).data
  const local = useHookstate(true)

  return (
    <Accordion
      title={t('admin:components.setting.instanceServer.header')}
      subtitle={t('admin:components.setting.instanceServer.subtitle')}
      expandIcon={<HiPlusSmall />}
      shrinkIcon={<HiMinus />}
      ref={ref}
      open={open}
    >
      {instanceServerSettings.map((el) => (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <Input
            className="col-span-1"
            label={t('admin:components.setting.clientHost')}
            value={el?.clientHost || ''}
            disabled
          />

          <Input
            className="col-span-1"
            label={t('admin:components.setting.domain')}
            value={el?.domain || ''}
            disabled
          />

          <Input
            className="col-span-1"
            label={t('admin:components.setting.rtcStartPort')}
            value={el?.rtcStartPort || ''}
            disabled
          />

          <Input
            className="col-span-1"
            label={t('admin:components.setting.releaseName')}
            value={el?.releaseName || ''}
            disabled
          />

          <Input
            className="col-span-1"
            label={t('admin:components.setting.rtcEndPort')}
            value={el?.rtcEndPort || ''}
            disabled
          />

          <Input className="col-span-1" label={t('admin:components.setting.port')} value={el?.port || ''} disabled />

          <Input
            className="col-span-1"
            label={t('admin:components.setting.rtcPortBlockSize')}
            value={el?.rtcPortBlockSize || ''}
            disabled
          />

          <Input className="col-span-1" label={t('admin:components.setting.mode')} value={el?.mode || ''} disabled />

          <Input
            className="col-span-1"
            label={t('admin:components.setting.identifierDigits')}
            value={el?.identifierDigits || ''}
            disabled
          />

          <Input
            className="col-span-1"
            label={t('admin:components.setting.locationName')}
            value={el?.locationName || ''}
            disabled
          />

          <Toggle
            containerClassName="justify-start"
            label={t('admin:components.setting.local')}
            value={local.value}
            disabled
            onChange={(value) => local.set(value)}
          />
        </div>
      ))}
    </Accordion>
  )
})

export default InstanceServerTab
