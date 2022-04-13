import { getGPUTier } from 'detect-gpu'
import React, { Fragment, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Trans, useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'

import {
  ClientSettingService,
  useClientSettingState
} from '@xrengine/client-core/src/admin/services/Setting/ClientSettingService'
import WarningMessage from '@xrengine/client-core/src/common/components/WarningMessage/WarningMessage'
import ProfileMenu from '@xrengine/client-core/src/user/components/UserMenu/menus/ProfileMenu'
import { AuthService } from '@xrengine/client-core/src/user/services/AuthService'

const ROOT_REDIRECT: any = globalThis.process.env['VITE_ROOT_REDIRECT']

export const HomePage = (): any => {
  const { t } = useTranslation()
  const clientSettingState = useClientSettingState()
  const [isHardwareAccelerationEnabled, setIsHardwareAccelerationEnabled] = useState(true)
  const [clientSetting] = clientSettingState?.client?.value || []

  useEffect(() => {
    const checkGpuTier = async () => {
      const gpuTier = await getGPUTier()
      if (!gpuTier.fps && gpuTier.type == 'FALLBACK') setIsHardwareAccelerationEnabled(false)
    }
    checkGpuTier()
  }, [])
  useEffect(() => {
    AuthService.doLoginAuto(true)
  }, [])

  useEffect(() => {
    !clientSetting && ClientSettingService.fetchClientSettings()
  }, [])

  if (ROOT_REDIRECT && ROOT_REDIRECT.length > 0 && ROOT_REDIRECT !== 'false') {
    const redirectParsed = new URL(ROOT_REDIRECT)
    if (redirectParsed.protocol == null) return <Redirect to={ROOT_REDIRECT} />
    else window.location.href = ROOT_REDIRECT
  } else
    return (
      <Fragment>
        {isHardwareAccelerationEnabled ? (
          <div className="lander">
            <style>
              {`
            [class*=lander] {
                pointer-events: auto;
            }
          `}
            </style>
            <Helmet>
              <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;800&display=swap"
                rel="stylesheet"
              />
            </Helmet>
            <div className="main-background">
              <div className="img-container">
                {clientSetting?.appBackground && <img src={clientSetting.appBackground} alt="" />}
              </div>
            </div>
            <nav className="navbar">
              <div className="logo-section">
                {clientSetting?.appTitle && <object className="lander-logo" data={clientSetting.appTitle} />}
                <div className="logo-bottom">
                  {clientSetting?.appSubtitle && <span className="white-txt">{clientSetting.appSubtitle}</span>}
                </div>
              </div>
            </nav>
            <div className="main-section">
              <div className="desc">
                {clientSetting?.appDescription && (
                  <Trans t={t} i18nKey={clientSetting.appDescription}>
                    <span>{clientSetting.appDescription}</span>
                  </Trans>
                )}
              </div>
              <div className="form-container">
                <style>
                  {`
                [class*=menuPanel] {
                    position: unset;
                    bottom: 0px;
                    top: 0px;
                    left: 0px;
                    width: 100%;
                    transform: none;
                    margin: 40px 0px;
                    pointer-events: auto;
                }
              `}
                </style>
                <ProfileMenu />
              </div>
            </div>
            <div className="link-container">
              <div className="link-block">
                {clientSetting?.appSocialLinks?.length > 0 &&
                  clientSetting.appSocialLinks.map((social, index) => (
                    <a key={index} target="_blank" className="icon" href={social.link}>
                      <img src={social.icon} />
                    </a>
                  ))}
              </div>
              <div className="logo-bottom">
                {clientSetting?.appSubtitle && <span className="white-txt">{clientSetting.appSubtitle}</span>}
              </div>
            </div>
          </div>
        ) : (
          <WarningMessage setIsHardwareAccelerationEnabled={setIsHardwareAccelerationEnabled} />
        )}
      </Fragment>
    )
}

export default HomePage
