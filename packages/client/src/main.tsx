import { t } from 'i18next'
import React, { lazy, Suspense, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import ErrorBoundary from '@etherealengine/client-core/src/common/components/ErrorBoundary'
import { LoadingCircle } from '@etherealengine/client-core/src/components/LoadingCircle'

// @ts-ignore

;(globalThis as any).process = { env: { ...(import.meta as any).env, APP_ENV: (import.meta as any).env.MODE } }

const Engine = lazy(() => import('./engine'))

const AppPage = lazy(() => import('./pages/_app'))
const AdminPage = lazy(() => import('./pages/admin'))
const TailwindPage = lazy(() => import('./pages/_app_tw'))
const ChatPage = lazy(() => import('./pages/chat/chat'))

const options = {
  immediate: true,
  onNeedRefresh: () => {
    console.log('onNeedRefresh')
  },
  onOfflineReady: () => {
    console.log('onOfflineReady')
  },
  onRegistered: () => {
    console.log('onRegistered')
  },
  onRegisteredSW: (swUrl, registration) => {
    // eslint-disable-next-line no-console
    console.log(`Service Worker at: ${swUrl}`)
  },
  onRegisterError: (e) => {
    console.log('onRegisterError', e)
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            key={'default'}
            path={'/*'}
            element={
              <Suspense fallback={<LoadingCircle message={t('common:loader.starting')} />}>
                <Engine>
                  <AppPage />
                </Engine>
              </Suspense>
            }
          />
          <Route
            key={'admin'}
            path={'/admin/*'}
            element={
              <Suspense fallback={<LoadingCircle message={t('common:loader.starting')} />}>
                <Engine>
                  <AdminPage />
                </Engine>
              </Suspense>
            }
          />
          <Route
            key={'capture'}
            path={'/capture/*'}
            element={
              <Suspense fallback={<LoadingCircle message={t('common:loader.starting')} />}>
                <TailwindPage />
              </Suspense>
            }
          />
          <Route
            key={'chat'}
            path={'/chat/*'}
            element={
              <Suspense fallback={<LoadingCircle message={t('common:loader.starting')} />}>
                <ChatPage />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)
