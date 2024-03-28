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

import i18n from 'i18next'
import { lazy, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { routePath, RouteType } from '@etherealengine/common/src/schema.type.module'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { defineState, getMutableState, NO_PROXY, useHookstate } from '@etherealengine/hyperflux'
import { loadRoute } from '@etherealengine/projects/loadRoute'

type SearchParamsType = { [key: string]: string }

/**
 * `pathname` state resets to null after every navigate so that only react-router maintains the actual url
 * `searchParams` state is only reset manually. previous search params are added along with the new search params
 */
export const RouterState = defineState({
  name: 'RouterState',
  initial: () => ({
    pathname: location.pathname as string | null,
    searchParams: {} as SearchParamsType
  }),
  navigate: (pathname: string, searchParams: SearchParamsType | { redirectUrl: string } = {}) => {
    getMutableState(RouterState).set({
      pathname,
      searchParams
    })
  }
})

export type CustomRoute = {
  route: string
  component: ReturnType<typeof lazy>
  props: any
}

/**
 * getCustomRoutes used to get the routes created by the user.
 */
export const getCustomRoutes = async (): Promise<CustomRoute[]> => {
  const routes = (await Engine.instance.api
    .service(routePath)
    .find({ query: { paginate: false } })) as any as RouteType[]

  const elements: CustomRoute[] = []

  if (!Array.isArray(routes) || routes == null) {
    throw new Error(i18n.t('editor:errors.fetchingRouteError', { error: i18n.t('editor:errors.unknownError') }))
  } else {
    await Promise.all(
      routes.map(async (project) => {
        const routeLazyLoad = await loadRoute(project.project, project.route)
        if (routeLazyLoad)
          elements.push({
            route: project.route,
            ...routeLazyLoad
          })
      })
    )
  }

  return elements.filter((c) => !!c)
}

export const useCustomRoutes = () => {
  const customRoutes = useHookstate([] as CustomRoute[])

  const navigate = useNavigate()
  const routerState = useHookstate(getMutableState(RouterState))

  useEffect(() => {
    getCustomRoutes().then((routes) => {
      customRoutes.set(routes)
    })
  }, [])

  useEffect(() => {
    if (!routerState.pathname.value) return

    if (location.pathname !== routerState.pathname.value) {
      const urlSearchParams = new URLSearchParams(routerState.searchParams.value)
      if (urlSearchParams.has('redirectUrl')) {
        urlSearchParams.set('hasRedirected', '1')
      }

      if (urlSearchParams.toString().length > 0) {
        navigate(`${routerState.pathname.value}?${urlSearchParams}`)
      } else {
        navigate(routerState.pathname.value)
      }
    }

    routerState.pathname.set(null)
  }, [routerState.pathname, routerState.searchParams])

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const redirectUrl = urlSearchParams.get('redirectUrl')
    const hasRedirected = urlSearchParams.get('hasRedirected')
    if (redirectUrl && !hasRedirected) {
      RouterState.navigate(redirectUrl)
    }
  }, [])

  return customRoutes.get(NO_PROXY)
}
