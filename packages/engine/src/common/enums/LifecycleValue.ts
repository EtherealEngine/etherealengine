export const LifecycleValue = {
  Started: 'Started' as const,
  Ended: 'Ended' as const,
  Changed: 'Changed' as const,
  Unchanged: 'Unchanged' as const
}

export type LifecycleValueType = typeof LifecycleValue[keyof typeof LifecycleValue]
