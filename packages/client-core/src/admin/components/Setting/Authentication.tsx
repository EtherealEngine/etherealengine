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

import { AuthenticationSettingType, authenticationSettingPath } from '@etherealengine/common/src/schema.type.module'
import { useFind, useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import { initialAuthState } from '../../../common/initialAuthState'
import { NotificationService } from '../../../common/services/NotificationService'
import styles from '../../styles/settings.module.scss'

const OAUTH_TYPES = {
  DISCORD: 'discord',
  FACEBOOK: 'facebook',
  GITHUB: 'github',
  GOOGLE: 'google',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter'
}

const Account = () => {
  const { t } = useTranslation()

  const authSetting = useFind(authenticationSettingPath).data.at(0) as AuthenticationSettingType
  const id = authSetting?.id
  const state = useHookstate(initialAuthState)
  const holdAuth = useHookstate(initialAuthState)
  const keySecret = useHookstate({
    discord: authSetting?.oauth?.discord,
    github: authSetting?.oauth?.github,
    google: authSetting?.oauth?.google,
    twitter: authSetting?.oauth?.twitter,
    linkedin: authSetting?.oauth?.linkedin,
    facebook: authSetting?.oauth?.facebook
  })
  const showPassword = useHookstate({
    discord: {
      key: false,
      secret: false
    },
    facebook: {
      key: false,
      secret: false
    },
    github: {
      key: false,
      secret: false
    },
    google: {
      key: false,
      secret: false
    },
    linkedin: {
      key: false,
      secret: false
    },
    twitter: {
      key: false,
      secret: false
    }
  })
  const patchAuthSettings = useMutation(authenticationSettingPath).patch

  const handleShowPassword = (key) => {
    const [social, value] = key.split('-')
    showPassword.set({
      ...JSON.parse(JSON.stringify(showPassword.value)),
      [social]: {
        ...JSON.parse(JSON.stringify(showPassword[social].value)),
        [value]: !JSON.parse(JSON.stringify(showPassword[social][value].value))
      }
    })
  }

  useEffect(() => {
    if (authSetting) {
      const tempAuthState = { ...initialAuthState }
      authSetting?.authStrategies?.forEach((el) => {
        Object.entries(el).forEach(([strategyName, strategy]) => {
          tempAuthState[strategyName] = strategy
        })
      })
      state.set(tempAuthState)
      holdAuth.set(tempAuthState)

      const tempKeySecret = JSON.parse(
        JSON.stringify({
          discord: authSetting?.oauth?.discord,
          github: authSetting?.oauth?.github,
          google: authSetting?.oauth?.google,
          twitter: authSetting?.oauth?.twitter,
          linkedin: authSetting?.oauth?.linkedin,
          facebook: authSetting?.oauth?.facebook
        })
      )
      keySecret.set(tempKeySecret)
    }
  }, [authSetting])

  const handleSubmit = () => {
    const auth = Object.keys(state.value)
      .filter((item) => (state[item].value ? item : null))
      .filter(Boolean)
      .map((prop) => ({ [prop]: state[prop].value }))

    const oauth = { ...authSetting.oauth, ...keySecret.value }

    for (const key of Object.keys(oauth)) {
      oauth[key] = JSON.parse(JSON.stringify(oauth[key]))
    }

    patchAuthSettings(id, { authStrategies: auth, oauth: oauth })
    NotificationService.dispatchNotify(t('admin:components.setting.authSettingsRefreshNotification'), {
      variant: 'warning'
    })
  }

  const handleCancel = () => {
    const temp = { ...initialAuthState }
    authSetting?.authStrategies?.forEach((el) => {
      Object.entries(el).forEach(([strategyName, strategy]) => {
        temp[strategyName] = strategy
      })
    })

    const tempKeySecret = JSON.parse(
      JSON.stringify({
        discord: authSetting?.oauth?.discord,
        github: authSetting?.oauth?.github,
        google: authSetting?.oauth?.google,
        twitter: authSetting?.oauth?.twitter,
        linkedin: authSetting?.oauth?.linkedin,
        facebook: authSetting?.oauth?.facebook
      })
    )
    keySecret.set(tempKeySecret)
    state.set(temp)
  }

  const handleOnChangeKey = (event, type) => {
    keySecret.set({
      ...JSON.parse(JSON.stringify(keySecret.value)),
      [type]: {
        ...JSON.parse(JSON.stringify(keySecret[type].value)),
        key: event.target.value
      }
    })
  }

  const handleOnChangeSecret = (event, type) => {
    keySecret.set({
      ...JSON.parse(JSON.stringify(keySecret.value)),
      [type]: {
        ...JSON.parse(JSON.stringify(keySecret[type].value)),
        secret: event.target.value
      }
    })
  }

  const onSwitchHandle = (event) => {
    state.set({ ...JSON.parse(JSON.stringify(state.value)), [event.target.name]: event.target.checked })
  }

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.authentication.header')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={6}>
          <InputText
            name="service"
            label={t('admin:components.setting.service')}
            value={authSetting?.service || ''}
            disabled
          />

          <InputText
            name="secret"
            label={t('admin:components.setting.secret')}
            value={authSetting?.secret || ''}
            disabled
          />

          <InputText
            name="entity"
            label={t('admin:components.setting.entity')}
            value={authSetting?.entity || ''}
            disabled
          />
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.authStrategies')}</Typography>

          <Grid container>
            <Grid item xs={12} sm={6} md={6}>
              {Object.keys(state.value)
                .splice(0, Math.ceil(Object.keys(state.value).length / 2))
                .map((strategyName, i) => (
                  <InputSwitch
                    key={i}
                    name={strategyName}
                    label={strategyName}
                    checked={state[strategyName].value}
                    disabled={strategyName === 'jwt'}
                    onChange={onSwitchHandle}
                  />
                ))}
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              {Object.keys(state.value)
                .splice(
                  Object.keys(state.value).length % 2 === 1
                    ? -Math.ceil(Object.keys(state.value).length / 2) + 1
                    : -Math.ceil(Object.keys(state.value).length / 2)
                )
                .map((strategyName, i) => (
                  <InputSwitch
                    key={i}
                    name={strategyName}
                    label={strategyName}
                    checked={state[strategyName].value}
                    disabled={strategyName === 'jwt'}
                    onChange={onSwitchHandle}
                  />
                ))}
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={12}>
          <Typography component="h1" className={styles.settingsHeading}>
            {t('admin:components.setting.oauth')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.defaults')}</Typography>

          <InputText
            name="host"
            label={t('admin:components.setting.host')}
            value={authSetting?.oauth?.defaults?.host || ''}
            disabled
          />

          <InputText
            name="protocol"
            label={t('admin:components.setting.protocol')}
            value={authSetting?.oauth?.defaults?.protocol || ''}
            disabled
          />

          {holdAuth?.discord?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.discord')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.discord?.key || ''}
                type={showPassword.value.discord.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('discord-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.discord.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.DISCORD)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.discord?.secret || ''}
                type={showPassword.value.discord.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('discord-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.discord.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.DISCORD)}
              />

              <InputText
                name="callbackGithub"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.discord || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.facebook?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.facebook')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.facebook?.key || ''}
                type={showPassword.value.facebook.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('facebook-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.facebook.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.FACEBOOK)}
              />

              <InputText
                name="key"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.facebook?.secret || ''}
                type={showPassword.value.facebook.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('facebook-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.facebook.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.FACEBOOK)}
              />

              <InputText
                name="callbackFacebook"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.facebook || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.github?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.github')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.github?.key || ''}
                type={showPassword.value.github.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('github-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.github.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.GITHUB)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.github?.secret || ''}
                type={showPassword.value.github.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('github-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.github.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.GITHUB)}
              />

              <InputText
                name="callbackGithub"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.github || ''}
                disabled
              />
            </>
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          {holdAuth?.google.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.google')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.google?.key || ''}
                type={showPassword.value.google.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('google-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.google.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.GOOGLE)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.google?.secret || ''}
                type={showPassword.value.google.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('google-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.google.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.GOOGLE)}
              />

              <InputText
                name="callbackGoogle"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.google || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.linkedin?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.linkedIn')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.linkedin?.key || ''}
                type={showPassword.value.linkedin.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('linkedin-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.linkedin.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.LINKEDIN)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.linkedin?.secret || ''}
                type={showPassword.value.linkedin.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('linkedin-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.linkedin.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.LINKEDIN)}
              />

              <InputText
                name="callbackLinkedin"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.linkedin || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.twitter?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.twitter')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.twitter?.key || ''}
                type={showPassword.value.twitter.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('twitter-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.twitter.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.TWITTER)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.twitter?.secret || ''}
                type={showPassword.value.twitter.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('twitter-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.twitter.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.TWITTER)}
              />

              <InputText
                name="callbackTwitter"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.twitter || ''}
                disabled
              />
            </>
          )}
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

export default Account
