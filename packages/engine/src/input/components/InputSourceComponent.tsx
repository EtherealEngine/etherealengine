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

import React from 'react'
import { useLayoutEffect } from 'react'

import { none, State, useHookstate } from '@etherealengine/hyperflux'

import { Entity, UndefinedEntity } from '../../ecs/classes/Entity'
import {
  defineComponent,
  getComponent,
  getMutableComponent,
  getOptionalComponent,
  hasComponent,
  setComponent,
  useComponent
} from '../../ecs/functions/ComponentFunctions'
import { useEntityContext } from '../../ecs/functions/EntityFunctions'
import { XRSpaceComponent } from '../../xr/XRComponents'
import { ButtonInputStateType } from '../InputState'
import { InputComponent } from './InputComponent'

export const InputSourceComponent = defineComponent({
  name: 'InputSourceComponent',

  onInit: () => {
    return {
      source: null! as XRInputSource,
      buttons: {} as Readonly<ButtonInputStateType>,
      assignedEntity: UndefinedEntity as Entity,
      captured: false
    }
  },

  onSet: (entity, component, args: { source: XRInputSource; assignedEntity?: Entity }) => {
    const { source, assignedEntity } = args
    component.source.set(source)
    component.assignedEntity.set(assignedEntity ?? UndefinedEntity)
    InputSourceComponent.entitiesByInputSource.set(args.source, entity)
    setComponent(entity, XRSpaceComponent, source.targetRaySpace)
  },

  entitiesByInputSource: new WeakMap<XRInputSource>(),

  capture: (sourceEntity: Entity, targetEntity?: Entity) => {
    if (!hasComponent(sourceEntity, InputSourceComponent))
      throw new Error('InputSourceComponent not found for entity ' + sourceEntity)

    const inputSourceComponent = getMutableComponent(sourceEntity, InputSourceComponent)
    if (targetEntity) inputSourceComponent.assignedEntity.set(targetEntity)
    inputSourceComponent.captured.set(true)
  },

  release: (sourceEntity: Entity) => {
    const inputSourceComponent = getMutableComponent(sourceEntity, InputSourceComponent)
    inputSourceComponent.captured.set(false)
  },

  isAssigned: (targetEntity: Entity) => {
    const sourceEntities = getOptionalComponent(targetEntity, InputComponent)?.inputSources
    return !!sourceEntities?.find((sourceEntity) => {
      const inputSourceComponent = getComponent(sourceEntity, InputSourceComponent)
      return inputSourceComponent.assignedEntity === targetEntity
    })
  },

  reactor: () => {
    const entity = useEntityContext()
    const inputSource = useComponent(entity, InputSourceComponent)
    const assignedEntity = inputSource.assignedEntity
    return <InputSourceAssignmentReactor key={assignedEntity.value} assignedEntity={assignedEntity} />
  }
})

/**
 *
 * @param props
 * @returns
 */
const InputSourceAssignmentReactor = (props: { assignedEntity: State<Entity> }) => {
  const assignedInputEntity = useHookstate(props.assignedEntity)
  const inputSink = useComponent(assignedInputEntity.value, InputComponent)

  useLayoutEffect(() => {
    inputSink.inputSources.merge([assignedInputEntity.value])
    const assignedInputEntityValue = assignedInputEntity.value
    return () => {
      const idx = inputSink.inputSources.keys.indexOf(assignedInputEntityValue)
      idx > -1 && inputSink.inputSources[idx].set(none)
    }
  }, [assignedInputEntity])

  return null
}
