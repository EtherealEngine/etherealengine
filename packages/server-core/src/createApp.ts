// Do not delete json and urlencoded, they are used even if some IDEs show them as unused
import express, { errorHandler, json, rest, urlencoded } from '@feathersjs/express'
import { feathers } from '@feathersjs/feathers'
import * as k8s from '@kubernetes/client-node'
import compress from 'compression'
import cors from 'cors'
import { EventEmitter } from 'events'
// Do not delete, this is used even if some IDEs show it as unused
import swagger from 'feathers-swagger'
import sync from 'feathers-sync'
import { parse, stringify } from 'flatted'
import helmet from 'helmet'
import path from 'path'

import { isDev } from '@etherealengine/common/src/config'
import { pipe } from '@etherealengine/common/src/utils/pipe'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { createEngine } from '@etherealengine/engine/src/initializeEngine'
import { initializeNode } from '@etherealengine/engine/src/initializeNode'
import { getMutableState } from '@etherealengine/hyperflux'

import { Application } from '../declarations'
import appConfig from './appconfig'
import config from './appconfig'
import { createDefaultStorageProvider, createIPFSStorageProvider } from './media/storageprovider/storageprovider'
import mysql from './mysql'
import sequelize from './sequelize'
import { elasticOnlyLogger, logger } from './ServerLogger'
import { ServerMode, ServerState, ServerTypeMode } from './ServerState'
import services from './services'
import authentication from './user/authentication'
import primus from './util/primus'

require('fix-esm').register()

export const configureOpenAPI = () => (app: Application) => {
  app.configure(
    swagger({
      ui: swagger.swaggerUI({
        docsPath: '/openapi'
        // docsJsonPath: '/openapi.json',
        // indexFile: path.join(process.cwd() + '/openapi.html')
      }),
      specs: {
        info: {
          title: 'Ethereal Engine API Surface',
          description: 'APIs for the Ethereal Engine application',
          version: '1.0.0'
        },
        schemes: ['https'],
        securityDefinitions: {
          bearer: {
            type: 'apiKey',
            in: 'header',
            name: 'authorization'
          }
        },
        security: [{ bearer: [] }]
      }
    })
  )
  return app
}

export const configurePrimus =
  (instanceserver = false) =>
  (app: Application) => {
    const origin = [
      'https://' + appConfig.server.clientHost,
      'capacitor://' + appConfig.server.clientHost,
      'ionic://' + appConfig.server.clientHost
    ]
    if (!instanceserver) origin.push('https://localhost:3001')
    app.configure(
      primus(
        {
          transformer: 'websockets',
          origins: origin,
          methods: ['OPTIONS', 'GET', 'POST'],
          headers: '*',
          credentials: true
        },
        (primus) => {
          primus.use((message, socket, next) => {
            ;(message as any).feathers.socketQuery = message.query
            ;(message as any).socketQuery = message.query
            next()
          })
        }
      )
    )
    return app
  }

export const configureRedis = () => (app: Application) => {
  if (appConfig.redis.enabled) {
    // https://github.com/feathersjs-ecosystem/feathers-sync/issues/140#issuecomment-810144263
    app.configure(
      sync({
        uri: appConfig.redis.password
          ? `redis://:${appConfig.redis.password}@${appConfig.redis.address}:${appConfig.redis.port}`
          : `redis://${appConfig.redis.address}:${appConfig.redis.port}`,
        serialize: stringify,
        deserialize: parse
      })
    )
    app.sync.ready.then(() => {
      logger.info('Feathers-sync started.')
    })
  }
  return app
}

export const configureK8s = () => (app: Application) => {
  logger.info(`kubernetes enabled? = ${appConfig.kubernetes.enabled} !`)
  //if (appConfig.kubernetes.enabled) {
  logger.info('kubernetes enabled starting pods.')
  const kc = new k8s.KubeConfig()
  kc.loadFromDefault()
  const serverState = getMutableState(ServerState)

  const k8AgonesClient = kc.makeApiClient(k8s.CustomObjectsApi)
  const k8DefaultClient = kc.makeApiClient(k8s.CoreV1Api)
  const k8AppsClient = kc.makeApiClient(k8s.AppsV1Api)
  const k8BatchClient = kc.makeApiClient(k8s.BatchV1Api)

  serverState.merge({
    k8AppsClient,
    k8BatchClient,
    k8DefaultClient,
    k8AgonesClient
  })
  //}
  return app
}

export const serverPipe = pipe(configureOpenAPI(), configurePrimus(), configureRedis(), configureK8s()) as (
  app: Application
) => Application

export const createFeathersExpressApp = (
  serverMode: ServerTypeMode = ServerMode.API,
  configurationPipe = serverPipe
): Application => {
  createDefaultStorageProvider()

  if (appConfig.ipfs.enabled) {
    createIPFSStorageProvider()
  }

  createEngine()
  getMutableState(EngineState).publicPath.set(config.client.dist)
  if (!appConfig.db.forceRefresh) {
    initializeNode()
  }

  const app = express(feathers()) as Application

  Engine.instance.api = app

  const serverState = getMutableState(ServerState)
  serverState.serverMode.set(serverMode)

  app.set('nextReadyEmitter', new EventEmitter())

  // Feathers authentication-oauth will only append the port in production, but then it will also
  // hard-code http as the protocol, so manually mashing host + port together if in local.
  app.set(
    'host',
    appConfig.server.local ? appConfig.server.hostname + ':' + appConfig.server.port : appConfig.server.hostname
  )
  app.set('port', appConfig.server.port)

  app.set('paginate', appConfig.server.paginate)
  app.set('authentication', appConfig.authentication)

  configurationPipe(app)

  // Feathers authentication-oauth will use http for its redirect_uri if this is 'dev'.
  // Doesn't appear anything else uses it.
  app.set('env', 'production')

  app.configure(sequelize)

  // Enable security, CORS, compression, favicon and body parsing
  app.use(helmet())
  app.use(
    cors({
      origin: true,
      credentials: true
    }) as any
  )

  app.use(compress())
  app.use(json())
  app.use(urlencoded({ extended: true }))

  app.configure(rest())
  // app.use(function (req, res, next) {
  //   ;(req as any).feathers.req = req
  //   ;(req as any).feathers.res = res
  //   next()
  // })

  app.configure(mysql)

  // Configure other middleware (see `middleware/index.js`)
  app.configure(authentication)

  // Set up our services (see `services/index.js`)
  app.configure(services)

  app.use('/healthcheck', (req, res) => {
    res.sendStatus(200)
  })

  // Receive client-side log events (only active when APP_ENV != 'development')
  app.post('/api/log', (req, res) => {
    const { msg, ...mergeObject } = req.body
    if (!isDev) elasticOnlyLogger.info({ user: req.params?.user, ...mergeObject }, msg)
    return res.status(204).send()
  })

  app.use(errorHandler({ logger }))

  return app
}
