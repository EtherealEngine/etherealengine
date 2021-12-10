import { Vector3, Quaternion, Euler } from 'three'
import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { Entity } from '../../ecs/classes/Entity'
import {
  addComponent,
  ComponentDeserializeFunction,
  ComponentSerializeFunction,
  getComponent
} from '../../ecs/functions/ComponentFunctions'
import { ComponentName } from '../../common/constants/ComponentNames'
import { TransformComponent, TransformComponentType } from '../../transform/components/TransformComponent'

let euler = new Euler()
let v3 = new Vector3()

export const deserializeTransform: ComponentDeserializeFunction = (entity: Entity, json: ComponentJson) => {
  const { position, rotation, scale } = json.props
  addComponent(entity, TransformComponent, {
    position: new Vector3(position.x, position.y, position.z),
    rotation: new Quaternion().setFromEuler(euler.setFromVector3(v3.set(rotation.x, rotation.y, rotation.z), 'XYZ')),
    scale: new Vector3(scale.x, scale.y, scale.z)
  })
}

export const serializeTransform: ComponentSerializeFunction = (entity) => {
  const component = getComponent(entity, TransformComponent) as TransformComponentType
  if (!component) return

  return {
    name: ComponentName.TRANSFORM,
    props: {
      position: component.position,
      rotation: euler.setFromQuaternion(component.rotation).toVector3(),
      scale: component.scale
    }
  }
}
