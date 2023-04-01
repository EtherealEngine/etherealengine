import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { API } from '@etherealengine/client-core/src/API'
import { LocationInstanceConnectionServiceReceptor } from '@etherealengine/client-core/src/common/services/LocationInstanceConnectionService'
import LoadLocationScene from '@etherealengine/client-core/src/components/World/LoadLocationScene'
// import NetworkInstanceProvisioning from '@etherealengine/client-core/src/components/World/NetworkInstanceProvisioning'
import { FriendService } from '@etherealengine/client-core/src/social/services/FriendService'
import { LocationAction } from '@etherealengine/client-core/src/social/services/LocationService'
import { AuthService } from '@etherealengine/client-core/src/user/services/AuthService'
import { SceneService } from '@etherealengine/client-core/src/world/services/SceneService'
import { MediaModule } from '@etherealengine/engine/src/audio/MediaModule'
import { EngineActions, EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { initSystems } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { MotionCaptureModule } from '@etherealengine/engine/src/mocap/MotionCaptureModule'
import {
  addActionReceptor,
  dispatchAction,
  getMutableState,
  removeActionReceptor,
  useHookstate
} from '@etherealengine/hyperflux'
import { loadEngineInjection } from '@etherealengine/projects/loadEngineInjection'
import CaptureUI from '@etherealengine/ui/src/components/tailwind/Capture'

const systems = [...MediaModule(), ...MotionCaptureModule()]

export const initializeEngineForRecorder = async () => {
  if (getMutableState(EngineState).isEngineInitialized.value) return

  const projects = API.instance.client.service('projects').find()

  await initSystems(systems)
  await loadEngineInjection(await projects)

  dispatchAction(EngineActions.initializeEngine({ initialised: true }))
  dispatchAction(EngineActions.sceneLoaded({}))
}

export const CaptureLocation = () => {
  const params = useParams()
  AuthService.useAPIListeners()
  SceneService.useAPIListeners()
  FriendService.useAPIListeners()

  const locationName = params?.locationName as string

  useEffect(() => {
    dispatchAction(LocationAction.setLocationName({ locationName }))
    initializeEngineForRecorder()

    addActionReceptor(LocationInstanceConnectionServiceReceptor)

    return () => {
      removeActionReceptor(LocationInstanceConnectionServiceReceptor)
    }
  }, [])

  const engineState = useHookstate(getMutableState(EngineState))

  if (!engineState.isEngineInitialized.value && !engineState.connectedWorld.value) return <></>

  return (
    <>
      <CaptureUI />
      {/* <NetworkInstanceProvisioning /> */}
      <LoadLocationScene />
    </>
  )
}

export default CaptureLocation
