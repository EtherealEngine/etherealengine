import { ServerPodInfo } from '@xrengine/common/src/interfaces/ServerInfo'

export interface ServerColumn {
  id: string
  label: JSX.Element
  minWidth?: number
  align?: 'right'
}

export interface ServerPodData {
  el: ServerPodInfo
  name: string
  status: string
  type: string
  currentUsers: string
  age: string
  containers: JSX.Element
  restarts: string
  instanceId: string
  action: JSX.Element
}
