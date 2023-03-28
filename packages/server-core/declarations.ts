import type { Application as ExpressFeathers } from '@feathersjs/express'
// For more information about this file see https://dove.feathersjs.com/guides/cli/typescript.html
import { HookContext as FeathersHookContext } from '@feathersjs/feathers'
import { ServiceSwaggerOptions } from 'feathers-swagger'
import Primus from 'primus'

import '@feathersjs/transport-commons'

import * as k8s from '@kubernetes/client-node'

import { ServiceTypes } from '@etherealengine/common/declarations'

export const ServerMode = {
  API: 'API' as const,
  Instance: 'Instance' as const,
  Task: 'Task' as const
}

export type ServerTypeMode = typeof ServerMode[keyof typeof ServerMode]

export type PrimusType = Primus & {
  forEach(cb: (spark: Primus.Spark, id: string, connections: { [id: string]: Primus.Spark }) => boolean | void): Primus
  use(name: string, fn: (req: any, res: any, next: any) => void, level?: number): Primus
}

export type Application = ExpressFeathers<ServiceTypes> & {
  // Common
  k8AgonesClient: k8s.CustomObjectsApi
  k8DefaultClient: k8s.CoreV1Api
  k8AppsClient: k8s.AppsV1Api
  k8BatchClient: k8s.BatchV1Api
  agonesSDK: any
  sync: any
  primus: PrimusType
  seed: () => Application // function
  serverMode: ServerTypeMode

  // Instanceserver
  instance: any // todo: make type 'Instance'
  isSubdomainNumber: string
  isChannelInstance: boolean
  instanceServer: any
  isSetup: Promise<boolean>
  restart: () => void

  // API Server
}

/**
 * Ref: https://feathersjs-ecosystem.github.io/feathers-swagger/#/?id=configure-the-documentation-for-a-feathers-service
 */
declare module '@feathersjs/feathers' {
  interface ServiceOptions {
    docs?: ServiceSwaggerOptions
  }
}

// The context for hook functions - can be typed with a service class
export type HookContext<S = any> = FeathersHookContext<Application, S>
