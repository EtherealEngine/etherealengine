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

import {
  defineComponent,
  getComponent,
  removeComponent,
  setComponent,
  useComponent
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { createEntity, removeEntity, useEntityContext } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { TransformControls } from '@etherealengine/engine/src/scene/classes/TransformGizmo'

import { CameraComponent } from '@etherealengine/engine/src/camera/components/CameraComponent'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineRenderer } from '@etherealengine/engine/src/renderer/WebGLRendererSystem'
import { addObjectToGroup, removeObjectFromGroup } from '@etherealengine/engine/src/scene/components/GroupComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { ObjectLayers } from '@etherealengine/engine/src/scene/constants/ObjectLayers'
import { SnapMode, TransformPivot } from '@etherealengine/engine/src/scene/constants/transformConstants'
import { setObjectLayers } from '@etherealengine/engine/src/scene/functions/setObjectLayers'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { useEffect } from 'react'
import { Euler, Object3D } from 'three'
import { degToRad } from 'three/src/math/MathUtils'
import { EditorControlFunctions } from '../functions/EditorControlFunctions'
import { EditorHelperState } from '../services/EditorHelperState'

export const TransformGizmoComponent = defineComponent({
  name: 'TransformGizmo',

  onInit(entity) {
    const control = new TransformControls(
      getComponent(Engine.instance.cameraEntity, CameraComponent),
      EngineRenderer.instance.renderer.domElement
    )
    return control
  },
  onRemove: (entity, component) => {
    component.value.detach()
    component.value.dispose()
  },
  reactor: function (props) {
    const entity = useEntityContext()
    const gizmoComponent = useComponent(entity, TransformGizmoComponent)
    const editorHelperState = useHookstate(getMutableState(EditorHelperState))
    const transformComponent = useComponent(entity, TransformComponent)

    useEffect(() => {
      // create dummy object to attach gizmo to, we can only attach to three js objects
      gizmoComponent.value.addEventListener('mouseUp', (event) => {
        EditorControlFunctions.positionObject([entity], [transformComponent.value.position])
        EditorControlFunctions.rotateObject(
          [entity],
          [new Euler().setFromQuaternion(transformComponent.value.rotation)]
        )
        EditorControlFunctions.scaleObject([entity], [transformComponent.value.scale], true)
        EditorControlFunctions.commitTransformSave([entity])
      })

      const dummy = new Object3D()
      dummy.name = 'gizmoProxy'
      // create dummy Entity for gizmo helper
      const dummyEntity = createEntity()
      setComponent(dummyEntity, NameComponent, 'gizmoEntity')
      setComponent(dummyEntity, VisibleComponent)

      // set layers
      const raycaster = gizmoComponent.value.getRaycaster()
      raycaster.layers.set(ObjectLayers.TransformGizmo)

      // add dummy to entity and gizmo to dummy entity and attach
      addObjectToGroup(entity, dummy)
      gizmoComponent.value.attach(dummy)
      addObjectToGroup(dummyEntity, gizmoComponent.value)
      setObjectLayers(gizmoComponent.value, ObjectLayers.TransformGizmo)
      setObjectLayers(dummy, ObjectLayers.TransformGizmo)
      removeComponent(dummyEntity, TransformComponent)

      return () => {
        removeObjectFromGroup(entity, dummy)
        removeEntity(dummyEntity)
      }
    }, [])

    useEffect(() => {
      const mode = editorHelperState.transformMode.value
      gizmoComponent.value.setMode(mode)
    }, [editorHelperState.transformMode])

    useEffect(() => {
      const mode = editorHelperState.transformMode.value
      gizmoComponent.value.setMode(mode)
    }, [editorHelperState.transformMode])

    useEffect(() => {
      //TODO: implement gizmo attachment for multiple entities selected
      switch (editorHelperState.transformPivot.value) {
        case TransformPivot.Selection:
          break
        case TransformPivot.Center:
          break
        case TransformPivot.Bottom:
          break
        case TransformPivot.Origin:
          break
      }
    }, [editorHelperState.transformPivot])

    useEffect(() => {
      const space = editorHelperState.transformSpace.value
      gizmoComponent.value.setSpace(space)
    }, [editorHelperState.transformSpace])

    useEffect(() => {
      switch (editorHelperState.gridSnap.value) {
        case SnapMode.Disabled: // continous update
          gizmoComponent.value.setTranslationSnap(null)
          gizmoComponent.value.setRotationSnap(null)
          gizmoComponent.value.setScaleSnap(null)
          break
        case SnapMode.Grid:
          gizmoComponent.value.setTranslationSnap(editorHelperState.translationSnap.value)
          gizmoComponent.value.setRotationSnap(degToRad(editorHelperState.rotationSnap.value))
          gizmoComponent.value.setScaleSnap(editorHelperState.scaleSnap.value)
          break
      }
    }, [editorHelperState.gridSnap])

    useEffect(() => {
      gizmoComponent.value.setTranslationSnap(
        editorHelperState.snapMode.value === SnapMode.Grid ? editorHelperState.translationSnap.value : null
      )
    }, [editorHelperState.translationSnap])

    useEffect(() => {
      gizmoComponent.value.setRotationSnap(
        editorHelperState.snapMode.value === SnapMode.Grid ? degToRad(editorHelperState.rotationSnap.value) : null
      )
    }, [editorHelperState.rotationSnap])

    useEffect(() => {
      gizmoComponent.value.setScaleSnap(
        editorHelperState.snapMode.value === SnapMode.Grid ? editorHelperState.scaleSnap.value : null
      )
    }, [editorHelperState.scaleSnap])

    return null
  }
})
