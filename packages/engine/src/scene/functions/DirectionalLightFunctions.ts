import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { CameraHelper, DirectionalLight, Vector2, Color } from 'three'
import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import {
  addComponent,
  ComponentDeserializeFunction,
  ComponentUpdateFunction,
  getComponent
} from '../../ecs/functions/ComponentFunctions'
import EditorDirectionalLightHelper from '../classes/EditorDirectionalLightHelper'
import { DirectionalLightComponent } from '../components/DirectionalLightComponent'
import { Object3DComponent } from '../components/Object3DComponent'

export const createDirectionalLight: ComponentDeserializeFunction = (entity: Entity, json: ComponentJson) => {
  const light = new DirectionalLight()

  light.target.position.set(0, 0, 1)
  light.target.name = 'light-target'
  light.add(light.target)

  if (Engine.isEditor) {
    const helper = new EditorDirectionalLightHelper()
    helper.visible = true
    light.add(helper)
    light.userData.helper = helper

    const cameraHelper = new CameraHelper(light.shadow.camera)
    cameraHelper.visible = false
    light.userData.cameraHelper = cameraHelper
  }

  addComponent(entity, Object3DComponent, { value: light })
  addComponent(entity, DirectionalLightComponent, {
    ...json.props,
    color: new Color(json.props.color),
    shadowMapResolution: new Vector2().fromArray(json.props.shadowMapResolution)
  })

  updateDirectionalLight(entity)
}

export const updateDirectionalLight: ComponentUpdateFunction = (entity: Entity) => {
  const component = getComponent(entity, DirectionalLightComponent)
  const light = getComponent(entity, Object3DComponent)?.value as DirectionalLight

  light.color.set(component.color)
  light.intensity = component.intensity
  light.shadow.camera.far = component.cameraFar
  light.shadow.bias = component.shadowBias
  light.shadow.radius = component.shadowRadius
  light.castShadow = component.castShadow

  light.shadow.mapSize.copy(component.shadowMapResolution)
  light.shadow.map?.dispose()
  light.shadow.map = null as any

  light.shadow.camera.updateProjectionMatrix()
  light.shadow.needsUpdate = true

  if (Engine.isEditor) {
    light.userData.helper.update()
    light.userData.cameraHelper.visible = component.showCameraHelper

    if (component.showCameraHelper) {
      Engine.scene.add(light.userData.cameraHelper)
    } else {
      Engine.scene.remove(light.userData.cameraHelper)
    }

    light.userData.cameraHelper.update()
  }
}
