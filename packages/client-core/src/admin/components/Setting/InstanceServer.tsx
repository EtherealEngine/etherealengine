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

import InputSwitch from '@etherealengine/client-core/src/common/components/InputSwitch'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { instanceServerSettingPath } from '@etherealengine/common/src/schema.type.module'
import { useFind } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import styles from '../../styles/settings.module.scss'

const InstanceServer = () => {
  const { t } = useTranslation()
  const instanceServerSettings = useFind(instanceServerSettingPath).data
  const local = useHookstate(true)

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.instanceServer.header')}
      </Typography>
      {instanceServerSettings.map((el) => (
        <Grid container spacing={3} key={el?.id || ''}>
          <Grid item xs={12} sm={6}>
            <InputText
              name="clientHost"
              label={t('admin:components.setting.clientHost')}
              value={el?.clientHost || ''}
              disabled
            />

            <InputText
              name="rtcStartPort"
              label={t('admin:components.setting.rtcStartPort')}
              value={el?.rtcStartPort || ''}
              disabled
            />

            <InputText
              name="rtcEndPort"
              label={t('admin:components.setting.rtcEndPort')}
              value={el?.rtcEndPort || ''}
              disabled
            />

            <InputText
              name="rtcPortBlockSize"
              label={t('admin:components.setting.rtcPortBlockSize')}
              value={el?.rtcPortBlockSize || ''}
              disabled
            />

            <InputText
              name="identifierDigits"
              label={t('admin:components.setting.identifierDigits')}
              value={el?.identifierDigits || ''}
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <InputText name="domain" label={t('admin:components.setting.domain')} value={el?.domain || ''} disabled />

            <InputText
              name="releaseName"
              label={t('admin:components.setting.releaseName')}
              value={el?.releaseName || ''}
              disabled
            />

            <InputText name="port" label={t('admin:components.setting.port')} value={el?.port || ''} disabled />

            <InputText name="mode" label={t('admin:components.setting.mode')} value={el?.mode || ''} disabled />

            <InputText
              name="locationName"
              label={t('admin:components.setting.locationName')}
              value={el?.locationName || ''}
              disabled
            />

            <InputSwitch
              name="local"
              label={t('admin:components.setting.local')}
              checked={local.value}
              disabled
              onChange={(event) => local.set(event.target.checked)}
            />
          </Grid>
        </Grid>
      ))}
    </Box>
  )
}

export default InstanceServer
