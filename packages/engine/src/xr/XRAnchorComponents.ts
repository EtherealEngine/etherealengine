import { useEffect } from 'react'
import { BufferGeometry, Mesh, MeshLambertMaterial, MeshStandardMaterial, ShadowMaterial } from 'three'
import matches from 'ts-matches'

import { EntityUUID } from '@xrengine/common/src/interfaces/EntityUUID'
import { defineAction, getState, State, useHookstate } from '@xrengine/hyperflux'

import { matchesQuaternion, matchesVector3 } from '../common/functions/MatchesUtils'
import { Engine } from '../ecs/classes/Engine'
import {
  defineComponent,
  getComponent,
  hasComponent,
  useComponent,
  useOptionalComponent
} from '../ecs/functions/ComponentFunctions'
import { EntityReactorProps } from '../ecs/functions/EntityFunctions'
import { GroupComponent, Object3DWithEntity } from '../scene/components/GroupComponent'
import { UUIDComponent } from '../scene/components/UUIDComponent'
import { LocalTransformComponent, setLocalTransformComponent } from '../transform/components/TransformComponent'
import { XRState } from './XRState'

/**
 * A SkyAnchorComponent adds an anchor point to the scene that is in the sky
 */
export const SkyAnchorComponent = defineComponent({
  name: 'SkyAnchorComponent'
})

export const SCENE_COMPONENT_SKY_ANCHOR = 'sky-anchor'

/**
 * A PersistentAnchorComponent specifies that an entity represents an
 *   AR location that can be resolved by a Visual Positioning System
 */
export const PersistentAnchorComponent = defineComponent({
  name: 'PersistentAnchorComponent',

  /**
   * Set default initialization values
   * @param entity
   * @returns
   */
  onInit: (entity) => {
    return {
      /** an identifiable name for this anchor */
      name: '',
      /** whether to show this object as a wireframe upon tracking - useful for debugging */
      wireframe: false,
      /** internal - whether this anchor is currently being tracked */
      active: false
    }
  },

  /**
   * Specify JSON serialization schema
   * @param entity
   * @param component
   * @returns
   */
  toJSON: (entity, component) => {
    return {
      name: component.name.value,
      wireframe: component.wireframe.value
    }
  },

  /**
   * Handle data deserialization
   * @param entity
   * @param component
   * @param json
   * @returns
   */
  onSet: (entity, component, json) => {
    if (!json) return

    if (typeof json.name === 'string' && json.name !== component.name.value) component.name.set(json.name)

    if (typeof json.wireframe === 'string' && json.wireframe !== component.wireframe.value)
      component.wireframe.set(json.wireframe)
  },

  reactor: PersistentAnchorReactor
})

export const SCENE_COMPONENT_PERSISTENT_ANCHOR = 'persistent-anchor'

const vpsMeshes = new Map<string, { wireframe?: boolean }>()

const shadowMat = new ShadowMaterial({ opacity: 0.5, color: 0x0a0a0a })
const occlusionMat = new MeshLambertMaterial({ colorWrite: false })

/** adds occlusion and shadow materials, and hides the mesh (or sets it to wireframe) */
const anchorMeshFound = (
  group: (Object3DWithEntity & Mesh<BufferGeometry, MeshStandardMaterial>)[],
  wireframe: boolean,
  meshes: State<Mesh[]>
) => {
  for (const object of group) {
    object.traverse((obj: Mesh<BufferGeometry, MeshStandardMaterial>) => {
      if (obj.isMesh) {
        if (!vpsMeshes.has(obj.uuid)) {
          const shadowMesh = new Mesh().copy(obj, true)
          shadowMesh.material = shadowMat
          obj.parent!.add(shadowMesh)

          const occlusionMesh = new Mesh().copy(obj, true)
          occlusionMesh.material = occlusionMat
          obj.parent!.add(occlusionMesh)

          if (wireframe) {
            obj.material.wireframe = true
          } else {
            obj.visible = false
          }

          vpsMeshes.set(obj.uuid, {
            wireframe: wireframe ? obj.material.wireframe : undefined
          })

          meshes.merge([shadowMesh, occlusionMesh])
        }
      }
    })
  }
}

/** removes the occlusion and shadow materials, and resets the mesh */
const anchorMeshLost = (
  group: (Object3DWithEntity & Mesh<BufferGeometry, MeshStandardMaterial>)[],
  meshes: State<Mesh[]>
) => {
  for (const object of group) {
    object.traverse((obj: Mesh<BufferGeometry, MeshStandardMaterial>) => {
      if (obj.material && vpsMeshes.has(obj.uuid)) {
        const wireframe = vpsMeshes.get(obj.uuid)!.wireframe
        if (typeof wireframe === 'boolean') {
          obj.material.wireframe = wireframe
        } else {
          obj.visible = true
        }
        delete obj.userData.XR8_VPS
        vpsMeshes.delete(obj.uuid)
      }
    })
  }
  for (const mesh of meshes.value) {
    mesh.removeFromParent()
  }
  meshes.set([])
}

/**
 * PersistentAnchorComponent entity state reactor - reacts to the conditions upon which a mesh should be
 * @param
 * @returns
 */
function PersistentAnchorReactor({ root }: EntityReactorProps) {
  const entity = root.entity
  const world = Engine.instance.currentWorld

  const originalParentEntityUUID = useHookstate('' as EntityUUID)
  const meshes = useHookstate([] as Mesh[])

  const anchor = useOptionalComponent(entity, PersistentAnchorComponent)
  const groupComponent = useOptionalComponent(entity, GroupComponent)
  const xrState = useHookstate(getState(XRState))

  const group = groupComponent?.value as (Object3DWithEntity & Mesh<BufferGeometry, MeshStandardMaterial>)[] | undefined

  useEffect(() => {
    if (!group) return
    const active = anchor?.value && xrState.sessionMode.value === 'immersive-ar'
    if (active) {
      /** remove from scene and add to world origins */
      const originalParent = getComponent(
        getComponent(entity, LocalTransformComponent).parentEntity ?? world.sceneEntity,
        UUIDComponent
      )
      originalParentEntityUUID.set(originalParent)
      const localTransform = getComponent(entity, LocalTransformComponent)
      localTransform.parentEntity = world.originEntity
      Engine.instance.currentWorld.dirtyTransforms[entity] = true

      const wireframe = anchor.wireframe.value
      anchorMeshFound(group, wireframe, meshes)
    } else {
      /** add back to the scene */
      const originalParent = UUIDComponent.entitiesByUUID[originalParentEntityUUID.value].value
      const localTransform = getComponent(entity, LocalTransformComponent)
      localTransform.parentEntity = originalParent
      Engine.instance.currentWorld.dirtyTransforms[entity] = true

      anchorMeshLost(group, meshes)
    }
  }, [anchor?.active, groupComponent?.length, xrState.sessionActive])

  if (!hasComponent(entity, PersistentAnchorComponent)) throw root.stop()

  return null
}

export class PersistentAnchorActions {
  static anchorFound = defineAction({
    type: 'xre.anchor.anchorFound' as const,
    name: matches.string,
    position: matchesVector3,
    rotation: matchesQuaternion
  })

  static anchorUpdated = defineAction({
    type: 'xre.anchor.anchorUpdated' as const,
    name: matches.string,
    position: matchesVector3,
    rotation: matchesQuaternion
  })

  static anchorLost = defineAction({
    type: 'xre.anchor.anchorLost' as const,
    name: matches.string
  })
}
