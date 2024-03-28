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

import { Icon } from '@iconify/react'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputSwitch from '@etherealengine/client-core/src/common/components/InputSwitch'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { UserName, emailSettingPath } from '@etherealengine/common/src/schema.type.module'
import { useFind, useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import styles from '../../styles/settings.module.scss'

const Email = () => {
  const { t } = useTranslation()
  const emailSetting = useFind(emailSettingPath).data.at(0)
  const id = emailSetting?.id
  const showPassword = useHookstate(false)
  const smsNameCharacterLimit = useHookstate(emailSetting?.smsNameCharacterLimit)
  const smtp = useHookstate(emailSetting?.smtp)
  const auth = useHookstate(emailSetting?.smtp?.auth)
  const from = useHookstate(emailSetting?.from)
  const subject = useHookstate(emailSetting?.subject)

  const patchEmailSetting = useMutation(emailSettingPath).patch

  const handleSmtpSecure = (event) => {
    smtp.set({ ...JSON.parse(JSON.stringify(smtp.value)), secure: event.target.checked })
  }

  const handleUpdateSmtp = (event, type) => {
    smtp.set({
      ...JSON.parse(JSON.stringify(smtp.value)),
      [type]: event.target.value
    })
  }

  const handleUpdateAuth = (event, type) => {
    auth.set({
      ...JSON.parse(JSON.stringify(auth.value)),
      [type]: event.target.value
    })
  }

  const handleUpdateSubject = (event, type) => {
    subject.set({
      ...JSON.parse(JSON.stringify(subject.value)),
      [type]: event.target.value
    })
  }

  useEffect(() => {
    if (emailSetting) {
      smtp.set(emailSetting?.smtp)
      auth.set(emailSetting?.smtp?.auth)
      subject.set(emailSetting?.subject)
      from.set(emailSetting?.from)
    }
  }, [emailSetting])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!id || !smtp.value || !auth.value || !from.value || !subject.value) return

    patchEmailSetting(id, {
      smtp: { ...smtp.value, auth: auth.value },
      from: from.value,
      subject: subject.value
    })
  }

  const handleCancel = () => {
    smtp.set(emailSetting?.smtp)
    auth.set(emailSetting?.smtp?.auth)
    subject.set(emailSetting?.subject)
    from.set(emailSetting?.from)
    smsNameCharacterLimit.set(emailSetting?.smsNameCharacterLimit)
  }

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.email.header')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.smtp')}</Typography>

          <InputText
            name="host"
            label={t('admin:components.setting.host')}
            value={smtp?.value?.host || ''}
            onChange={(e) => handleUpdateSmtp(e, 'host')}
          />

          <InputText
            name="port"
            label={t('admin:components.setting.port')}
            value={smtp?.value?.port || ''}
            onChange={(e) => handleUpdateSmtp(e, 'port')}
          />

          <InputSwitch
            name="email"
            label={t('admin:components.setting.secure')}
            checked={smtp?.value?.secure || false}
            onChange={handleSmtpSecure}
          />

          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.auth')}</Typography>

          <InputText
            name={'user' as UserName}
            label={t('admin:components.setting.userName')}
            value={auth?.value?.user || ''}
            onChange={(e) => handleUpdateAuth(e, 'user')}
          />

          <InputText
            name="pass"
            label={t('admin:components.setting.password')}
            value={auth?.value?.pass || ''}
            type={showPassword.value ? 'text' : 'password'}
            endAdornment={
              <IconButton
                onClick={() => showPassword.set(!showPassword.value)}
                icon={
                  <Icon
                    icon={showPassword.value ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                    color="orange"
                  />
                }
              />
            }
            onChange={(e) => handleUpdateAuth(e, 'pass')}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.from')}</Typography>

          <InputText
            name="from"
            label={t('admin:components.setting.from')}
            value={from?.value || ''}
            onChange={(e) => from.set(e.target.value)}
          />

          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.subject')}</Typography>

          <InputText
            name="login"
            label={t('admin:components.setting.login')}
            value={subject?.value?.login || ''}
            onChange={(e) => handleUpdateSubject(e, 'login')}
          />

          <InputText
            name="friend"
            label={t('admin:components.setting.friend')}
            value={subject?.value?.friend || ''}
            onChange={(e) => handleUpdateSubject(e, 'friend')}
          />

          <InputText
            name="channel"
            label={t('admin:components.setting.channel')}
            value={subject?.value?.channel || ''}
            onChange={(e) => handleUpdateSubject(e, 'channel')}
          />

          <InputText
            name="smsNameCharacterLimit"
            label={t('admin:components.setting.smsNameCharLimit')}
            value={smsNameCharacterLimit?.value}
            disabled
          />
        </Grid>
      </Grid>
      <Button sx={{ maxWidth: '100%' }} className={styles.outlinedButton} onClick={handleCancel}>
        {t('admin:components.common.cancel')}
      </Button>
      <Button sx={{ maxWidth: '100%', ml: 1 }} className={styles.gradientButton} onClick={handleSubmit}>
        {t('admin:components.common.save')}
      </Button>
    </Box>
  )
}

export default Email
