import { State } from '@speigg/hookstate'

import { Action, ActionReceptor } from './ActionFunctions'

export const allowStateMutations = Symbol('allowMutations')

export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never
export interface HyperStore<StoreName extends string> {
  /**
   * The name of this store, used for logging and type checking.
   */
  name: StringLiteral<StoreName>
  /**
   *  If this store is networked, actions are dispatched on the outgoing queue.
   *  If this store is not networked, actions are dispatched on the incoming queue.
   */
  networked: boolean
  /**
   * A function which returns the dispatch id assigned to actions
   * */
  getDispatchId: () => string
  /**
   * A function which returns the current dispatch time (units are arbitrary)
   */
  getDispatchTime: () => number
  /**
   * The default dispatch delay (default is 0)
   */
  defaultDispatchDelay: number
  /**
   *
   */
  [allowStateMutations]: boolean
  /**
   * State dictionary
   */
  state: { [name: string]: State<any> }
  actions: {
    /** Cached actions */
    cached: Array<Required<Action<StoreName>>>
    /** Incoming actions */
    incoming: Array<Required<Action<StoreName>>>
    /** All incoming actions that have been proccessed */
    incomingHistory: Array<Required<Action<StoreName>>>
    /** All incoming action UUIDs that have been processed */
    incomingHistoryUUIDs: Set<string>
    /** Outgoing actions */
    outgoing: Array<Required<Action<StoreName>>>
    /** All actions that have been sent */
    outgoingHistory: Array<Required<Action<StoreName>>>
  }
  /** functions that receive actions */
  receptors: ReadonlyArray<ActionReceptor<StoreName>>
  /** functions that re-run on state changes, compatible w/ React hooks */
  reactors: WeakMap<() => void, any>
}

function createHyperStore<StoreName extends string>(options: {
  name: StringLiteral<StoreName>
  networked?: boolean
  getDispatchId: () => string
  getDispatchTime: () => number
  defaultDispatchDelay?: number
}) {
  return {
    name: options.name,
    networked: options.networked ?? false,
    getDispatchId: options.getDispatchId,
    getDispatchTime: options.getDispatchTime,
    defaultDispatchDelay: options.defaultDispatchDelay ?? 0,
    [allowStateMutations]: false,
    state: {},
    actions: {
      cached: [],
      incoming: [],
      incomingHistory: [],
      incomingHistoryUUIDs: new Set(),
      outgoing: [],
      outgoingHistory: []
    },
    receptors: [],
    reactors: new WeakMap()
  } as HyperStore<StoreName>
}

// function destroyStore(store = getStore()) {
//     for (const reactor of [...store.reactors]) {
//         StateFunctions.removeStateReactor(reactor)
//     }
// }

export default {
  createHyperStore
}
