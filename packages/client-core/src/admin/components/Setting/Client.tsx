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

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputSwitch from '@etherealengine/client-core/src/common/components/InputSwitch'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { NO_PROXY, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import Tooltip from '@etherealengine/ui/src/primitives/mui/Tooltip'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { AuthState } from '../../../user/services/AuthService'
import { AdminClientSettingsState, ClientSettingService } from '../../services/Setting/ClientSettingService'
import styles from '../../styles/settings.module.scss'

const Client = () => {
  const { t } = useTranslation()

  const user = useHookstate(getMutableState(AuthState).user)

  const clientSettingState = useHookstate(getMutableState(AdminClientSettingsState))
  const [clientSetting] = clientSettingState?.client?.get(NO_PROXY) || []
  const id = clientSetting?.id
  const logo = useHookstate(clientSetting?.logo)
  const title = useHookstate(clientSetting?.title)
  const shortTitle = useHookstate(clientSetting?.shortTitle)
  const startPath = useHookstate(clientSetting?.startPath || '/')
  const appTitle = useHookstate(clientSetting?.appTitle)
  const appSubtitle = useHookstate(clientSetting?.appSubtitle)
  const appDescription = useHookstate(clientSetting?.appDescription)
  const appBackground = useHookstate(clientSetting?.appBackground)
  const appSocialLinks = useHookstate(JSON.parse(JSON.stringify(clientSetting?.appSocialLinks)) || [])
  const appleTouchIcon = useHookstate(clientSetting?.appleTouchIcon)
  const icon192px = useHookstate(clientSetting?.icon192px)
  const icon512px = useHookstate(clientSetting?.icon512px)
  const favicon16px = useHookstate(clientSetting?.favicon16px)
  const favicon32px = useHookstate(clientSetting?.favicon32px)
  const webmanifestLink = useHookstate(clientSetting?.webmanifestLink)
  const swScriptLink = useHookstate(clientSetting?.swScriptLink)
  const key8thWall = useHookstate(clientSetting?.key8thWall)
  const siteDescription = useHookstate(clientSetting?.siteDescription)
  const homepageLinkButtonEnabled = useHookstate(clientSetting?.homepageLinkButtonEnabled)
  const homepageLinkButtonRedirect = useHookstate(clientSetting?.homepageLinkButtonRedirect)
  const homepageLinkButtonText = useHookstate(clientSetting?.homepageLinkButtonText)
  const privacyPolicyLink = useHookstate(clientSetting?.privacyPolicy)

  useEffect(() => {
    if (user?.id?.value != null && clientSettingState?.updateNeeded?.value === true) {
      ClientSettingService.fetchClientSettings()
    }
  }, [user?.id?.value, clientSettingState?.updateNeeded?.value])

  useEffect(() => {
    if (clientSetting) {
      logo.set(clientSetting?.logo)
      title.set(clientSetting?.title)
      shortTitle.set(clientSetting?.shortTitle)
      startPath.set(clientSetting?.startPath || '/')
      appTitle.set(clientSetting?.appTitle)
      appSubtitle.set(clientSetting?.appSubtitle)
      appDescription.set(clientSetting?.appDescription)
      appBackground.set(clientSetting?.appBackground)
      appSocialLinks.set(JSON.parse(JSON.stringify(clientSetting?.appSocialLinks)) || [])
      appleTouchIcon.set(clientSetting?.appleTouchIcon)
      icon192px.set(clientSetting?.icon192px)
      icon512px.set(clientSetting?.icon512px)
      webmanifestLink.set(clientSetting?.webmanifestLink)
      swScriptLink.set(clientSetting?.swScriptLink)
      favicon16px.set(clientSetting?.favicon16px)
      favicon32px.set(clientSetting?.favicon32px)
      siteDescription.set(clientSetting?.siteDescription)
      key8thWall.set(clientSetting?.key8thWall)
      privacyPolicyLink.set(clientSetting?.privacyPolicy)
      homepageLinkButtonEnabled.set(clientSetting?.homepageLinkButtonEnabled)
      homepageLinkButtonRedirect.set(clientSetting?.homepageLinkButtonRedirect)
      homepageLinkButtonText.set(clientSetting?.homepageLinkButtonText)
    }
  }, [clientSettingState?.updateNeeded?.value])

  const handleUpdateSocialLinks = (index, value, type) => {
    const tempAppSocialLinks = JSON.parse(JSON.stringify(appSocialLinks.value))

    tempAppSocialLinks[index][type] = value

    appSocialLinks.set(tempAppSocialLinks)
  }

  const handleAddSocialLinks = () => {
    const tempAppSocialLinks = JSON.parse(JSON.stringify(appSocialLinks.value))

    tempAppSocialLinks.push({ icon: '', link: '' })

    appSocialLinks.set(tempAppSocialLinks)
  }

  const handleRemoveSocialLinks = (index) => {
    const tempAppSocialLinks = JSON.parse(JSON.stringify(appSocialLinks.value))

    tempAppSocialLinks.splice(index, 1)

    appSocialLinks.set(tempAppSocialLinks)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    ClientSettingService.patchClientSetting(
      {
        logo: logo.value,
        title: title.value,
        shortTitle: shortTitle.value,
        startPath: startPath.value,
        appleTouchIcon: appleTouchIcon.value,
        icon192px: icon192px.value,
        icon512px: icon512px.value,
        favicon16px: favicon16px.value,
        favicon32px: favicon32px.value,
        webmanifestLink: webmanifestLink.value,
        swScriptLink: swScriptLink.value,
        siteDescription: siteDescription.value,
        appBackground: appBackground.value,
        appTitle: appTitle.value,
        appSubtitle: appSubtitle.value,
        appDescription: appDescription.value,
        appSocialLinks: appSocialLinks.value,
        themeSettings: clientSetting?.themeSettings,
        themeModes: clientSetting?.themeModes,
        key8thWall: key8thWall.value,
        privacyPolicy: privacyPolicyLink.value,
        homepageLinkButtonEnabled: homepageLinkButtonEnabled.value,
        homepageLinkButtonRedirect: homepageLinkButtonRedirect.value,
        homepageLinkButtonText: homepageLinkButtonText.value
      },
      id
    )
  }

  const handleCancel = () => {
    logo.set(clientSetting?.logo)
    title.set(clientSetting?.title)
    appTitle.set(clientSetting?.appTitle)
    appSubtitle.set(clientSetting?.appSubtitle)
    appDescription.set(clientSetting?.appDescription)
    appBackground.set(clientSetting?.appBackground)
    appSocialLinks.set(clientSetting?.appSocialLinks)
    appleTouchIcon.set(clientSetting?.appleTouchIcon)
    icon192px.set(clientSetting?.icon192px)
    icon512px.set(clientSetting?.icon512px)
    favicon16px.set(clientSetting?.favicon16px)
    favicon32px.set(clientSetting?.favicon32px)
    webmanifestLink.set(clientSetting?.webmanifestLink)
    swScriptLink.set(clientSetting?.swScriptLink)
    siteDescription.set(clientSetting?.siteDescription)
    key8thWall.set(clientSetting?.key8thWall)
    homepageLinkButtonEnabled.set(clientSetting?.homepageLinkButtonEnabled)
    homepageLinkButtonRedirect.set(clientSetting?.homepageLinkButtonRedirect)
    homepageLinkButtonText.set(clientSetting?.homepageLinkButtonText)
  }

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.client')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <InputText
            name="appTitle"
            label={t('admin:components.setting.appTitle')}
            value={appTitle.value || ''}
            onChange={(e) => appTitle.set(e.target.value)}
          />

          <InputText
            name="appSubtitle"
            label={t('admin:components.setting.appSubtitle')}
            value={appSubtitle.value || ''}
            onChange={(e) => appSubtitle.set(e.target.value)}
          />

          <InputText
            name="appDescription"
            label={t('admin:components.setting.appDescription')}
            value={appDescription.value || ''}
            onChange={(e) => appDescription.set(e.target.value)}
          />

          <InputText
            name="appBackground"
            label={t('admin:components.setting.appBackground')}
            value={appBackground.value || ''}
            onChange={(e) => appBackground.set(e.target.value)}
          />

          <InputSwitch
            name="homepageLinkButtonEnabled"
            label={t('admin:components.setting.homepageLinkButtonEnabled')}
            checked={homepageLinkButtonEnabled.value}
            onChange={(e) => homepageLinkButtonEnabled.set(e.target.checked)}
          />

          {homepageLinkButtonEnabled && (
            <InputText
              name="description"
              label={t('admin:components.setting.homepageLinkButtonRedirect')}
              value={homepageLinkButtonRedirect.value || ''}
              onChange={(e) => homepageLinkButtonRedirect.set(e.target.value)}
            />
          )}

          {homepageLinkButtonEnabled && (
            <InputText
              name="description"
              label={t('admin:components.setting.homepageLinkButtonText')}
              value={homepageLinkButtonText.value || ''}
              onChange={(e) => homepageLinkButtonText.set(e.target.value)}
            />
          )}

          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.appSocialLinks')}</Typography>

          {appSocialLinks.value?.length > 0 &&
            appSocialLinks.value?.map((socialLink, index) => (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1 }}>
                <InputText
                  sx={{ flexGrow: 1 }}
                  name="socialIcon"
                  label={t('admin:components.setting.icon')}
                  value={socialLink.icon || ''}
                  onChange={(e) => handleUpdateSocialLinks(index, e.target.value, 'icon')}
                />

                <InputText
                  sx={{ flexGrow: 1 }}
                  name="socialLink"
                  label={t('admin:components.setting.link')}
                  value={socialLink.link || ''}
                  onChange={(e) => handleUpdateSocialLinks(index, e.target.value, 'link')}
                />

                <IconButton
                  title={t('admin:components.common.delete')}
                  className={styles.iconButton}
                  onClick={() => handleRemoveSocialLinks(index)}
                  icon={<Icon type="Delete" />}
                />
              </Box>
            ))}
          <Button variant="contained" onClick={handleAddSocialLinks}>
            <Icon type="Add" /> {t('admin:components.setting.addSocialLink')}
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <InputText
            name="title"
            label={t('admin:components.setting.title')}
            value={title.value || ''}
            onChange={(e) => title.set(e.target.value)}
          />

          <div className={styles.tooltipRow}>
            <InputText
              name="shortTitle"
              label={t('admin:components.setting.shortTitle')}
              value={shortTitle.value || ''}
              onChange={(e) => shortTitle.set(e.target.value)}
            />
            <Tooltip title={t('admin:components.setting.shortTitleTooltip')} arrow>
              <Icon type="Help" />
            </Tooltip>
          </div>

          <div className={styles.tooltipRow}>
            <InputText
              name="startPath"
              label={t('admin:components.setting.startPath')}
              value={startPath.value || '/'}
              onChange={(e) => startPath.set(e.target.value)}
            />
            <Tooltip title={t('admin:components.setting.startPathTooltip')} arrow>
              <Icon type="Help" />
            </Tooltip>
          </div>

          <InputText
            name="description"
            label={t('admin:components.setting.description')}
            value={siteDescription.value || ''}
            onChange={(e) => siteDescription.set(e.target.value)}
          />

          <InputText
            name="logo"
            label={t('admin:components.setting.logo')}
            value={logo.value || ''}
            onChange={(e) => logo.set(e.target.value)}
          />

          <InputText
            name="appleTouchIcon"
            label={t('admin:components.setting.appleTouchIcon')}
            value={appleTouchIcon.value || ''}
            onChange={(e) => appleTouchIcon.set(e.target.value)}
          />

          <InputText
            name="icon192px"
            label={t('admin:components.setting.icon192px')}
            value={icon192px.value || ''}
            onChange={(e) => icon192px.set(e.target.value)}
          />

          <InputText
            name="icon512px"
            label={t('admin:components.setting.icon512px')}
            value={icon512px.value || ''}
            onChange={(e) => icon512px.set(e.target.value)}
          />

          <InputText
            name="favIcon16px"
            label={t('admin:components.setting.favIcon16px')}
            value={favicon16px.value || ''}
            onChange={(e) => favicon16px.set(e.target.value)}
          />

          <InputText
            name="favIcon32px"
            label={t('admin:components.setting.favIcon32px')}
            value={favicon32px.value || ''}
            onChange={(e) => favicon32px.set(e.target.value)}
          />

          <InputText
            name="webmanifestLink"
            label={t('admin:components.setting.webmanifestLink')}
            value={webmanifestLink.value || ''}
            onChange={(e) => webmanifestLink.set(e.target.value)}
          />

          <InputText
            name="swScriptLink"
            label={t('admin:components.setting.swScriptLink')}
            value={swScriptLink.value || ''}
            onChange={(e) => swScriptLink.set(e.target.value)}
          />

          <InputText name="url" label={t('admin:components.setting.url')} value={clientSetting?.url || ''} disabled />

          <InputText
            name="releaseName"
            label={t('admin:components.setting.releaseName')}
            value={clientSetting?.releaseName || ''}
            disabled
          />

          <InputText
            name="privacyPolicy"
            label={t('admin:components.setting.privacyPolicy')}
            value={privacyPolicyLink.value}
            onChange={(e) => privacyPolicyLink.set(e.target.value)}
          />

          <InputText
            name="key8thWall"
            label={t('admin:components.setting.key8thWall')}
            value={key8thWall.value || ''}
            onChange={(e) => key8thWall.set(e.target.value)}
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

export default Client
