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

import assert from 'assert'
import * as bitECS from 'bitecs'

import { getState } from '@etherealengine/hyperflux'
import { Engine, destroyEngine } from '../../../../src/ecs/classes/Engine'
import { Entity } from '../../../../src/ecs/classes/Entity'
import { hasComponent } from '../../../../src/ecs/functions/ComponentFunctions'
import { entityExists } from '../../../../src/ecs/functions/EntityFunctions'
import { SystemDefinitions } from '../../../../src/ecs/functions/SystemFunctions'
import { createEngine } from '../../../../src/initializeEngine'
import { InputSourceComponent } from '../../../../src/input/components/InputSourceComponent'
import { InputState } from '../../../../src/input/state/InputState'
import { ClientInputSystem, addClientInputListeners } from '../../../../src/input/systems/ClientInputSystem'
import { EngineRenderer } from '../../../../src/renderer/WebGLRendererSystem'
import { NameComponent } from '../../../../src/scene/components/NameComponent'
import { MockDocument } from '../../../util/MockDocument'
import { MockEngineRenderer } from '../../../util/MockEngineRenderer'
import { mockEvent } from '../../../util/MockEvent'
import { MockEventListener } from '../../../util/MockEventListener'
import { MockNavigator } from '../../../util/MockNavigator'
import { MockWindow } from '../../../util/MockWindow'
import { loadEmptyScene } from '../../../util/loadEmptyScene'

describe('addClientInputListeners', () => {
  beforeEach(() => {
    createEngine()
    EngineRenderer.instance = new MockEngineRenderer()
    globalThis.document = new MockDocument() as unknown as Document
    globalThis.navigator = new MockNavigator() as unknown as Navigator
    globalThis.window = new MockWindow() as unknown as Window & typeof globalThis
    loadEmptyScene()
  })

  it('should add client input listeners', () => {
    const cleanup = addClientInputListeners()

    assert(typeof cleanup === 'function')

    const mock: MockEngineRenderer = EngineRenderer.instance as MockEngineRenderer
    const mockDomElm = mock.renderer.domElement as unknown as MockEventListener
    assert(mockDomElm.listeners.length > 1, 'Callbacks were added to canvas')
    mockDomElm.listeners.forEach((listener) => {
      listener(mockEvent)
    })

    const mockDoc = globalThis.document as unknown as MockEventListener
    assert(mockDoc.listeners.length > 1, 'Callbacks were added to document')
    mockDoc.listeners.forEach((listener) => {
      listener(mockEvent)
    })

    const mockWindow = globalThis.window as unknown as MockEventListener
    assert(mockWindow.listeners.length > 1, 'Callbacks were added to window')
    mockWindow.listeners.forEach((listener) => {
      listener(mockEvent)
    })

    const entities = bitECS.getAllEntities(Engine.instance)
    const emulatedInputSourceEntity = entities[entities.length - 1] as Entity

    assert(entityExists(emulatedInputSourceEntity))
    assert(hasComponent(emulatedInputSourceEntity, InputSourceComponent))
    assert(hasComponent(emulatedInputSourceEntity, NameComponent))

    const pointerStatePos = getState(InputState).pointerState.position
    assert(pointerStatePos.x !== 0 && pointerStatePos.y !== 0)

    cleanup()
    assert(mockDomElm.listeners.length === 0, 'Callbacks were removed from canvas')
    assert(mockDoc.listeners.length === 0, 'Callbacks were removed from document')
    assert(mockWindow.listeners.length === 0, 'Callbacks were removed from window')
  })

  afterEach(() => {
    destroyEngine()
  })
})

describe('client input system reactor', () => {
  beforeEach(() => {
    createEngine()
  })

  it('test client input system reactor', async () => {
    const reactor = SystemDefinitions.get(ClientInputSystem)!.reactor!

    assert(typeof reactor === 'function')
    assert(reactor({}) === null)
  })

  afterEach(() => {
    destroyEngine()
  })
})
