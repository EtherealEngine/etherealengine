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

import { act, render } from '@testing-library/react'
import assert from 'assert'
import React from 'react'

import { getComponent, hasComponent, setComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine, destroyEngine } from '@etherealengine/ecs/src/Engine'
import { loadEmptyScene } from '../../../tests/util/loadEmptyScene'
import { createEngine } from '../../initializeEngine'
import { HighlightComponent } from '../../renderer/components/HighlightComponent'
import { InputComponent } from './InputComponent'

describe('InputComponent', () => {
  beforeEach(() => {
    createEngine()
    loadEmptyScene()
  })

  it('test input component', async () => {
    const entity = Engine.instance.originEntity

    const json = { highlight: true, grow: true }
    setComponent(entity, InputComponent, json)
    const inputComponent = getComponent(entity, InputComponent)

    assert(inputComponent.grow === json.grow)
    assert(inputComponent.highlight === json.highlight)

    inputComponent.inputSources.push(entity)

    const Reactor = InputComponent.reactor
    const tag = <Reactor />
    const { rerender, unmount } = render(tag)

    await act(() => rerender(tag))

    assert(hasComponent(entity, HighlightComponent))

    unmount()
  })

  afterEach(() => {
    return destroyEngine()
  })
})
