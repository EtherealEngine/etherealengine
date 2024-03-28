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

// import * as chapiWalletPolyfill from 'credential-handler-polyfill'

import { SnackbarProvider } from 'notistack'
import React, { useEffect, useRef, useState } from 'react'

import { initGA, logPageView } from '@etherealengine/client-core/src/common/analytics'
import { defaultAction } from '@etherealengine/client-core/src/common/components/NotificationActions'
import { NotificationState } from '@etherealengine/client-core/src/common/services/NotificationService'
import Debug from '@etherealengine/client-core/src/components/Debug'
import { AuthService, AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { loadWebappInjection } from '@etherealengine/projects/loadWebappInjection'

import { ThemeProvider } from '@etherealengine/client-core/src/common/services/ThemeService'
import PublicRouter, { CenteredLoadingCircle } from '../route/public_tw'

import {
  AdminClientSettingsState,
  ClientSettingService
} from '@etherealengine/client-core/src/admin/services/Setting/ClientSettingService'
import { useTranslation } from 'react-i18next'
import '../themes/base.css'
import '../themes/components.css'
import '../themes/utilities.css'

const AppPage = () => {
  const authState = useHookstate(getMutableState(AuthState))
  const isLoggedIn = useHookstate(getMutableState(AuthState).isLoggedIn)
  const selfUser = authState.user
  const [projectComponents, setProjectComponents] = useState<Array<any>>([])
  const { t } = useTranslation()

  useEffect(() => {
    AuthService.doLoginAuto()
    initGA()
    logPageView()
  }, [])

  useEffect(() => {
    if (!isLoggedIn.value || projectComponents.length) return
    loadWebappInjection().then((result) => {
      setProjectComponents(result)
    })
  }, [isLoggedIn])

  useEffect(() => {
    Engine.instance.userID = selfUser.id.value
  }, [selfUser.id])

  if (!/auth\/oauth/.test(location.pathname) && !isLoggedIn.value) {
    return <CenteredLoadingCircle message={t('common:loader.loadingRoutes')} />
  }

  return (
    <>
      {projectComponents && <PublicRouter />}
      {projectComponents?.map((Component, i) => <Component key={i} />)}
    </>
  )
}

const TailwindPage = () => {
  const notistackRef = useRef<SnackbarProvider>()
  const notificationstate = useHookstate(getMutableState(NotificationState))
  const clientSettingState = useHookstate(getMutableState(AdminClientSettingsState))

  useEffect(() => {
    notificationstate.snackbar.set(notistackRef.current)
  }, [notistackRef.current])

  useEffect(() => {
    if (clientSettingState?.updateNeeded?.value) ClientSettingService.fetchClientSettings()
  }, [clientSettingState?.updateNeeded?.value])

  return (
    <>
      <ThemeProvider>
        <SnackbarProvider
          ref={notistackRef as any}
          maxSnack={7}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          action={defaultAction}
        >
          <AppPage />
          <Debug />
        </SnackbarProvider>
      </ThemeProvider>
    </>
  )
}

export default TailwindPage
