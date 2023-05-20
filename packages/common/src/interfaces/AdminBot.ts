export interface AdminBot {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  userId: string
  instanceId: string
  locationId: string
  botCommands?: BotCommands[]
  location?: Location
  instance?: Instance
}

export interface BotCommands {
  id?: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  botId?: string
}

export interface Location {
  id: string
  name: string
  sceneId: string
  slugifiedName: string
  isLobby: boolean
  isFeatured: boolean
  maxUsersPerInstance: number
  createdAt: string
  updatedAt: string
}

export interface Instance {
  id: string
  ipAddress?: string
  channelId?: string
  currentUsers: number
  podName: string
  ended: boolean
  createdAt: string
  updatedAt: string
  locationId?: string
}

export interface CreateBotAsAdmin {
  name: string
  instanceId?: string | null
  userId?: string
  command?: Array<BotCommands>
  description: string
  locationId: string
}

export interface CreateBotCammand {
  name: string
  description?: string
  botId: string
}

export interface BotPod {
  name: string
  status: string
  ip: string
}

export interface BotService {
  name: string
  ip: string
}

export interface SpawnBotPod {
  status: boolean
  message: string
}
