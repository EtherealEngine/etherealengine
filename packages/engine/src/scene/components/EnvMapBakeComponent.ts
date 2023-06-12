import { useEffect } from 'react'
import {
  BoxGeometry,
  BoxHelper,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Scene,
  SphereGeometry,
  Vector3
} from 'three'

import { getMutableState, getState, none, useHookstate } from '@etherealengine/hyperflux'

import { matches } from '../../common/functions/MatchesUtils'
import { Engine } from '../../ecs/classes/Engine'
import { EngineActions, EngineState } from '../../ecs/classes/EngineState'
import { Entity } from '../../ecs/classes/Entity'
import { SceneState } from '../../ecs/classes/Scene'
import { defineComponent, getComponent, hasComponent, useComponent } from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { EntityTreeComponent, traverseEntityNode } from '../../ecs/functions/EntityTree'
import { RendererState } from '../../renderer/RendererState'
import { EngineRenderer } from '../../renderer/WebGLRendererSystem'
import { envmapPhysicalParsReplace, worldposReplace } from '../classes/BPCEMShader'
import { ObjectLayers } from '../constants/ObjectLayers'
import { setObjectLayers } from '../functions/setObjectLayers'
import { EnvMapBakeRefreshTypes } from '../types/EnvMapBakeRefreshTypes'
import { EnvMapBakeTypes } from '../types/EnvMapBakeTypes'
import { addObjectToGroup, GroupComponent, removeObjectFromGroup } from './GroupComponent'

export const EnvMapBakeComponent = defineComponent({
  name: 'EnvMapBakeComponent',
  jsonID: 'envmapbake',

  onInit: (entity) => {
    return {
      bakePosition: new Vector3(),
      bakePositionOffset: new Vector3(),
      bakeScale: new Vector3().set(1, 1, 1),
      bakeType: EnvMapBakeTypes.Baked,
      resolution: 1024,
      refreshMode: EnvMapBakeRefreshTypes.OnAwake,
      envMapOrigin: '',
      boxProjection: true,
      helper: null as Object3D | null,
      helperBall: null as Mesh<SphereGeometry, MeshPhysicalMaterial> | null,
      helperBox: null as BoxHelper | null
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    if (matches.object.test(json.bakePosition)) component.bakePosition.value.copy(json.bakePosition)
    if (matches.object.test(json.bakePositionOffset)) component.bakePositionOffset.value.copy(json.bakePositionOffset)
    if (matches.object.test(json.bakeScale)) component.bakeScale.value.copy(json.bakeScale)
    if (matches.string.test(json.bakeType)) component.bakeType.set(json.bakeType)
    if (matches.number.test(json.resolution)) component.resolution.set(json.resolution)
    if (matches.string.test(json.refreshMode)) component.refreshMode.set(json.refreshMode)
    if (matches.string.test(json.envMapOrigin)) component.envMapOrigin.set(json.envMapOrigin)
    if (matches.boolean.test(json.boxProjection)) component.boxProjection.set(json.boxProjection)
  },

  toJSON: (entity, component) => {
    return {
      bakePosition: component.bakePosition.value,
      bakePositionOffset: component.bakePositionOffset.value,
      bakeScale: component.bakeScale.value,
      bakeType: component.bakeType.value,
      resolution: component.resolution.value,
      refreshMode: component.refreshMode.value,
      envMapOrigin: component.envMapOrigin.value,
      boxProjection: component.boxProjection.value
    }
  },

  onRemove: (entity, component) => {
    if (component.helper.value) removeObjectFromGroup(entity, component.helper.value)
  },

  reactor: function () {
    const entity = useEntityContext()
    const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility)
    const bake = useComponent(entity, EnvMapBakeComponent)

    useEffect(() => {
      if (debugEnabled.value && !bake.helper.value) {
        const helper = new Object3D()
        helper.name = `envmap-bake-helper-${entity}`

        const centerBall = new Mesh(new SphereGeometry(0.75), new MeshPhysicalMaterial({ roughness: 0, metalness: 1 }))
        helper.add(centerBall)

        const gizmo = new BoxHelper(new Mesh(new BoxGeometry()), 0xff0000)
        helper.add(gizmo)

        setObjectLayers(helper, ObjectLayers.NodeHelper)
        addObjectToGroup(entity, helper)

        bake.helper.set(helper)
        bake.helperBall.set(centerBall)
        bake.helperBox.set(gizmo)
      }

      if (!debugEnabled.value && bake.helper.value) {
        removeObjectFromGroup(entity, bake.helper.value)
        bake.helper.set(none)
      }
    }, [debugEnabled])

    const root = useComponent(getState(SceneState).sceneEntity, EntityTreeComponent)
    const engineState = useHookstate(getMutableState(EngineState))

    useEffect(() => {
      if (bake.boxProjection.value) applyBoxProjection(entity)
    }, [engineState.sceneLoaded])

    return null
  }
})

export const prepareSceneForBake = (): Scene => {
  const scene = Engine.instance.scene.clone(false)
  const sceneEntity = getState(SceneState).sceneEntity
  const parents = {
    [sceneEntity]: scene
  } as { [key: Entity]: Object3D }

  traverseEntityNode(sceneEntity, (entity) => {
    if (entity === sceneEntity) return

    const group = getComponent(entity, GroupComponent) as unknown as Mesh<any, MeshStandardMaterial>[]
    const node = getComponent(entity, EntityTreeComponent)

    if (group) {
      for (const obj of group) {
        const newObj = obj.clone(true)
        if (node.parentEntity) parents[node.parentEntity].add(newObj)
        newObj.traverse((o: any) => {
          if (o.material) {
            o.material = obj.material.clone()
            o.material.roughness = 1
          }
        })
      }
    }
  })

  return scene
}

export const applyBoxProjection = (entity: Entity) => {
  const bakeComponent = getComponent(entity, EnvMapBakeComponent)
  Engine.instance.scene.traverse((child: Mesh<any, MeshPhysicalMaterial>) => {
    if (!child.material || child.type == 'VFXBatch' || child.material.type != 'MeshPhysicalMaterial') return
    console.log(child.material)
    child.material.onBeforeCompile = (shader, renderer) => {
      shader.uniforms.cubeMapSize = { value: bakeComponent.bakeScale }
      shader.uniforms.cubeMapPos = { value: bakeComponent.bakePositionOffset }

      //replace shader chunks with box projection chunks
      if (!shader.vertexShader.startsWith('varying vec3 vWorldPosition'))
        shader.vertexShader = 'varying vec3 vWorldPosition;\n' + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', worldposReplace)

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <envmap_physical_pars_fragment>',
        envmapPhysicalParsReplace
      )
    }
  })
}
