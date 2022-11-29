import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  defaultThemeModes,
  defaultThemeSettings,
  getCurrentTheme
} from '@xrengine/common/src/constants/DefaultThemeSettings'
import { ThemeMode, ThemeSetting } from '@xrengine/common/src/interfaces/ClientSetting'

import { Button } from '@mui/material'

import { useAuthState } from '../../../../user/services/AuthService'
import { ClientSettingService, useClientSettingState } from '../../../services/Setting/ClientSettingService'
import styles from '../../../styles/settings.module.scss'
import ColorSelectionArea from './ColorSelectionArea'
import DemoStyle from './DemoStyle'
import ThemePlayground from './ThemePlayground'
import ThemeSelectionArea from './ThemeSelectionArea'

const ClientTheme = () => {
  const { t } = useTranslation()

  const selfUser = useAuthState().user
  const clientSettingState = useClientSettingState()
  const [clientSetting] = clientSettingState?.client?.value || []
  const id = clientSetting?.id

  const [themeSettings, setThemeSettings] = useState<ThemeSetting>({
    ...defaultThemeSettings,
    ...clientSetting.themeSettings
  })
  const [themeModes, setThemeModes] = useState<ThemeMode>({
    ...defaultThemeModes,
    ...clientSetting.themeModes
  })
  const [selectedMode, setSelectedMode] = useState('light')

  const handleChangeColor = (name, value) => {
    const tempSetting = JSON.parse(JSON.stringify(themeSettings))

    tempSetting[selectedMode][name] = value

    setThemeSettings(tempSetting)
  }

  const handleChangeMode = (value) => {
    setSelectedMode(value)
  }

  const handleAddRemoveTheme = ({ add, remove }) => {
    const newThemes = { ...themeSettings }
    if (add) {
      newThemes[add] = themeSettings[selectedMode]
      // if (!remove)
      //   setSelectedMode(add)
    }
    if (remove) {
      delete newThemes[remove]
      // if (!add)
      //   setSelectedMode(Object.keys(themeSettings)[0])
    }
    setThemeSettings(newThemes)
  }

  const handleChangeThemeMode = (event) => {
    const { name, value } = event.target
    setThemeModes({ ...themeModes, [name]: value })
  }

  const resetThemeToDefault = async () => {
    setThemeSettings({ ...defaultThemeSettings })
    setThemeModes({ ...defaultThemeModes })

    await updateTheme(defaultThemeSettings, defaultThemeModes)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    await updateTheme(themeSettings, themeModes)
  }

  const updateTheme = async (newThemeSettings: ThemeSetting, newThemeModes: ThemeMode) => {
    await ClientSettingService.patchClientSetting(
      {
        logo: clientSetting?.logo,
        title: clientSetting?.title,
        shortTitle: clientSetting?.shortTitle,
        startPath: clientSetting?.startPath,
        icon192px: clientSetting?.icon192px,
        icon512px: clientSetting?.icon512px,
        favicon16px: clientSetting?.favicon16px,
        favicon32px: clientSetting?.favicon32px,
        siteDescription: clientSetting?.siteDescription,
        appTitle: clientSetting?.appTitle,
        appSubtitle: clientSetting?.appSubtitle,
        appDescription: clientSetting?.appDescription,
        appBackground: clientSetting?.appBackground,
        appSocialLinks: JSON.stringify(clientSetting?.appSocialLinks),
        themeSettings: JSON.stringify(newThemeSettings),
        themeModes: JSON.stringify(newThemeModes),
        key8thWall: clientSetting?.key8thWall,
        homepageLinkButtonEnabled: clientSetting?.homepageLinkButtonEnabled,
        homepageLinkButtonRedirect: clientSetting?.homepageLinkButtonRedirect,
        homepageLinkButtonText: clientSetting?.homepageLinkButtonText
      },
      id
    )

    const currentTheme = getCurrentTheme(selfUser?.user_setting?.value?.themeModes)

    if (newThemeSettings[currentTheme]) {
      for (let variable of Object.keys(newThemeSettings[currentTheme])) {
        ;(document.querySelector(`[data-theme=${currentTheme}]`) as any)?.style.setProperty(
          '--' + variable,
          newThemeSettings[currentTheme][variable]
        )
      }
    }
  }

  const handleCancel = () => {
    setThemeSettings(clientSetting?.themeSettings)
    setThemeModes(clientSetting?.themeModes)
  }

  const theme = themeSettings[selectedMode]

  return (
    <div>
      <DemoStyle theme={theme} />

      <ThemeSelectionArea
        themeModes={themeModes}
        colorModes={Object.keys(themeSettings)}
        onChangeThemeMode={handleChangeThemeMode}
      />

      <ThemePlayground />

      <ColorSelectionArea
        selectedMode={selectedMode}
        theme={theme}
        colorModes={Object.keys(themeSettings)}
        onChangeMode={handleChangeMode}
        onChangeThemes={handleAddRemoveTheme}
        onChangeColor={handleChangeColor}
      />

      <Button sx={{ maxWidth: '100%' }} className={styles.outlinedButton} onClick={handleCancel}>
        {t('admin:components.common.cancel')}
      </Button>

      <Button sx={{ maxWidth: '100%', ml: 1 }} className={styles.outlinedButton} onClick={resetThemeToDefault}>
        {t('admin:components.setting.resetTheme')}
      </Button>

      <Button sx={{ maxWidth: '100%', ml: 1 }} className={styles.gradientButton} onClick={handleSubmit}>
        {t('admin:components.common.save')}
      </Button>
    </div>
  )
}

export default ClientTheme
