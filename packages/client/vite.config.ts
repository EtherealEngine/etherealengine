import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import appRootPath from 'app-root-path'
import dotenv from 'dotenv'
import fs from 'fs'
import fsExtra from 'fs-extra'
import { isArray, mergeWith } from 'lodash'
import path from 'path'
import { defineConfig, loadEnv, UserConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { createHtmlPlugin } from 'vite-plugin-html'
import PkgConfig from 'vite-plugin-package-config'
import wasm from 'vite-plugin-wasm'

import { getClientSetting } from './scripts/getClientSettings'

const merge = (src, dest) =>
  mergeWith({}, src, dest, function (a, b) {
    if (isArray(a)) {
      return b.concat(a)
    }
  })

require('ts-node').register({
  project: './tsconfig.json'
})

const copyProjectDependencies = () => {
  if (!fs.existsSync(path.resolve(__dirname, '../projects/projects/'))) {
    // create directory
    fs.mkdirSync(path.resolve(__dirname, '../projects/projects/'))
  }
  const projects = fs
    .readdirSync(path.resolve(__dirname, '../projects/projects/'), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
  for (const project of projects) {
    const staticPath = path.resolve(__dirname, `../projects/projects/`, project, 'public')
    if (fs.existsSync(staticPath)) {
      fsExtra.copySync(staticPath, path.resolve(__dirname, `public/projects`, project))
    }
  }
}

const getProjectConfigExtensions = async (config: UserConfig) => {
  const projects = fs
    .readdirSync(path.resolve(__dirname, '../projects/projects/'), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
  for (const project of projects) {
    const staticPath = path.resolve(__dirname, `../projects/projects/`, project, 'vite.config.extension.ts')
    if (fs.existsSync(staticPath)) {
      const { default: viteConfigExtension } = require(staticPath)
      if (typeof viteConfigExtension === 'function') {
        const configExtension = await viteConfigExtension()
        config.plugins = [...config.plugins!, ...configExtension.default.plugins]
        delete configExtension.default.plugins
        config = merge(config, configExtension.default)
      }
    }
  }
  return config as UserConfig
}

// this will copy all files in each installed project's "/static" folder to the "/public/projects" folder
copyProjectDependencies()

export default defineConfig(async () => {
  const env = loadEnv('', process.cwd() + '../../')
  dotenv.config({
    path: appRootPath.path + '/.env.local'
  })
  const clientSetting = await getClientSetting()

  const returned = {
    optimizeDeps: {
      exclude: ['@etherealengine/volumetric', '@automerge/automerge-wasm'],
      include: ['@reactflow/core', '@reactflow/minimap', '@reactflow/controls', '@reactflow/background'],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    plugins: [
      wasm(),
      PkgConfig(),
      // OptimizationPersist(),
      createHtmlPlugin({
        inject: {
          data: {
            title: clientSetting.title || 'Ethereal Engine',
            appleTouchIcon: clientSetting.appleTouchIcon || '/apple-touch-icon.png',
            favicon32px: clientSetting.favicon32px || '/favicon-32x32.png',
            favicon16px: clientSetting.favicon16px || '/favicon-16x16.png',
            icon192px: clientSetting.icon192px || '/android-chrome-192x192.png',
            icon512px: clientSetting.icon512px || '/android-chrome-512x512.png',
            webmanifestLink: clientSetting.webmanifestLink || '/site.webmanifest',
            paymentPointer: clientSetting.paymentPointer || ''
          }
        }
      }),
      viteCompression({
        filter: /\.(js|mjs|json|css)$/i,
        algorithm: 'brotliCompress',
        deleteOriginFile: true
      }),
      viteCommonjs({
        include: ['use-sync-external-store']
      })
    ],
    server: {
      hmr: false,
      host: process.env['VITE_APP_HOST'],
      port: process.env['VITE_APP_PORT']
    },
    resolve: {
      alias: {
        'react-json-tree': 'react-json-tree/umd/react-json-tree',
        '@mui/styled-engine': '@mui/styled-engine-sc/'
      }
    },
    build: {
      target: 'esnext',
      sourcemap: 'inline',
      minify: 'esbuild',
      dynamicImportVarsOptions: {
        warnOnError: true
      },
      rollupOptions: {
        external: ['dotenv-flow', 'fs'],
        output: {
          dir: 'dist',
          format: 'es'
          // we may need this at some point for dynamically loading static asset files from src, keep it here
          // entryFileNames: `assets/[name].js`,
          // chunkFileNames: `assets/[name].js`,
          // assetFileNames: `assets/[name].[ext]`
        }
      }
    }
  } as UserConfig
  if (process.env.APP_ENV === 'development' || process.env.VITE_LOCAL_BUILD === 'true') {
    returned.server!.https = {
      key: fs.readFileSync('../../certs/key.pem'),
      cert: fs.readFileSync('../../certs/cert.pem')
    }
  }
  if (
    process.env.SERVE_CLIENT_FROM_STORAGE_PROVIDER === 'true' &&
    process.env.STORAGE_PROVIDER === 'aws' &&
    process.env.STORAGE_CLOUDFRONT_DOMAIN
  )
    returned.base = `https://${process.env.STORAGE_CLOUDFRONT_DOMAIN}/client/`
  else if (process.env.SERVE_CLIENT_FROM_STORAGE_PROVIDER === 'true' && process.env.STORAGE_PROVIDER === 'local') {
    returned.base = `https://${process.env.LOCAL_STORAGE_PROVIDER}/client/`
  }
  return await getProjectConfigExtensions(returned)
})
