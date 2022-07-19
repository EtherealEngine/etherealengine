import { MathUtils } from 'three'

import { World } from '../../ecs/classes/World'

type TransitionType = 'IN' | 'OUT'

export const createTransitionState = (transitionPeriodSeconds: number, initialState: TransitionType = 'OUT') => {
  let currentState = initialState
  let alpha = initialState === 'IN' ? 1 : 0
  let _lastAlpha = -1

  const setState = (state: TransitionType) => {
    currentState = state
  }

  const update = (world: World, callback: (alpha: number) => void) => {
    if (alpha < 1 && currentState === 'IN') alpha += world.deltaSeconds / transitionPeriodSeconds
    if (alpha > 0 && currentState === 'OUT') alpha -= world.deltaSeconds / transitionPeriodSeconds

    if (alpha !== _lastAlpha) {
      alpha = MathUtils.clamp(alpha, 0, 1)
      callback(alpha)
      _lastAlpha = alpha
    }
  }

  return {
    get state() {
      return currentState
    },
    get alpha() {
      return alpha
    },
    setState,
    update
  }
}
