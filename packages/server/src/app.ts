import express, { errorHandler, json, rest, urlencoded } from '@feathersjs/express'
import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio'
import * as k8s from '@kubernetes/client-node'
import compress from 'compression'
import cors from 'cors'
import { EventEmitter } from 'events'
import feathersLogger from 'feathers-logger'
import swagger from 'feathers-swagger'
import sync from 'feathers-sync'
import helmet from 'helmet'
import path from 'path'
import favicon from 'serve-favicon'
import winston from 'winston'

import { isDev } from '@xrengine/common/src/utils/isDev'
import { Application } from '@xrengine/server-core/declarations'
import config from '@xrengine/server-core/src/appconfig'
import logger from '@xrengine/server-core/src/logger'
import sequelize from '@xrengine/server-core/src/sequelize'
import services from '@xrengine/server-core/src/services'
import authentication from '@xrengine/server-core/src/user/authentication'

import channels from './channels'

const emitter = new EventEmitter()

export const createApp = () => {
  // @ts-ignore
  const app = express(feathers()) as any as Application

  app.set('nextReadyEmitter', emitter)

  try {
    app.configure(
      swagger({
        docsPath: '/openapi',
        docsJsonPath: '/openapi.json',
        uiIndex: path.join(process.cwd() + '/openapi.html'),
        // TODO: Relate to server config, don't hardcode this here
        specs: {
          info: {
            title: 'XREngine API Surface',
            description: 'APIs for the XREngine application',
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

    //Feathers authentication-oauth will use http for its redirect_uri if this is 'dev'.
    //Doesn't appear anything else uses it.
    app.set('env', 'production')
    //Feathers authentication-oauth will only append the port in production, but then it will also
    //hard-code http as the protocol, so manually mashing host + port together if in local.
    app.set('host', config.server.local ? config.server.hostname + ':' + config.server.port : config.server.hostname)
    app.set('port', config.server.port)
    app.set('paginate', config.server.paginate)
    app.set('authentication', config.authentication)

    app.configure(sequelize)

    // Enable security, CORS, compression, favicon and body parsing
    app.use(helmet())
    app.use(
      cors({
        origin: true,
        credentials: true
      })
    )
    app.use(compress())
    app.use(urlencoded({ extended: true }))
    app.use(json())
    app.use(favicon(path.join(config.server.publicDir, 'favicon.ico')))

    // Set up Plugins and providers
    app.configure(rest())
    app.configure(
      socketio(
        {
          serveClient: false,
          cors: {
            origin: [
              'https://' + config.server.clientHost,
              'capacitor://' + config.server.clientHost,
              'ionic://' + config.server.clientHost,
              'https://localhost:3001'
            ],
            methods: ['OPTIONS', 'GET', 'POST'],
            allowedHeaders: '*',
            credentials: true
          }
        },
        (io) => {
          io.use((socket, next) => {
            ;(socket as any).feathers.socketQuery = socket.handshake.query
            ;(socket as any).socketQuery = socket.handshake.query
            next()
          })
        }
      )
    )

    if (config.redis.enabled) {
      app.configure(
        sync({
          uri:
            config.redis.password != null && config.redis.password !== ''
              ? `redis://${config.redis.address}:${config.redis.port}?password=${config.redis.password}`
              : `redis://${config.redis.address}:${config.redis.port}`
        })
      )
      app.sync.ready.then(() => {
        logger.info('Feathers-sync started')
      })
    }

    // Configure other middleware (see `middleware/index.js`)
    app.configure(authentication)
    // Set up our services (see `services/index.js`)

    app.configure(feathersLogger(winston))
    app.configure(services)
    // Set up event channels (see channels.js)
    app.configure(channels)

    if (config.server.mode !== 'local') {
      const kc = new k8s.KubeConfig()
      kc.loadFromDefault()

      app.k8AgonesClient = kc.makeApiClient(k8s.CustomObjectsApi)
      app.k8DefaultClient = kc.makeApiClient(k8s.CoreV1Api)
      app.k8AppsClient = kc.makeApiClient(k8s.AppsV1Api)
      app.k8BatchClient = kc.makeApiClient(k8s.BatchV1Api)
    }

    app.use('/healthcheck', (req, res) => {
      res.sendStatus(200)
    })

    if (isDev && !config.db.forceRefresh) {
      app.isSetup.then(() => {
        app.service('project')._fetchDevLocalProjects()
      })
    }
  } catch (err) {
    console.log('Server init failure')
    console.log(err)
  }

  app.use(errorHandler({ logger } as any))

  return app
}
