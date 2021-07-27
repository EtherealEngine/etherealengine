import { AmbientLight, PerspectiveCamera } from 'three'
import { AssetLoader } from '../../assets/classes/AssetLoader'
import { CameraLayers } from '../../camera/constants/CameraLayers'
import { CameraSystem, getViewVectorFromAngle } from '../../camera/systems/CameraSystem'
import { CharacterComponent } from '../../character/components/CharacterComponent'
import { ControllerColliderComponent } from '../../character/components/ControllerColliderComponent'
import { Engine } from '../../ecs/classes/Engine'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { delay } from '../../ecs/functions/EngineFunctions'
import { addComponent, getComponent, removeComponent } from '../../ecs/functions/EntityFunctions'
import { Network } from '../../networking/classes/Network'
import { PhysicsSystem } from '../../physics/systems/PhysicsSystem'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { PortalProps } from '../behaviors/createPortal'
import { PortalEffect } from '../classes/PortalEffect'
import { Object3DComponent } from '../components/Object3DComponent'

export const teleportToScene = async (portalComponent: PortalProps, handleNewScene: () => void) => {
  EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.ENABLE_SCENE, physics: false })
  Engine.hasJoinedWorld = false

  // remove controller since physics world will be destroyed and we don't want it moving
  PhysicsSystem.instance.removeController(
    getComponent(Network.instance.localClientEntity, ControllerColliderComponent).controller
  )
  removeComponent(Network.instance.localClientEntity, ControllerColliderComponent)

  const playerObj = getComponent(Network.instance.localClientEntity, Object3DComponent)
  const texture = await AssetLoader.loadAsync({ url: '/hdr/galaxyTexture.jpg' })

  const hyperspaceEffect = new PortalEffect(texture)
  hyperspaceEffect.scale.set(10, 10, 10)
  hyperspaceEffect.traverse((obj) => {
    obj.layers.enable(CameraLayers.Portal)
    obj.layers.disable(CameraLayers.Scene)
  })
  hyperspaceEffect.position.copy(playerObj.value.position)
  hyperspaceEffect.quaternion.copy(playerObj.value.quaternion)

  const light = new AmbientLight('#aaa')
  light.layers.enable(CameraLayers.Portal)
  Engine.scene.add(light)

  Engine.scene.add(hyperspaceEffect)

  // TODO add an ECS thing somewhere to update this properly
  const delta = 1 / 60
  const camera = Engine.scene.getObjectByProperty('isPerspectiveCamera', true as any) as PerspectiveCamera
  camera.zoom = 1.5
  const hyperSpaceUpdateInterval = setInterval(() => {
    hyperspaceEffect.update(delta)

    hyperspaceEffect.position.copy(playerObj.value.position)
    hyperspaceEffect.quaternion.copy(playerObj.value.quaternion)

    if (camera.zoom > 0.75) {
      camera.zoom -= delta
      camera.updateProjectionMatrix()
    }
  }, delta * 1000)

  Engine.scene.background = null
  Engine.camera.layers.enable(CameraLayers.Portal)
  Engine.camera.layers.enable(CameraLayers.Avatar)
  Engine.camera.layers.disable(CameraLayers.Scene)

  playerObj.value.traverse((obj) => {
    obj.layers.enable(CameraLayers.Avatar)
    obj.layers.disable(CameraLayers.Scene)
  })

  // TODO: add BPCEM of old and new scenes and fade them in and out too
  await hyperspaceEffect.fadeIn(delta)

  await handleNewScene()

  CameraSystem.instance.portCamera = true

  await new Promise<void>((resolve) => {
    Engine.scene.background = null
    Engine.hasJoinedWorld = true
    EngineEvents.instance.once(EngineEvents.EVENTS.JOINED_WORLD, resolve)
  })

  await delay(100)

  // teleport player to where the portal is
  const transform = getComponent(Network.instance.localClientEntity, TransformComponent)
  transform.position.set(
    portalComponent.spawnPosition.x,
    portalComponent.spawnPosition.y,
    portalComponent.spawnPosition.z
  )

  const actor = getComponent(Network.instance.localClientEntity, CharacterComponent)
  actor.viewVector.copy(getViewVectorFromAngle(actor.viewVector, (portalComponent.spawnEuler as any)._y))

  addComponent(Network.instance.localClientEntity, ControllerColliderComponent)

  const fadeOut = hyperspaceEffect.fadeOut(delta)

  await delay(250)

  Engine.camera.layers.enable(CameraLayers.Scene)
  light.removeFromParent()

  await fadeOut

  playerObj.value.traverse((obj) => {
    obj.layers.enable(CameraLayers.Scene)
    obj.layers.disable(CameraLayers.Avatar)
  })

  Engine.camera.layers.disable(CameraLayers.Portal)
  Engine.camera.layers.disable(CameraLayers.Avatar)

  hyperspaceEffect.removeFromParent()

  clearInterval(hyperSpaceUpdateInterval)

  CameraSystem.instance.portCamera = false

  EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.ENABLE_SCENE, physics: true })
}
