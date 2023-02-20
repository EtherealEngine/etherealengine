import { t } from 'i18next'
import React, { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineActions, useEngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { initSystems } from '@xrengine/engine/src/ecs/functions/SystemFunctions'
import { SceneClientModule } from '@xrengine/engine/src/scene/SceneClientModule'
import { SceneCommonModule } from '@xrengine/engine/src/scene/SceneCommonModule'
import { TransformModule } from '@xrengine/engine/src/transform/TransformModule'
import { dispatchAction } from '@xrengine/hyperflux'
import CircularProgress from '@xrengine/ui/src/CircularProgress'

import { LoadingCircle } from '../components/LoadingCircle'
import AdminSystem from '../systems/AdminSystem'
import Dashboard from '../user/components/Dashboard'
import { useAuthState } from '../user/services/AuthService'
import Analytics from './components/Analytics'

const $allowed = lazy(() => import('@xrengine/client-core/src/admin/allowedRoutes'))

const AdminSystemInjection = {
  uuid: 'core.admin.AdminSystem',
  type: 'PRE_RENDER',
  systemLoader: () => Promise.resolve({ default: AdminSystem })
} as const

const ProtectedRoutes = () => {
  const admin = useAuthState().user

  let allowedRoutes = {
    analytics: false,
    location: false,
    user: false,
    bot: false,
    scene: false,
    party: false,
    groups: false,
    instance: false,
    invite: false,
    globalAvatars: false,
    static_resource: false,
    benchmarking: false,
    routes: false,
    projects: false,
    settings: false,
    server: false
  }
  const scopes = admin?.scopes?.value || []

  useEffect(() => {
    initSystems(Engine.instance.currentWorld, [
      ...TransformModule(),
      ...SceneCommonModule(),
      ...SceneClientModule(),
      ...AvatarCommonModule(),
      ...AvatarClientModule(),
      AdminSystemInjection
    ]).then(async () => {
      dispatchAction(EngineActions.initializeEngine({ initialised: true }))
    })
  }, [])

  scopes.forEach((scope) => {
    if (Object.keys(allowedRoutes).includes(scope.type.split(':')[0])) {
      if (scope.type.split(':')[1] === 'read') {
        allowedRoutes = {
          ...allowedRoutes,
          [scope.type.split(':')[0]]: true
        }
      }
    }
  })

  if (admin?.id?.value?.length! > 0 && !admin?.scopes?.value?.find((scope) => scope.type === 'admin:admin')) {
    return <Navigate to={{ pathname: '/' }} />
  }

  return (
    <Dashboard>
      <Suspense fallback={<LoadingCircle message={t('common:loader.loadingAdmin')} />}>
        <Routes>
          <Route path="/*" element={<$allowed allowedRoutes={allowedRoutes} />} />
          {<Route path="/" element={<Analytics />} />}
        </Routes>
      </Suspense>
    </Dashboard>
  )
}

export default ProtectedRoutes
