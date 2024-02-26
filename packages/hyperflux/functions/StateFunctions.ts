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

import { createState, SetInitialStateAction, State, useHookstate } from '@hookstate/core'
import type { Object as _Object, Function, String } from 'ts-toolbelt'

import { Immutable } from '@etherealengine/common/src/Immutability'
import multiLogger from '@etherealengine/common/src/logger'
import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import { resolveObject } from '@etherealengine/common/src/utils/resolveObject'

import { ActionQueueHandle, ActionReceptor } from './ActionFunctions'
import { startReactor } from './ReactorFunctions'
import { HyperFlux, HyperStore } from './StoreFunctions'

export * from '@hookstate/core'

const logger = multiLogger.child({ component: 'hyperflux:State' })

export const NO_PROXY = { noproxy: true }
export const NO_PROXY_STEALTH = { noproxy: true, stealth: true }

export type ReceptorMap = Record<string, ActionReceptor<any>>

export type StateDefinition<S, Receptors extends ReceptorMap> = {
  name: string
  initial: SetInitialStateAction<S>
  receptors?: Receptors
  receptorActionQueue?: ActionQueueHandle
  reactor?: any // why does React.FC break types?
  onCreate?: (store: HyperStore, state: State<S>) => void
}

export const StateDefinitions = new Map<string, StateDefinition<any, ReceptorMap>>()

export const setInitialState = (def: StateDefinition<any, ReceptorMap>) => {
  const initial = typeof def.initial === 'function' ? (def.initial as any)() : JSON.parse(JSON.stringify(def.initial))
  if (HyperFlux.store.stateMap[def.name]) {
    HyperFlux.store.stateMap[def.name].set(initial)
  } else {
    const state = (HyperFlux.store.stateMap[def.name] = createState(initial))
    if (def.onCreate) def.onCreate(HyperFlux.store, state)
    if (def.reactor) {
      const reactor = startReactor(def.reactor)
      HyperFlux.store.stateReactors[def.name] = reactor
    }
  }
}

export function defineState<S, R extends ReceptorMap, StateExtras = unknown>(
  definition: StateDefinition<S, R> & StateExtras
) {
  if (StateDefinitions.has(definition.name)) throw new Error(`State ${definition.name} already defined`)
  StateDefinitions.set(definition.name, definition)
  return definition as StateDefinition<S, R> & { _TYPE: S } & StateExtras
}

export function getMutableState<S, R extends ReceptorMap>(StateDefinition: StateDefinition<S, R>) {
  if (!HyperFlux.store.stateMap[StateDefinition.name]) setInitialState(StateDefinition)
  return HyperFlux.store.stateMap[StateDefinition.name] as State<S>
}

/**
 * Returns the given state as an Immutable type which does not allow mutation
 */
export function getState<S, R extends ReceptorMap>(StateDefinition: StateDefinition<S, R>) {
  if (!HyperFlux.store.stateMap[StateDefinition.name]) setInitialState(StateDefinition)
  return HyperFlux.store.stateMap[StateDefinition.name].get(NO_PROXY_STEALTH) as Immutable<S>
}
/**
 * @internal
 * Will return original type of state without readonly protections
 * @param {StateDefinition} stateDefinition */
export function getStateUnsafe<S, R extends ReceptorMap>(StateDefinition: StateDefinition<S, R>) {
  if (!HyperFlux.store.stateMap[StateDefinition.name]) setInitialState(StateDefinition)
  return HyperFlux.store.stateMap[StateDefinition.name].get(NO_PROXY_STEALTH)
}

export function useMutableState<S, R extends ReceptorMap, P extends string>(
  StateDefinition: StateDefinition<S, R>
): State<S>
export function useMutableState<S, R extends ReceptorMap, P extends string>(
  StateDefinition: StateDefinition<S, R>,
  path: Function.AutoPath<State<S>, P>
): _Object.Path<State<S>, String.Split<P, '.'>>
export function useMutableState<S, R extends ReceptorMap, P extends string>(
  StateDefinition: StateDefinition<S, R>,
  path?: Function.AutoPath<State<S>, P>
): _Object.Path<State<S>, String.Split<P, '.'>> {
  const rootState = getMutableState(StateDefinition)
  const resolvedState = path ? resolveObject(rootState, path as any) : rootState
  return useHookstate(resolvedState) as any
}

const stateNamespaceKey = 'ee.hyperflux'

/**
 * Automatically synchronises specific root paths of a hyperflux state definition with the localStorage.
 * Values get automatically populated if they exist in localStorage and saved when they are changed.
 * @param {StateDefinition} stateDefinition
 * @param {string[]} keys the root paths to synchronise
 *
 * TODO: #7384 this api need to be revisited; we are syncing local state without doing any validation,
 * so if we ever change the acceptable values for a given state key, we will have to do a migration
 * or fallback to a default value, but we can't do that without knowing what the acceptable values are, which means
 * we need to pass in a schema or validator function to this function (we should use ts-pattern for this).
 */
export const syncStateWithLocalStorage = (
  stateDefinition: ReturnType<typeof defineState<any, any>>,
  keys: string[]
) => {
  if (!isClient) return
  const state = getMutableState(stateDefinition)

  for (const key of keys) {
    const storedValue = localStorage.getItem(`${stateNamespaceKey}.${stateDefinition.name}.${key}`)
    if (storedValue !== null && storedValue !== 'undefined') state[key].set(JSON.parse(storedValue))
  }

  state.attach(() => ({
    id: Symbol('syncStateWithLocalStorage'),
    init: () => ({
      onSet(arg) {
        for (const key of keys) {
          if (state[key].value === undefined)
            localStorage.removeItem(`${stateNamespaceKey}.${stateDefinition.name}.${key}`)
          else
            localStorage.setItem(
              `${stateNamespaceKey}.${stateDefinition.name}.${key}`,
              JSON.stringify(state[key].get({ noproxy: true }))
            )
        }
      }
    })
  }))
}
