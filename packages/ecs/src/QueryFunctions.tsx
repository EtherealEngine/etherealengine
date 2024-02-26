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

import { useForceUpdate } from '@etherealengine/common/src/utils/useForceUpdate'
import { HyperFlux, getStateUnsafe, startReactor, useHookstate } from '@etherealengine/hyperflux'
import * as bitECS from 'bitecs'
import React, { ErrorInfo, FC, Suspense, memo, useEffect, useLayoutEffect, useMemo } from 'react'
import { Component, useOptionalComponent } from './ComponentFunctions'
import { Entity } from './Entity'
import { EntityContext } from './EntityFunctions'
import { defineSystem } from './SystemFunctions'
import { PresentationSystemGroup } from './SystemGroups'
import { SystemState } from './SystemState'

export function defineQuery(components: (bitECS.Component | bitECS.QueryModifier)[]) {
  const query = bitECS.defineQuery(components) as bitECS.Query
  const enterQuery = bitECS.enterQuery(query)
  const exitQuery = bitECS.exitQuery(query)

  const wrappedQuery = () => {
    return query(HyperFlux.store) as Entity[]
  }
  wrappedQuery.enter = () => {
    return enterQuery(HyperFlux.store) as Entity[]
  }
  wrappedQuery.exit = () => {
    return exitQuery(HyperFlux.store) as Entity[]
  }

  wrappedQuery._query = query
  wrappedQuery._enterQuery = enterQuery
  wrappedQuery._exitQuery = exitQuery
  return wrappedQuery
}

export function removeQuery(query: ReturnType<typeof defineQuery>) {
  bitECS.removeQuery(HyperFlux.store, query._query)
  bitECS.removeQuery(HyperFlux.store, query._enterQuery)
  bitECS.removeQuery(HyperFlux.store, query._exitQuery)
}

export type QueryComponents = (Component<any> | bitECS.QueryModifier | bitECS.Component)[]

export const ReactiveQuerySystem = defineSystem({
  uuid: 'ee.hyperflux.ReactiveQuerySystem',
  insert: { after: PresentationSystemGroup },
  execute: () => {
    for (const { query, result } of getStateUnsafe(SystemState).reactiveQueryStates) {
      const entitiesAdded = query.enter().length
      const entitiesRemoved = query.exit().length
      if (entitiesAdded || entitiesRemoved) {
        result.set(query())
      }
    }
  }
})

/**
 * Use a query in a reactive context (a React component)
 */
export function useQuery(components: QueryComponents) {
  const result = useHookstate([] as Entity[])
  const forceUpdate = useForceUpdate()

  // Use an immediate (layout) effect to ensure that `queryResult`
  // is deleted from the `reactiveQueryStates` map immediately when the current
  // component is unmounted, before any other code attempts to set it
  // (component state can't be modified after a component is unmounted)
  useLayoutEffect(() => {
    const query = defineQuery(components)
    result.set(query())
    const queryState = { query, result, components }
    getStateUnsafe(SystemState).reactiveQueryStates.add(queryState)
    return () => {
      removeQuery(query)
      getStateUnsafe(SystemState).reactiveQueryStates.delete(queryState)
    }
  }, [])

  // create an effect that forces an update when any components in the query change
  useEffect(() => {
    const entities = [...result.value]
    const root = startReactor(function useQueryReactor() {
      for (const entity of entities) {
        components.forEach((C) => ('isComponent' in C ? useOptionalComponent(entity, C as any)?.value : undefined))
      }
      forceUpdate()
      return null
    })
    return () => {
      root.stop()
    }
  }, [result])

  return result.value
}

export type Query = ReturnType<typeof defineQuery>

const QuerySubReactor = memo((props: { entity: Entity; ChildEntityReactor: FC }) => {
  return (
    <>
      <QueryReactorErrorBoundary>
        <Suspense fallback={null}>
          <EntityContext.Provider value={props.entity}>
            <props.ChildEntityReactor />
          </EntityContext.Provider>
        </Suspense>
      </QueryReactorErrorBoundary>
    </>
  )
})

export const QueryReactor = memo((props: { Components: QueryComponents; ChildEntityReactor: FC }) => {
  const entities = useQuery(props.Components)
  const MemoChildEntityReactor = useMemo(() => memo(props.ChildEntityReactor), [props.ChildEntityReactor])
  return (
    <>
      {entities.map((entity) => (
        <QuerySubReactor key={entity} entity={entity} ChildEntityReactor={MemoChildEntityReactor} />
      ))}
    </>
  )
})

/**
 * @deprecated use QueryReactor directly
 */
export const createQueryReactor = (Components: QueryComponents, ChildEntityReactor: FC) => {
  return () => <QueryReactor Components={Components} ChildEntityReactor={ChildEntityReactor} />
}

interface ErrorState {
  error: Error | null
}

class QueryReactorErrorBoundary extends React.Component<any, ErrorState> {
  public state: ErrorState = {
    error: null
  }

  public static getDerivedStateFromError(error: Error): ErrorState {
    // Update state so the next render will show the fallback UI.
    return { error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    return this.state.error ? null : this.props.children
  }
}
