import Button from '@material-ui/core/Button'
import Snackbar from '@material-ui/core/Snackbar'
import { useAuthState } from '@xrengine/client-core/src/user/reducers/auth/AuthState'
import { isTouchAvailable } from '@xrengine/engine/src/common/functions/DetectFeatures'
import React, { Suspense, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import NetworkDebug from '../NetworkDebug'
import GameServerWarnings from './GameServerWarnings'
import EmoteMenu from '@xrengine/client-core/src/common/components/EmoteMenu'
import UserMenu from '@xrengine/client-core/src/user/components/UserMenu'
import { InteractableModal } from '@xrengine/client-core/src/world/components/InteractableModal'
import InstanceChat from '../InstanceChat'
import MediaIconsBox from '../MediaIconsBox'
import LoadingScreen from '@xrengine/client-core/src/common/components/Loader'
import { useTranslation } from 'react-i18next'
import Layout from '../Layout/Layout'
import { selectPartyState } from '@xrengine/client-core/src/social/reducers/party/selector'

const goHome = () => (window.location.href = window.location.origin)

const TouchGamepad = React.lazy(() => import('@xrengine/client-core/src/common/components/TouchGamepad'))

const mapStateToProps = (state: any) => {
  return {
    partyState: selectPartyState(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({})

interface Props {
  canvasElement: JSX.Element
  loadingItemCount
  isValidLocation
  allowDebug
  reinit
  children
  showTouchpad
  isTeleporting
  locationName
  partyState
}

const DefaultLayoutView = (props: Props) => {
  const { t } = useTranslation()
  const authState = useAuthState()
  const selfUser = authState.user
  const party = props.partyState?.get('party')
  const [harmonyOpen, setHarmonyOpen] = useState(false)

  return (
    <>
      <Layout
        pageTitle={t('location.locationName.pageTitle')}
        harmonyOpen={harmonyOpen}
        setHarmonyOpen={setHarmonyOpen}
      >
        <LoadingScreen objectsToLoad={props.loadingItemCount} />
        {!props.isValidLocation && (
          <Snackbar
            open
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
          >
            <>
              <section>Location is invalid</section>
              <Button onClick={goHome}>Return Home</Button>
            </>
          </Snackbar>
        )}

        {props.allowDebug && <NetworkDebug reinit={props.reinit} />}

        {props.children}

        {props.showTouchpad && isTouchAvailable ? (
          <Suspense fallback={<></>}>
            <TouchGamepad layout="default" />
          </Suspense>
        ) : null}

        <GameServerWarnings
          isTeleporting={props.isTeleporting}
          locationName={props.locationName}
          instanceId={selfUser?.instanceId.value ?? party?.instanceId}
        />
        {props.canvasElement}
        <InteractableModal />
        {/* <RecordingApp /> */}
        <MediaIconsBox />
        <UserMenu />
        <EmoteMenu />
        <InstanceChat />
      </Layout>
    </>
  )
}

const connector = connect(mapStateToProps, mapDispatchToProps)(DefaultLayoutView)

export default connector
