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

import React, { useEffect } from 'react'
import {
  Box3,
  DoubleSide,
  Material,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  Sphere,
  Texture,
  Vector3
} from 'three'

import config from '@etherealengine/common/src/config'
import { defineState, getMutableState, getState, hookstate, useHookstate } from '@etherealengine/hyperflux'

import { AssetLoader } from '../../assets/classes/AssetLoader'
import { CSM } from '../../assets/csm/CSM'
import { CSMHelper } from '../../assets/csm/CSMHelper'
import { V_001 } from '../../common/constants/MathConstants'
import { isClient } from '../../common/functions/getEnvironment'
import { createPriorityQueue, createSortAndApplyPriorityQueue } from '../../ecs/PriorityQueue'
import { EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import {
  getComponent,
  getOptionalComponent,
  hasComponent,
  removeComponent,
  setComponent,
  useComponent
} from '../../ecs/functions/ComponentFunctions'
import { createEntity, removeEntity, useEntityContext } from '../../ecs/functions/EntityFunctions'
import { EntityTreeComponent, iterateEntityNode } from '../../ecs/functions/EntityTree'
import { QueryReactor, defineQuery } from '../../ecs/functions/QueryFunctions'
import { defineSystem, useExecute } from '../../ecs/functions/SystemFunctions'
import { AnimationSystemGroup } from '../../ecs/functions/SystemGroups'
import { RendererState } from '../../renderer/RendererState'
import { EngineRenderer, RenderSettingsState } from '../../renderer/WebGLRendererSystem'
import { getShadowsEnabled, useShadowsEnabled } from '../../renderer/functions/RenderSettingsFunction'
import { compareDistanceToCamera } from '../../transform/components/DistanceComponents'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { XRLightProbeState } from '../../xr/XRLightProbeSystem'
import { isMobileXRHeadset } from '../../xr/XRState'
import { DirectionalLightComponent } from '../components/DirectionalLightComponent'
import { DropShadowComponent } from '../components/DropShadowComponent'
import { GroupComponent, GroupQueryReactor, addObjectToGroup } from '../components/GroupComponent'
import { MeshComponent } from '../components/MeshComponent'
import { useMeshOrModel } from '../components/ModelComponent'
import { NameComponent } from '../components/NameComponent'
import { ObjectLayerComponents } from '../components/ObjectLayerComponent'
import { ShadowComponent } from '../components/ShadowComponent'
import { UUIDComponent } from '../components/UUIDComponent'
import { VisibleComponent } from '../components/VisibleComponent'
import { ObjectLayers } from '../constants/ObjectLayers'
import { SceneObjectSystem } from './SceneObjectSystem'

export const ShadowSystemState = defineState({
  name: 'ee.engine.scene.ShadowSystemState',
  initial: () => {
    const accumulationBudget = isMobileXRHeadset ? 4 : 20

    const priorityQueue = createPriorityQueue({
      accumulationBudget
    })

    return {
      priorityQueue
    }
  }
})

export const shadowDirection = new Vector3(0, -1, 0)
const shadowRotation = new Quaternion()
const raycaster = new Raycaster()
raycaster.firstHitOnly = true
const raycasterPosition = new Vector3()

const EntityCSMReactor = (props: { entity: Entity }) => {
  const activeLightEntity = props.entity

  const directionalLightComponent = useComponent(activeLightEntity, DirectionalLightComponent)
  const shadowMapResolution = useHookstate(getMutableState(RendererState).shadowMapResolution)

  const directionalLight = directionalLightComponent.light.value

  useEffect(() => {
    /** @todo fix useInCSM reactivity */
    // if (!directionalLightComponent.useInCSM.value) return
    getMutableState(RendererState).csm.set(
      new CSM({
        light: directionalLight,
        shadowBias: directionalLightComponent.shadowBias.value,
        maxFar: directionalLightComponent.cameraFar.value,
        lightIntensity: directionalLightComponent.intensity.value
      })
    )
    return () => {
      getState(RendererState).csm?.dispose()
      getMutableState(RendererState).csm.set(null)
    }
  }, [activeLightEntity])

  /** Must run after scene object system to ensure source light is not lit */
  useExecute(
    () => {
      directionalLight.visible = false //!directionalLightComponent.useInCSM.value
    },
    { after: SceneObjectSystem }
  )

  useEffect(() => {
    const csm = getState(RendererState).csm!
    if (!csm) return

    csm.shadowBias = directionalLight.shadow.bias

    for (const light of csm.lights) {
      light.color.copy(directionalLightComponent.color.value)
      light.intensity = directionalLightComponent.intensity.value
      light.shadow.bias = directionalLightComponent.shadowBias.value
      light.shadow.mapSize.setScalar(shadowMapResolution.value)
      csm.needsUpdate = true
    }
  }, [
    shadowMapResolution,
    directionalLightComponent?.useInCSM,
    directionalLightComponent?.shadowBias,
    directionalLightComponent?.intensity,
    directionalLightComponent?.color,
    directionalLightComponent?.castShadow,
    directionalLightComponent?.shadowRadius,
    directionalLightComponent?.cameraFar
  ])

  return null
}

const PlainCSMReactor = () => {
  const shadowMapResolution = useHookstate(getMutableState(RendererState).shadowMapResolution)

  useEffect(() => {
    getMutableState(RendererState).csm.set(
      new CSM({
        shadowMapSize: shadowMapResolution.value
      })
    )

    return () => {
      getState(RendererState).csm?.dispose()
      getMutableState(RendererState).csm.set(null)
    }
  }, [])

  useEffect(() => {
    const csm = getState(RendererState).csm!

    for (const light of csm.lights) {
      light.shadow.mapSize.setScalar(shadowMapResolution.value)
      light.shadow.camera.updateProjectionMatrix()
      light.shadow.map?.dispose()
      light.shadow.map = null as any
      light.shadow.needsUpdate = true
    }
  }, [shadowMapResolution])

  return null
}

const directionalLightQuery = defineQuery([VisibleComponent, DirectionalLightComponent])

function CSMReactor() {
  const xrLightProbeState = getMutableState(XRLightProbeState)
  const xrLightProbeEntity = useHookstate(xrLightProbeState.directionalLightEntity)

  const rendererState = useHookstate(getMutableState(RendererState))
  useEffect(() => {
    if (!rendererState.csm.value || !rendererState.nodeHelperVisibility.value) return
    const helper = new CSMHelper()
    rendererState.csmHelper.set(helper)
    return () => {
      helper.remove()
      rendererState.csmHelper.set(null)
    }
  }, [rendererState.csm, rendererState.nodeHelperVisibility])

  const renderSettingsState = useHookstate(getMutableState(RenderSettingsState))
  const csmEnabled = renderSettingsState?.csm?.value
  if (!csmEnabled) return null

  let activeLightEntity = null as Entity | null

  if (xrLightProbeEntity.value) activeLightEntity = xrLightProbeEntity.value
  /** @todo support multiple lights #8277 */ else
    activeLightEntity = UUIDComponent.getEntityByUUID(renderSettingsState.primaryLight.value)

  /** @todo directional light useInCSM does not reactivly update between these when switching in studio */
  if (!activeLightEntity) return <PlainCSMReactor />

  return <EntityCSMReactor entity={activeLightEntity} key={activeLightEntity} />
}

const shadowGeometry = new PlaneGeometry(1, 1, 1, 1).rotateX(-Math.PI)
const shadowMaterial = new MeshBasicMaterial({
  side: DoubleSide,
  transparent: true,
  opacity: 1,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: 0.01
})

const shadowState = hookstate(null as MeshBasicMaterial | null)

const dropShadowComponentQuery = defineQuery([DropShadowComponent])

const minRadius = 0.15
const maxRadius = 5
const sphere = new Sphere()
const box3 = new Box3()
const vec3 = new Vector3()

const DropShadowReactor = () => {
  const entity = useEntityContext()
  const shadowMaterial = useHookstate(shadowState)
  const isMeshOrModel = useMeshOrModel(entity)
  const shadow = useComponent(entity, ShadowComponent)
  const entityTree = useComponent(entity, EntityTreeComponent)

  useEffect(() => {
    if (!shadow.cast.value || !shadowMaterial.value || !isMeshOrModel || hasComponent(entity, DropShadowComponent))
      return

    box3.makeEmpty()

    let foundMesh = false

    iterateEntityNode(entity, (child) => {
      const mesh = getOptionalComponent(child, MeshComponent)
      if (mesh) {
        box3.expandByObject(mesh)
        foundMesh = true
      }
    })

    if (!foundMesh) return

    box3.getBoundingSphere(sphere)

    if (sphere.radius > maxRadius) return

    const radius = Math.max(sphere.radius * 2, minRadius)
    const center = sphere.center.sub(TransformComponent.getWorldPosition(entity, vec3))
    const shadowEntity = createEntity()
    const shadowObject = new Mesh(shadowGeometry, shadowMaterial.value.clone())
    addObjectToGroup(shadowEntity, shadowObject)
    setComponent(shadowEntity, NameComponent, 'Shadow for ' + getComponent(entity, NameComponent))
    setComponent(shadowEntity, VisibleComponent)
    setComponent(entity, DropShadowComponent, { radius, center, entity: shadowEntity })

    return () => {
      removeComponent(entity, DropShadowComponent)
      removeEntity(shadowEntity)
    }
  }, [shadowMaterial, isMeshOrModel, shadow, entityTree.children])

  return null
}

function ShadowMeshReactor(props: { entity: Entity; obj: Mesh<any, Material> }) {
  const { entity, obj } = props

  const shadowComponent = useComponent(entity, ShadowComponent)
  const csm = useHookstate(getMutableState(RendererState).csm)

  useEffect(() => {
    obj.castShadow = shadowComponent.cast.value
    obj.receiveShadow = shadowComponent.receive.value

    const csm = getState(RendererState).csm
    if (obj.material && obj.receiveShadow) {
      csm?.setupMaterial(obj)
    }

    return () => {
      if (obj.material) csm?.teardownMaterial(obj.material)
    }
  }, [shadowComponent.cast, shadowComponent.receive, csm])

  return null
}

const shadowOffset = new Vector3(0, 0.01, 0)

const sortAndApplyPriorityQueue = createSortAndApplyPriorityQueue(dropShadowComponentQuery, compareDistanceToCamera)
const sortedEntityTransforms = [] as Entity[]

const cameraLayerQuery = defineQuery([ObjectLayerComponents[ObjectLayers.Camera], MeshComponent])

const updateDropShadowTransforms = () => {
  const { deltaSeconds } = getState(EngineState)
  const { priorityQueue } = getState(ShadowSystemState)

  sortAndApplyPriorityQueue(priorityQueue, sortedEntityTransforms, deltaSeconds)

  const sceneObjects = cameraLayerQuery().flatMap((entity) => getComponent(entity, MeshComponent))

  for (const entity of priorityQueue.priorityEntities) {
    const dropShadow = getComponent(entity, DropShadowComponent)
    const dropShadowTransform = getComponent(dropShadow.entity, TransformComponent)

    TransformComponent.getWorldPosition(entity, raycasterPosition).add(dropShadow.center)
    raycaster.set(raycasterPosition, shadowDirection)

    const intersected = raycaster.intersectObjects(sceneObjects, false)[0]
    if (!intersected || !intersected.face) {
      dropShadowTransform.scale.setScalar(0)
      continue
    }

    const centerCorrectedDist = Math.max(intersected.distance - dropShadow.center.y, 0.0001)

    //arbitrary bias to make it a bit smaller
    const sizeBias = 0.3
    const finalRadius = sizeBias * dropShadow.radius + dropShadow.radius * centerCorrectedDist * 0.5

    const shadowMaterial = (getComponent(dropShadow.entity, GroupComponent)[0] as any).material as Material
    shadowMaterial.opacity = Math.min(1 / (1 + centerCorrectedDist), 1) * 0.6

    shadowRotation.setFromUnitVectors(intersected.face.normal, V_001)
    dropShadowTransform.rotation.copy(shadowRotation)
    dropShadowTransform.scale.setScalar(finalRadius * 2)
    dropShadowTransform.position.copy(intersected.point).add(shadowOffset)
  }
}

const groupQuery = defineQuery([GroupComponent, VisibleComponent, ShadowComponent])

const execute = () => {
  if (!isClient) return

  const useShadows = getShadowsEnabled()
  if (!useShadows) {
    updateDropShadowTransforms()
    return
  }

  const { csm, csmHelper } = getState(RendererState)
  if (csm) {
    csm.update()
    if (csmHelper) csmHelper.update(csm)

    /** hack fix to ensure CSM material is applied to all materials (which are not set reactively) */
    for (const entity of groupQuery()) {
      for (const obj of getComponent(entity, GroupComponent) as any as Mesh[]) {
        if (obj.material && obj.receiveShadow) csm.setupMaterial(obj)
      }
    }
  }
}

const reactor = () => {
  if (!isClient) return null

  const useShadows = useShadowsEnabled()

  useEffect(() => {
    AssetLoader.loadAsync(`${config.client.fileServer}/projects/default-project/assets/drop-shadow.png`).then(
      (texture: Texture) => {
        shadowMaterial.map = texture
        shadowMaterial.needsUpdate = true
        shadowState.set(shadowMaterial)
      }
    )
  }, [])

  EngineRenderer.instance.renderer.shadowMap.enabled = EngineRenderer.instance.renderer.shadowMap.autoUpdate =
    useShadows

  return (
    <>
      {useShadows ? (
        <CSMReactor />
      ) : (
        <QueryReactor Components={[VisibleComponent, ShadowComponent]} ChildEntityReactor={DropShadowReactor} />
      )}
      <GroupQueryReactor GroupChildReactor={ShadowMeshReactor} Components={[VisibleComponent, ShadowComponent]} />
    </>
  )
}

export const ShadowSystem = defineSystem({
  uuid: 'ee.engine.ShadowSystem',
  insert: { with: AnimationSystemGroup },
  execute,
  reactor
})
