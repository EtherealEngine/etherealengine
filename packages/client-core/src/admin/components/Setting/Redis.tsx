import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Paper, Typography } from '@mui/material'
import Switch from '@mui/material/Switch'

import { useAuthState } from '../../../user/services/AuthService'
import InputText from '../../common/InputText'
import { useAdminRedisSettingState } from '../../services/Setting/AdminRedisSettingService'
import { AdminRedisSettingService } from '../../services/Setting/AdminRedisSettingService'
import styles from '../../styles/settings.module.scss'

interface Props {}

const Redis = (props: Props) => {
  const redisSettingState = useAdminRedisSettingState()
  const [redisSetting] = redisSettingState?.redisSettings?.value || []
  const [enabled, setEnabled] = React.useState({
    checkedA: true,
    checkedB: true
  })
  const authState = useAuthState()
  const user = authState.user
  const { t } = useTranslation()

  useEffect(() => {
    if (user?.id?.value != null && redisSettingState?.updateNeeded?.value) {
      AdminRedisSettingService.fetchRedisSetting()
    }
  }, [authState?.user?.id?.value, redisSettingState?.updateNeeded?.value])

  const handleEnable = (event) => {
    setEnabled({ ...enabled, [event.target.name]: event.target.checked })
  }

  return (
    <div>
      <form>
        <Typography component="h1" className={styles.settingsHeading}>
          {t('admin:components.setting.redis')}
        </Typography>
        <label>{t('admin:components.setting.enabled')}</label>
        <Paper component="div" className={styles.createInput}>
          <Switch
            disabled
            checked={enabled.checkedB}
            onChange={handleEnable}
            color="primary"
            name="checkedB"
            inputProps={{ 'aria-label': 'primary checkbox' }}
          />
        </Paper>
        <br />

        <InputText
          name="address"
          label={t('admin:components.setting.address')}
          value={redisSetting?.address || ''}
          disabled
        />

        <InputText name="port" label={t('admin:components.setting.port')} value={redisSetting?.port || ''} disabled />

        <InputText
          name="password"
          label={t('admin:components.setting.password')}
          value={redisSetting?.password || ''}
          disabled
        />
      </form>
    </div>
  )
}

export default Redis
