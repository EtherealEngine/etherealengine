import { Icon } from '@iconify/react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Grid, Paper, Typography } from '@mui/material'
import Switch from '@mui/material/Switch'

import { useAuthState } from '../../../user/services/AuthService'
import InputText from '../../common/InputText'
import { ServerSettingService, useServerSettingState } from '../../services/Setting/ServerSettingService'
import styles from '../../styles/settings.module.scss'

interface serverProps {}

const Server = (props: serverProps) => {
  const serverSettingState = useServerSettingState()
  const [serverSetting] = serverSettingState?.server?.value || []
  const id = serverSetting?.id
  const [gaTrackingId, setGaTrackingId] = useState(serverSetting?.gaTrackingId)
  const [gitPem, setGitPem] = useState(serverSetting?.gitPem)
  const { t } = useTranslation()

  useEffect(() => {
    if (serverSetting) {
      setGaTrackingId(serverSetting?.gaTrackingId)
      setGitPem(serverSetting?.gitPem)
    }
  }, [serverSettingState?.updateNeeded?.value])

  const [dryRun, setDryRun] = useState({
    checkedA: true,
    checkedB: true
  })
  const [local, setLocal] = useState({
    checkedA: true,
    checkedB: true
  })

  const authState = useAuthState()
  const user = authState.user

  const handleDryRun = (event) => {
    setDryRun({ ...dryRun, [event.target.name]: event.target.checked })
  }

  const handleLocal = (event) => {
    setLocal({ ...local, [event.target.name]: event.target.checked })
  }

  const handleSave = (event) => {
    event.preventDefault()
    ServerSettingService.patchServerSetting({ gaTrackingId: gaTrackingId, gitPem: gitPem }, id)
  }

  const handleCancel = () => {
    setGaTrackingId(serverSetting?.gaTrackingId)
    setGitPem(serverSetting?.gitPem)
  }

  useEffect(() => {
    if (user?.id?.value != null && serverSettingState?.updateNeeded?.value === true) {
      ServerSettingService.fetchServerSettings()
    }
  }, [authState?.user?.id?.value, serverSettingState?.updateNeeded?.value])

  return (
    <form onSubmit={handleSave}>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.server')}
      </Typography>
      <Grid container spacing={3} key={serverSetting?.id || ''}>
        <Grid item xs={12} sm={6}>
          <InputText
            name="mode"
            label={t('admin:components.setting.mode')}
            value={serverSetting?.mode || 'test'}
            disabled
          />

          <InputText
            name="hostName"
            label={t('admin:components.setting.hostName')}
            value={serverSetting?.hostname || 'test'}
            disabled
          />

          <InputText
            name="port"
            label={t('admin:components.setting.port')}
            value={serverSetting?.port || ''}
            disabled
          />

          <InputText
            name="clientHost"
            label={t('admin:components.setting.clientHost')}
            value={serverSetting?.clientHost || ''}
            disabled
          />

          <InputText
            name="rootDir"
            label={t('admin:components.setting.rootDirectory')}
            value={serverSetting?.rootDir || ''}
            disabled
          />

          <InputText
            name="publicDir"
            label={t('admin:components.setting.publicDirectory')}
            value={serverSetting?.publicDir || ''}
            disabled
          />

          <InputText
            name="nodeModulesDir"
            label={t('admin:components.setting.nodeModulesDirectory')}
            value={serverSetting?.nodeModulesDir || ''}
            disabled
          />

          <InputText
            name="localStorageProvider"
            label={t('admin:components.setting.localStorageProvider')}
            value={serverSetting?.localStorageProvider || ''}
            disabled
          />

          <label> {t('admin:components.setting.performDryRun')}</label>
          <Paper component="div" className={styles.createInput}>
            <Switch
              disabled
              checked={dryRun.checkedB}
              onChange={handleDryRun}
              color="primary"
              name="checkedB"
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <InputText
            name="storageProvider"
            label={t('admin:components.setting.storageProvider')}
            value={serverSetting?.storageProvider || ''}
            disabled
          />

          <InputText
            name="gaTrackingId"
            label={t('admin:components.setting.googleAnalyticsTrackingId')}
            value={gaTrackingId || ''}
            startAdornment={<Icon style={{ marginRight: 8 }} fontSize={18} icon="emojione:key" />}
            onChange={(e) => setGaTrackingId(e.target.value)}
          />

          <InputText
            name="hub"
            label={t('admin:components.setting.hub')}
            value={serverSetting?.hub?.endpoint || ''}
            disabled
          />

          <InputText
            name="hub"
            label={t('admin:components.setting.hub')}
            value={serverSetting?.hub?.endpoint || ''}
            disabled
          />

          <InputText name="paginateDefault" label={t('admin:components.setting.paginateDefault')} value="10" disabled />

          <InputText
            name="paginateMax"
            label={t('admin:components.setting.paginateMax')}
            value={serverSetting?.paginate || ''}
            disabled
          />

          <InputText name="url" label={t('admin:components.setting.url')} value={serverSetting?.url || ''} disabled />

          <InputText
            name="certPath"
            label={t('admin:components.setting.certPath')}
            value={serverSetting?.certPath || ''}
            disabled
          />

          <InputText
            name="keyPath"
            label={t('admin:components.setting.keyPath')}
            value={serverSetting?.keyPath || ''}
            disabled
          />

          <InputText
            name="githubPrivateKey"
            label={t('admin:components.setting.githubPrivateKey')}
            value={gitPem || ''}
            onChange={(e) => setGitPem(e.target.value)}
          />

          <label> {t('admin:components.setting.local')} </label>
          <Paper component="div" className={styles.createInput}>
            <Switch
              disabled
              checked={local.checkedB}
              onChange={handleLocal}
              color="primary"
              name="checkedB"
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
          </Paper>

          <InputText
            name="releaseName"
            label={t('admin:components.setting.releaseName')}
            value={serverSetting?.releaseName || ''}
            disabled
          />
        </Grid>
      </Grid>
      <Button sx={{ maxWidth: '100%' }} variant="outlined" className={styles.cancelButton} onClick={handleCancel}>
        {t('admin:components.setting.cancel')}
      </Button>
      &nbsp; &nbsp;
      <Button sx={{ maxWidth: '100%' }} variant="contained" className={styles.saveBtn} type="submit">
        {t('admin:components.setting.save')}
      </Button>
    </form>
  )
}

export default Server
