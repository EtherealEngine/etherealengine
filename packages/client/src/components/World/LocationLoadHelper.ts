import { GeneralStateList, AppAction } from '@xrengine/client-core/src/common/reducers/app/AppActions'
import { client } from '@xrengine/client-core/src/feathers'
import { Config } from '@xrengine/common/src/config'
import { getLobby, getLocationByName } from '@xrengine/client-core/src/social/reducers/location/service'
import Store from '@xrengine/client-core/src/store'
import { getPortalDetails } from '@xrengine/client-core/src/world/functions/getPortalDetails'
import { setCurrentScene } from '@xrengine/client-core/src/world/reducers/scenes/actions'
import { testScenes } from '@xrengine/common/src/assets/testScenes'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { InitializeOptions } from '@xrengine/engine/src/initializationOptions'
import { initializeEngine } from '@xrengine/engine/src/initializeEngine'
import { Network } from '@xrengine/engine/src/networking/classes/Network'
import { MessageTypes } from '@xrengine/engine/src/networking/enums/MessageTypes'
import { PortalComponent } from '@xrengine/engine/src/scene/components/PortalComponent'
import { WorldScene } from '@xrengine/engine/src/scene/functions/SceneLoading'
import { teleportToScene } from '@xrengine/engine/src/scene/functions/teleportToScene'
import { connectToInstanceServer, resetInstanceServer } from '../../reducers/instanceConnection/service'
import { connectToChannelServer, resetChannelServer } from '../../reducers/channelConnection/service'
import { SocketWebRTCClientTransport } from '../../transports/SocketWebRTCClientTransport'
import { incomingNetworkReceptor } from '@xrengine/engine/src/networking/functions/incomingNetworkReceptor'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/interfaces/NetworkWorldActions'
import { PrefabType } from '@xrengine/engine/src/networking/templates/PrefabType'
import { Vector3, Quaternion } from 'three'
import { SceneData } from '@xrengine/engine/src/scene/interfaces/SceneData'
import { getPacksFromSceneData } from '@xrengine/realitypacks/loader'
import { registerSystem } from '@xrengine/engine/src/ecs/functions/SystemFunctions'

const projectRegex = /\/([A-Za-z0-9]+)\/([a-f0-9-]+)$/

export const retriveLocationByName = (authState: any, locationName: string, history: any) => {
  if (
    authState.isLoggedIn?.value === true &&
    authState.user?.id?.value != null &&
    authState.user?.id?.value.length > 0
  ) {
    if (locationName === Config.publicRuntimeConfig.lobbyLocationName) {
      getLobby()
        .then((lobby) => {
          history.replace('/location/' + lobby.slugifiedName)
        })
        .catch((err) => console.log('getLobby error', err))
    } else {
      Store.store.dispatch(getLocationByName(locationName))
    }
  }
}

export type EngineCallbacks = {
  onEngineInitialized?: Function
  onConnectedToServer?: Function
  onSceneLoaded?: Function
  onSceneLoadProgress?: Function
  onJoinedToNewWorld?: Function
  onSuccess?: Function
}

export const getSceneData = async (sceneId: string, isOffline: boolean): Promise<SceneData> => {
  if (isOffline) {
    return testScenes[sceneId] || testScenes.test
  }

  const projectResult = await client.service('project').get(sceneId)
  Store.store.dispatch(setCurrentScene(projectResult))

  const projectUrl = projectResult.project_url
  const regexResult = projectUrl.match(projectRegex)

  let service, serviceId
  if (regexResult) {
    service = regexResult[1]
    serviceId = regexResult[2]
  }

  return client.service(service).get(serviceId) as SceneData
}

const createOfflineUser = () => {
  const avatar = {
    thumbnailURL: '',
    avatarURL: '',
    avatarId: 0
  } as any

  const userId = 'user'
  const netId = 0
  const params = {
    position: new Vector3(0.18393396470500378, 0, 0.2599274866972079),
    rotation: new Quaternion()
  }

  // it is needed by ClientAvatarSpawnSystem
  Network.instance.userId = userId
  // Replicate the server behavior
  incomingNetworkReceptor(NetworkWorldAction.createClient(userId, avatar))
  incomingNetworkReceptor(NetworkWorldAction.createObject(netId, userId, PrefabType.Player, params))
}

export const initEngine = async (
  sceneId: string,
  initOptions: InitializeOptions,
  newSpawnPos?: ReturnType<typeof PortalComponent.get>,
  engineCallbacks?: EngineCallbacks
): Promise<any> => {
  const userLoaded = new Promise<void>((resolve) => {
    const listener = ({ uniqueId }) => {
      if (uniqueId === Network.instance.userId) {
        resolve()
        EngineEvents.instance.removeEventListener(EngineEvents.EVENTS.CLIENT_USER_LOADED, listener)
      }
    }
    EngineEvents.instance.addEventListener(EngineEvents.EVENTS.CLIENT_USER_LOADED, listener)
  })

  // 1.

  const isOffline = typeof initOptions.networking.schema.transport === 'undefined'
  const sceneData = await getSceneData(sceneId, isOffline)
  console.log(sceneData)

  const packs = await getPacksFromSceneData(sceneData, true)
  console.log(packs)

  for (const system of packs.systems) {
    initOptions.systems.push(system)
  }

  const realityPackReactComponentPromises = Promise.all(packs.react)

  // 2. Initialize Engine if not initialized
  if (!Engine.isInitialized) {
    await initializeEngine(initOptions)
    document.dispatchEvent(new CustomEvent('ENGINE_LOADED')) // this is the only time we should use document events. would be good to replace this with react state

    if (typeof engineCallbacks?.onEngineInitialized === 'function') {
      engineCallbacks.onEngineInitialized()
    }
  }

  // 3. Connect to server
  if (!isOffline) {
    await Store.store.dispatch(connectToInstanceServer('instance'))
    await new Promise<void>((resolve) => {
      EngineEvents.instance.once(EngineEvents.EVENTS.CONNECT_TO_WORLD, resolve)
    })
  }

  if (typeof engineCallbacks?.onConnectedToServer === 'function') {
    engineCallbacks.onConnectedToServer()
  }

  // 4. Start scene loading
  Store.store.dispatch(AppAction.setAppOnBoardingStep(GeneralStateList.SCENE_LOADING))

  await WorldScene.load(sceneData, engineCallbacks?.onSceneLoadProgress)

  getPortalDetails()
  Store.store.dispatch(AppAction.setAppOnBoardingStep(GeneralStateList.SCENE_LOADED))
  Store.store.dispatch(AppAction.setAppLoaded(true))

  // 5. Join to new world
  if (!isOffline) {
    // TEMPORARY - just so portals work for now - will be removed in favor of gameserver-gameserver communication
    let spawnTransform
    if (newSpawnPos) {
      spawnTransform = { position: newSpawnPos.remoteSpawnPosition, rotation: newSpawnPos.remoteSpawnRotation }
    }

    const { worldState } = await (Network.instance.transport as SocketWebRTCClientTransport).instanceRequest(
      MessageTypes.JoinWorld.toString(),
      { spawnTransform }
    )
    worldState.forEach((action) => {
      // TODO: send the correct world when we support multiple worlds
      incomingNetworkReceptor(action)
    })
  }

  if (isOffline) {
    createOfflineUser()
  }

  const [realityPackReactComponents] = await Promise.all([realityPackReactComponentPromises, userLoaded])

  EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.JOINED_WORLD })

  if (typeof engineCallbacks?.onJoinedToNewWorld === 'function') {
    engineCallbacks.onJoinedToNewWorld()
  }

  // 6. Dispatch success
  Store.store.dispatch(AppAction.setAppOnBoardingStep(GeneralStateList.SUCCESS))

  if (typeof engineCallbacks?.onSuccess === 'function') {
    engineCallbacks.onSuccess()
  }

  return realityPackReactComponents
}

export const teleportToLocation = async (
  portalComponent: ReturnType<typeof PortalComponent.get>,
  slugifiedNameOfCurrentLocation: string,
  onTeleport: Function
) => {
  // TODO: this needs to be implemented on the server too
  // if (slugifiedNameOfCurrentLocation === portalComponent.location) {
  //   teleportPlayer(
  //     Network.instance.localClientEntity,
  //     portalComponent.remoteSpawnPosition,
  //     portalComponent.remoteSpawnRotation
  //   )
  //   return
  // }

  // shut down connection with existing GS
  Store.store.dispatch(resetInstanceServer())
  Network.instance.transport.close()

  await teleportToScene(portalComponent, async () => {
    onTeleport()
    Store.store.dispatch(getLocationByName(portalComponent.location))
  })
}
