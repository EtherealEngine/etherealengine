import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Box, Grid, Typography } from '@mui/material'

import { useAuthState } from '../../../user/services/AuthService'
import InputText from '../../common/InputText'
import { AdminSettingAnalyticsService, useSettingAnalyticsState } from '../../services/Setting/AnalyticsSettingsService'
import styles from '../../styles/settings.module.scss'

const Analytics = () => {
  const settingAnalyticsState = useSettingAnalyticsState()
  const settingAnalytics = settingAnalyticsState.analytics
  const { t } = useTranslation()
  const authState = useAuthState()
  const user = authState.user
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!isMounted.current) return
    if (user?.id?.value != null && settingAnalyticsState?.updateNeeded?.value === true) {
      AdminSettingAnalyticsService.fetchSettingsAnalytics()
    }
  }, [authState?.user?.id?.value, settingAnalyticsState?.updateNeeded?.value])

  const Data = {
    id: settingAnalytics.value.map((el) => el.id),
    port: settingAnalytics.value.map((el) => el.port),
    processInterval: settingAnalytics.value.map((el) => el.processInterval)
  }

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.analytics.analytics')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={6} sm={6}>
          <InputText name="port" label={t('admin:components.analytics.port')} value={Data.port} disabled />
        </Grid>
        <Grid item xs={6} sm={6}>
          <InputText
            name="processinterval"
            label={t('admin:components.analytics.processInterval')}
            value={Data.processInterval}
            disabled
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default Analytics
