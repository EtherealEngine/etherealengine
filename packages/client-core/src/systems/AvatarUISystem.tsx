import { Not } from 'bitecs'
import { Consumer } from 'mediasoup-client/lib/Consumer'
import { useEffect } from 'react'
import { Group, Matrix4, Vector3 } from 'three'

import { UserId } from '@xrengine/common/src/interfaces/UserId'
import multiLogger from '@xrengine/common/src/logger'
import { AvatarComponent } from '@xrengine/engine/src/avatar/components/AvatarComponent'
import { easeOutElastic } from '@xrengine/engine/src/common/functions/MathFunctions'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import {
  defineQuery,
  getComponent,
  hasComponent,
  removeComponent,
  removeQuery,
  setComponent
} from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { removeEntity } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { NetworkObjectComponent } from '@xrengine/engine/src/networking/components/NetworkObjectComponent'
import { NetworkObjectOwnedTag } from '@xrengine/engine/src/networking/components/NetworkObjectComponent'
import { shouldUseImmersiveMedia } from '@xrengine/engine/src/networking/MediaSettingsState'
import { Physics, RaycastArgs } from '@xrengine/engine/src/physics/classes/Physics'
import { CollisionGroups } from '@xrengine/engine/src/physics/enums/CollisionGroups'
import { getInteractionGroups } from '@xrengine/engine/src/physics/functions/getInteractionGroups'
import { SceneQueryType } from '@xrengine/engine/src/physics/types/PhysicsTypes'
import { addObjectToGroup } from '@xrengine/engine/src/scene/components/GroupComponent'
import { setVisibleComponent, VisibleComponent } from '@xrengine/engine/src/scene/components/VisibleComponent'
import { applyVideoToTexture } from '@xrengine/engine/src/scene/functions/applyScreenshareToTexture'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { XRUIComponent, XRUIInteractableComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { createTransitionState } from '@xrengine/engine/src/xrui/functions/createTransitionState'
import { getMutableState, startReactor, useHookstate } from '@xrengine/hyperflux'

import { createAvatarDetailView } from './ui/AvatarDetailView'
import { createAvatarContextMenuView } from './ui/UserMenuView'

const logger = multiLogger.child({ component: 'client-core:systems' })

export const AvatarUI = new Map<Entity, ReturnType<typeof createAvatarDetailView>>()
export const AvatarUITransitions = new Map<Entity, ReturnType<typeof createTransitionState>>()

const rotMat = new Matrix4()

export const renderAvatarContextMenu = (world: World, userId: UserId, contextMenuEntity: Entity) => {
  const userEntity = world.getUserAvatarEntity(userId)
  if (!userEntity) return

  const contextMenuXRUI = getComponent(contextMenuEntity, XRUIComponent)
  if (!contextMenuXRUI) return

  const userTransform = getComponent(userEntity, TransformComponent)
  const cameraPosition = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent).position
  const { avatarHeight } = getComponent(userEntity, AvatarComponent)

  const cameraTransform = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent)

  contextMenuXRUI.scale.setScalar(Math.max(1, cameraPosition.distanceTo(userTransform.position) / 3))
  contextMenuXRUI.position.copy(userTransform.position)
  contextMenuXRUI.position.y += avatarHeight - 0.3
  contextMenuXRUI.position.x += 0.1
  contextMenuXRUI.position.z += contextMenuXRUI.position.z > cameraPosition.z ? -0.4 : 0.4
  contextMenuXRUI.quaternion.copy(cameraTransform.rotation)
}

export default async function AvatarUISystem(world: World) {
  const userQuery = defineQuery([
    AvatarComponent,
    TransformComponent,
    NetworkObjectComponent,
    Not(NetworkObjectOwnedTag)
  ])
  const AvatarContextMenuUI = createAvatarContextMenuView()
  removeComponent(AvatarContextMenuUI.entity, VisibleComponent)
  setComponent(AvatarContextMenuUI.entity, XRUIInteractableComponent)

  const _vector3 = new Vector3()

  let videoPreviewTimer = 0

  const applyingVideo = new Map()

  /** XRUI Clickaway */
  const onPrimaryClick = () => {
    if (AvatarContextMenuUI.state.id.value !== '') {
      const layer = getComponent(AvatarContextMenuUI.entity, XRUIComponent)
      const hit = layer.hitTest(world.pointerScreenRaycaster.ray)
      if (!hit) {
        AvatarContextMenuUI.state.id.set('')
        setVisibleComponent(AvatarContextMenuUI.entity, false)
      }
    }
  }

  const interactionGroups = getInteractionGroups(CollisionGroups.Default, CollisionGroups.Avatars)
  const raycastComponentData = {
    type: SceneQueryType.Closest,
    origin: new Vector3(),
    direction: new Vector3(),
    maxDistance: 20,
    groups: interactionGroups
  } as RaycastArgs

  const onSecondaryClick = () => {
    const hits = Physics.castRayFromCamera(
      Engine.instance.currentWorld.camera,
      world.pointerState.position,
      Engine.instance.currentWorld.physicsWorld,
      raycastComponentData
    )

    if (hits.length) {
      const hit = hits[0]
      const hitEntity = (hit.body?.userData as any)?.entity as Entity
      if (typeof hitEntity !== 'undefined' && hitEntity !== Engine.instance.currentWorld.localClientEntity) {
        if (hasComponent(hitEntity, NetworkObjectComponent)) {
          const userId = getComponent(hitEntity, NetworkObjectComponent).ownerId
          AvatarContextMenuUI.state.id.set(userId)
          setVisibleComponent(AvatarContextMenuUI.entity, true)
          return // successful hit
        }
      }
    }

    AvatarContextMenuUI.state.id.set('')
  }

  const engineState = getMutableState(EngineState)

  const execute = () => {
    if (!engineState.isEngineInitialized.value) return

    const keys = world.buttons

    if (keys.PrimaryClick?.down) onPrimaryClick()
    if (keys.SecondaryClick?.down) onSecondaryClick()

    videoPreviewTimer += world.deltaSeconds
    if (videoPreviewTimer > 1) videoPreviewTimer = 0

    const immersiveMedia = shouldUseImmersiveMedia()

    for (const userEntity of userQuery.enter()) {
      if (AvatarUI.has(userEntity)) {
        logger.info({ userEntity }, 'Entity already exists.')
        continue
      }
      const userId = getComponent(userEntity, NetworkObjectComponent).ownerId
      const ui = createAvatarDetailView(userId)
      const transition = createTransitionState(1, 'IN')
      AvatarUITransitions.set(userEntity, transition)
      const root = new Group()
      root.name = `avatar-ui-root-${userEntity}`
      ui.state.videoPreviewMesh.value.position.y += 0.3
      ui.state.videoPreviewMesh.value.visible = false
      root.add(ui.state.videoPreviewMesh.value)
      addObjectToGroup(ui.entity, root)
      AvatarUI.set(userEntity, ui)
    }

    const cameraTransform = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent)

    for (const userEntity of userQuery()) {
      const ui = AvatarUI.get(userEntity)!
      const transition = AvatarUITransitions.get(userEntity)!
      const { avatarHeight } = getComponent(userEntity, AvatarComponent)
      const userTransform = getComponent(userEntity, TransformComponent)
      const xruiTransform = getComponent(ui.entity, TransformComponent)

      const videoPreviewMesh = ui.state.videoPreviewMesh.value
      _vector3.copy(userTransform.position).y += avatarHeight + (videoPreviewMesh.visible ? 0.1 : 0.3)

      const cameraPosition = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent).position
      const dist = cameraPosition.distanceTo(_vector3)

      if (dist > 25) transition.setState('OUT')
      if (dist < 20) transition.setState('IN')

      let springAlpha = transition.alpha

      transition.update(world.deltaSeconds, (alpha) => {
        springAlpha = easeOutElastic(alpha)
      })

      xruiTransform.scale.setScalar(1.3 * Math.max(1, dist / 6) * Math.max(springAlpha, 0.001))
      xruiTransform.position.copy(_vector3)
      xruiTransform.rotation.copy(cameraTransform.rotation)

      if (world.mediaNetwork)
        if (immersiveMedia && videoPreviewTimer === 0) {
          const { ownerId } = getComponent(userEntity, NetworkObjectComponent)
          const consumer = world.mediaNetwork!.consumers.find(
            (consumer) =>
              consumer.appData.peerID === world.mediaNetwork.peerID && consumer.appData.mediaTag === 'cam-video'
          ) as Consumer
          const paused = consumer && (consumer as any).producerPaused
          if (videoPreviewMesh.material.map) {
            if (!consumer || paused) {
              videoPreviewMesh.material.map = null!
              videoPreviewMesh.visible = false
            }
          } else {
            if (consumer && !paused && !applyingVideo.has(ownerId)) {
              applyingVideo.set(ownerId, true)
              const track = (consumer as any).track
              const newVideoTrack = track.clone()
              const newVideo = document.createElement('video')
              newVideo.autoplay = true
              newVideo.id = `${ownerId}_video_immersive`
              newVideo.muted = true
              newVideo.setAttribute('playsinline', 'true')
              newVideo.srcObject = new MediaStream([newVideoTrack])
              newVideo.play()
              if (!newVideo.readyState) {
                newVideo.onloadeddata = () => {
                  applyVideoToTexture(newVideo, videoPreviewMesh, 'fill')
                  videoPreviewMesh.visible = true
                  applyingVideo.delete(ownerId)
                }
              } else {
                applyVideoToTexture(newVideo, videoPreviewMesh, 'fill')
                videoPreviewMesh.visible = true
                applyingVideo.delete(ownerId)
              }
            }
          }
        }

      if (!immersiveMedia && videoPreviewMesh.material.map) {
        videoPreviewMesh.material.map = null!
        videoPreviewMesh.visible = false
      }
    }

    for (const userEntity of userQuery.exit()) {
      const entity = AvatarUI.get(userEntity)?.entity
      if (typeof entity !== 'undefined') removeEntity(entity)
      AvatarUI.delete(userEntity)
      AvatarUITransitions.delete(userEntity)
    }

    if (AvatarContextMenuUI.state.id.value !== '') {
      renderAvatarContextMenu(world, AvatarContextMenuUI.state.id.value, AvatarContextMenuUI.entity)
    }
  }

  const cleanup = async () => {
    removeEntity(AvatarContextMenuUI.entity)
    removeQuery(world, userQuery)
  }

  return { execute, cleanup }
}
