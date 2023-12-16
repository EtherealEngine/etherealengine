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

import { koa } from '@feathersjs/koa'
import packageRoot from 'app-root-path'
import fs from 'fs'
import https from 'https'
import favicon from 'koa-favicon'
import sendFile from 'koa-send'
import serve from 'koa-static'
import { join } from 'path'
import psList from 'ps-list'

import config from '@etherealengine/server-core/src/appconfig'
import { createFeathersKoaApp } from '@etherealengine/server-core/src/createApp'
import { StartCorsServer } from '@etherealengine/server-core/src/createCorsServer'
import multiLogger from '@etherealengine/server-core/src/ServerLogger'
import { ServerMode } from '@etherealengine/server-core/src/ServerState'

import { projectPath } from '@etherealengine/engine/src/schemas/projects/project.schema'
import channels from './channels'

const logger = multiLogger.child({ component: 'server-core:user' })

process.on('unhandledRejection', (error, promise) => {
  logger.error(error, 'UNHANDLED REJECTION - Promise: %o', promise)
})

export const start = async (): Promise<void> => {
  const app = createFeathersKoaApp(ServerMode.API)

  app.use(favicon(join(config.server.publicDir, 'favicon.ico')))
  app.configure(channels)

  if (!config.kubernetes.enabled && !config.db.forceRefresh && !config.testEnabled) {
    app.isSetup.then(() => {
      app.service(projectPath)._fetchDevLocalProjects()
    })
  }

  const key = process.platform === 'win32' ? 'name' : 'cmd'
  if (!config.kubernetes.enabled) {
    const processList = await (
      await psList()
    ).filter((e) => {
      const regexp = /docker-compose up|docker-proxy|mysql/gi
      return e[key]?.match(regexp)
    })
    const dockerProcess = processList.find((c) => c[key]?.match(/docker-compose/))
    const dockerProxy = processList.find((c) => c[key]?.match(/docker-proxy/))
    const processMysql = processList.find((c) => c[key]?.match(/mysql/))
    const databaseService = (dockerProcess && dockerProxy) || processMysql

    if (!databaseService) {
      // Check for child process with mac OSX
      // exec("docker ps | grep mariadb", (err, stdout, stderr) => {
      //   if(!stdout.includes("mariadb")){
      //     throw new Error('\x1b[33mError: DB process is not running or Docker is not running!. If you are in local development, please run etherealengine/scripts/start-containers.sh and restart server\x1b[0m');
      //   }
      // });
    }
  }

  // SSL setup
  const certPath = config.server.certPath
  const certKeyPath = config.server.keyPath

  const useSSL = !config.noSSL && (config.localBuild || !config.kubernetes.enabled) && fs.existsSync(certKeyPath)

  const certOptions = {
    key: useSSL ? fs.readFileSync(certKeyPath) : null,
    cert: useSSL ? fs.readFileSync(certPath) : null
  }

  if (useSSL) {
    logger.info('Starting server with HTTPS')
  } else {
    logger.info("Starting server with NO HTTPS, if you meant to use HTTPS try 'sudo bash generate-certs'")
  }
  const port = Number(config.server.port)

  // http redirects for development
  if (useSSL) {
    app.use(async (ctx, next) => {
      if (ctx.secure) {
        // request was via https, so do no special handling
        await next()
      } else {
        // request was via http, so redirect to https
        ctx.redirect('https://' + ctx.headers.host + ctx.url)
      }
    })
  }

  const server = useSSL ? https.createServer(certOptions as any, app.callback()).listen(port) : await app.listen(port)

  if (useSSL) {
    app.setup(server)
  }

  process.on('unhandledRejection', (error, promise) => {
    logger.error(error, 'UNHANDLED REJECTION - Promise: %o', promise)
  })
  server.on('listening', () =>
    logger.info('Feathers application started on %s://%s:%d', useSSL ? 'https' : 'http', config.server.hostname, port)
  )

  if (!config.kubernetes.enabled) {
    StartCorsServer(useSSL, certOptions)
  }

  if (
    process.env.SERVE_CLIENT_FROM_API &&
    !process.env.SERVE_CLIENT_FROM_STORAGE_PROVIDER &&
    process.env.SERVE_CLIENT_FROM_STORAGE_PROVIDER !== 'true'
  ) {
    const clientApp = koa()
    clientApp.use(
      serve(join(packageRoot.path, 'packages', 'client', 'dist'), {
        brotli: true,
        setHeaders: (ctx) => {
          ctx.setHeader('Origin-Agent-Cluster', '?1')
        }
      })
    )
    clientApp.use(async (ctx) => {
      await sendFile(ctx, join('dist', 'index.html'), {
        root: join(packageRoot.path, 'packages', 'client')
      })
    })
    clientApp.listen = function () {
      let server
      const HTTPS = process.env.VITE_LOCAL_BUILD ?? false
      if (HTTPS) {
        const key = fs.readFileSync(join(packageRoot.path, process.env.KEY ?? 'certs/key.pem'))
        const cert = fs.readFileSync(join(packageRoot.path, process.env.CERT ?? 'certs/cert.pem'))
        server = https.createServer({ key: key, cert: cert }, this.callback())
      } else {
        const http = require('http')
        server = http.createServer(this.callback())
      }
      // eslint-disable-next-line prefer-spread, prefer-rest-params
      return server.listen.apply(server, arguments)
    }

    const PORT = parseInt(config.client.port) || 3000
    clientApp.listen(PORT, () => console.log(`Client listening on port: ${PORT}`))
  }
}
