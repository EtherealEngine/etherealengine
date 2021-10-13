import React, { Fragment, Suspense, useEffect } from 'react'
import { Switch, Redirect } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import PrivateRoute from '@xrengine/client/src/route/Private'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useAuthState } from '@xrengine/client-core/src/user/reducers/auth/AuthState'
import { AuthService } from '@xrengine/client-core/src/user/reducers/auth/AuthService'

const analytic = React.lazy(() => import('./pages/index'))
const avatars = React.lazy(() => import('./pages/avatars'))
const contentPacks = React.lazy(() => import('./pages/content-packs'))
const groups = React.lazy(() => import('./pages/groups'))
const instance = React.lazy(() => import('./pages/instance'))
const invites = React.lazy(() => import('./pages/invites'))
const locations = React.lazy(() => import('./pages/locations'))
const routes = React.lazy(() => import('./pages/routes'))
const scenes = React.lazy(() => import('./pages/scenes'))
const users = React.lazy(() => import('./pages/users'))
const party = React.lazy(() => import('./pages/party'))
const botSetting = React.lazy(() => import('./pages/bot'))
const realityPacks = React.lazy(() => import('./pages/reality-packs'))
// const arMedia = React.lazy(() => import('./pages/admin/social/armedia'))
// const feeds = React.lazy(() => import('./pages/admin/social/feeds'))
// const creator = React.lazy(() => import('./pages/admin/social/creator'))
const setting = React.lazy(() => import('./pages/Setting'))

interface Props {}

const ProtectedRoutes = (props: Props) => {
  const admin = useAuthState().user
  const dispatch = useDispatch()
  if (admin?.id?.value?.length > 0 && admin?.userRole?.value !== 'admin') {
    return <Redirect to="/login" />
  }

  let allowedRoutes = {
    location: false,
    user: false,
    bot: false,
    scene: false,
    party: false,
    contentPacks: false,
    groups: false,
    instance: false,
    invite: false,
    globalAvatars: false
  }
  const scopes = admin?.scopes?.value || []

  useEffect(() => {
    dispatch(AuthService.doLoginAuto(false))
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

  // let allowedRoutes = {
  //   location: false,
  //   user: false,
  //   bot: false,
  //   scene: false,
  //   party: false,
  //   contentPacks: false,
  //   groups: false,
  //   instance: false,
  //   invite: false,
  //   globalAvatars: false
  // }
  // const scopes = admin.scopes || []

  // useEffect(() => {
  //   doLoginAuto(false)
  // }, [])

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

  return (
    <Fragment>
      <Suspense
        fallback={
          <div
            style={{
              height: '100vh',
              width: '100%',
              textAlign: 'center',
              paddingTop: 'calc(50vh - 7px)'
            }}
          >
            <CircularProgress />
          </div>
        }
      >
        <Switch>
          <PrivateRoute exact path="/admin" component={analytic} />
          <PrivateRoute exact path="/admin/avatars" component={avatars} />
          <PrivateRoute exact path="/admin/content-packs" component={contentPacks} />
          <PrivateRoute exact path="/admin/groups" component={groups} />
          <PrivateRoute exact path="/admin/instance" component={instance} />
          <PrivateRoute exact path="/admin/invites" component={invites} />
          <PrivateRoute exact path="/admin/locations" component={locations} />
          <PrivateRoute exact path="/admin/routes" component={routes} />
          <PrivateRoute exact path="/admin/scenes" component={scenes} />
          <PrivateRoute exact path="/admin/parties" component={party} />
          <PrivateRoute exact path="/admin/bots" component={botSetting} />
          {/* <PrivateRoute exact path="/admin/armedia" component={arMedia} /> */}
          {/* <PrivateRoute exact path="/admin/armedia" component={arMedia} />
          <PrivateRoute exact path="/admin/feeds" component={feeds} />
          <PrivateRoute exact path="/admin/creator" component={creator} /> */}
          <PrivateRoute exact path="/admin/reality-packs" component={realityPacks} />
          <PrivateRoute exact path="/admin/settings" component={setting} />
          {/* <PrivateRoute exact path="/admin/settings" component={setting} />
          <PrivateRoute exact path="/admin/armedia" component={arMedia} />
          <PrivateRoute exact path="/admin/feeds" component={feeds} />
          <PrivateRoute exact path="/admin/creator" component={creator} /> */}
          <PrivateRoute exact path="/admin/settings" component={setting} />
          <PrivateRoute exact Path="/admin/users" component={users} />
        </Switch>
      </Suspense>
    </Fragment>
  )
}

export default ProtectedRoutes
