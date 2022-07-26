import { createState, useState } from '@speigg/hookstate'

export const LoadingSystemState = createState({
  loadingScreenOpacity: 0
})
export const accessLoadingSystemState = () => LoadingSystemState
export const useLoadingSystemState = () =>
  useState(LoadingSystemState) as any as typeof LoadingSystemState as typeof LoadingSystemState
