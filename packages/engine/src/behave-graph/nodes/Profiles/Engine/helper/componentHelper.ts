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

import { NodeCategory, NodeDefinition, makeFlowNodeDefinition } from '@behave-graph/core'
import { toQuat, toVector3, toVector4 } from '@behave-graph/scene'
import { Color, Matrix3, Matrix4, Quaternion, Vector2, Vector3, Vector4 } from 'three'
import { AvatarAnimationComponent } from '../../../../../avatar/components/AvatarAnimationComponent'
import { Entity, UndefinedEntity } from '../../../../../ecs/classes/Entity'
import { Component, ComponentMap, getComponent, setComponent } from '../../../../../ecs/functions/ComponentFunctions'
import { PostProcessingComponent } from '../../../../../scene/components/PostProcessingComponent'
import { TransformComponent } from '../../../../../transform/components/TransformComponent'

const skipComponents = [
  TransformComponent.name, // already implemented
  PostProcessingComponent.name, //needs special attention
  AvatarAnimationComponent.name // needs special attention
]

export function generateComponentNodeschema(component: Component) {
  const nodeschema = {}
  const getType = (name, value) => {
    switch (typeof value) {
      case 'number':
        if (name.toLowerCase().includes('entity')) nodeschema[name] = 'entity'
        else {
          nodeschema[name] = 'float'
        }
        // use float
        break
      case 'boolean':
        nodeschema[name] = 'boolean'
        // use boolean
        break
      case 'string':
      case 'undefined':
        nodeschema[name] = 'string'
      case 'object':
        if (value instanceof Vector2) {
          nodeschema[name] = 'vec2'
        } else if (value instanceof Vector3) {
          nodeschema[name] = 'vec3'
        } else if (value instanceof Vector4) {
          nodeschema[name] = 'vec4'
        } else if (value instanceof Quaternion) {
          nodeschema[name] = 'quat'
        } else if (value instanceof Matrix4) {
          nodeschema[name] = 'mat4'
        } else if (value instanceof Matrix3) {
          nodeschema[name] = 'mat3'
        } else if (value instanceof Color) {
          nodeschema[name] = 'color'
        }
        break
      case 'function':
        break
      default: // for objects will handle them later maybe decompose furthur?
        break
      // use string
    }
  }
  if (skipComponents.includes(component.name)) return nodeschema
  const schema = component?.onInit(UndefinedEntity)
  if (schema === null) {
    return nodeschema
  }
  if (schema === undefined) {
    return nodeschema
  }
  if (typeof schema !== 'object') {
    const tag = component.name.replace('Component', '')
    getType(tag, schema)
    return nodeschema
  }
  //console.log("DEBUG", component.name )
  for (const [name, value] of Object.entries(schema)) {
    getType(name, value)
  }
  //console.log("DEBUG", nodeschema )
  return nodeschema
}

export function NodetoEnginetype(value, valuetype) {
  switch (valuetype) {
    case 'float':
    case 'integer':
      return Number(value)
      break
    case 'string':
      return String(value)
    case 'vec3':
    case 'vec2':
      return toVector3(value)
    case 'quat':
      return toQuat(value)
    case 'vec4':
      return toVector4(value)
    case 'mat4':
      return new Matrix4().fromArray(value.elements)
    case 'mat3':
      return new Matrix3().fromArray(value.elements)
    case 'color':
      return new Color().setFromVector3(value)
    case 'boolean':
      return Boolean(value)
    default:
  }
}

export function EnginetoNodetype(value) {
  if (typeof value === 'object') {
    if (value instanceof Color) {
      const style = value.getStyle() // 'rgb(255, 0, 0)'
      const rgbValues = style.match(/\d+/g)!.map(Number)
      return new Vector3(rgbValues[0], rgbValues[1], rgbValues[2])
    }
  }
  return value
}

export function getComponentSetters() {
  const setters: NodeDefinition[] = []
  const skipped: string[] = []
  for (const [componentName, component] of ComponentMap) {
    if (skipComponents.includes(componentName)) {
      skipped.push(componentName)
      continue
    }
    const inputsockets = generateComponentNodeschema(component)
    if (Object.keys(inputsockets).length === 0) {
      skipped.push(componentName)
      continue
    }
    const node = makeFlowNodeDefinition({
      typeName: `engine/component/set${componentName}`,
      category: NodeCategory.Action,
      label: `set ${componentName}`,
      in: {
        flow: 'flow',
        entity: 'entity',
        ...inputsockets
      },
      out: { flow: 'flow', entity: 'entity' },
      initialState: undefined,
      triggered: ({ read, write, commit, graph }) => {
        const entity = Number.parseInt(read('entity')) as Entity
        //read from the read and set dict acccordingly
        const inputs = Object.entries(node.in).splice(2)
        //console.log("DEBUG",inputs)
        const values = {}
        for (const [input, type] of inputs) {
          values[input] = NodetoEnginetype(read(input as any), type)
        }
        //console.log("DEBUG",values)
        setComponent(entity, component, values)
        write('entity', entity)
        commit('flow')
      }
    })
    setters.push(node)
  }
  return setters
}

export function getComponentGetters() {
  const getters: NodeDefinition[] = []
  const skipped: string[] = []
  for (const [componentName, component] of ComponentMap) {
    if (skipComponents.includes(componentName)) {
      skipped.push(componentName)
      continue
    }
    const outputsockets = generateComponentNodeschema(component)
    if (Object.keys(outputsockets).length === 0) {
      skipped.push(componentName)
      continue
    }
    const node = makeFlowNodeDefinition({
      typeName: `engine/component/get${componentName}`,
      category: NodeCategory.Query,
      label: `get ${componentName}`,
      in: {
        flow: 'flow',
        entity: 'entity'
      },
      out: {
        flow: 'flow',
        entity: 'entity',
        ...outputsockets
      },
      initialState: undefined,
      triggered: ({ read, write, commit, graph }) => {
        const entity = Number.parseInt(read('entity')) as Entity
        const props = getComponent(entity, component)
        const outputs = Object.entries(node.out).splice(2)
        console.log('DEBUG props ', props, 'outputs ', outputs)
        if (typeof props !== 'object') {
          console.log(outputs[outputs.length - 1][0], props)
          write(outputs[outputs.length - 1][0] as any, EnginetoNodetype(props))
        } else {
          for (const [output, type] of outputs) {
            write(output as any, EnginetoNodetype(props[output]))
          }
        }
        write('entity', entity)
        commit('flow')
      }
    })
    getters.push(node)
  }
  return getters
}
