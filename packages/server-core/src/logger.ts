/**
 * A server-side only multi-stream logger.
 * For isomorphic or client-side logging, use packages/common/src/logger.ts
 * (which will send all log events to this server-side logger here, via an
 *  API endpoint).
 */
import os from 'os'
import pino from 'pino'
import pinoElastic from 'pino-elasticsearch'
import pretty from 'pino-pretty'

const node = process.env.ELASTIC_HOST || 'http://localhost:9200'

const streamToPretty = pretty({
  colorize: true
})

const streamToElastic = pinoElastic({
  index: 'xr-engine',
  consistency: 'one',
  node: node,
  'es-version': 7,
  'flush-bytes': 1000
})

const streams = [streamToPretty, streamToElastic]

const logger = pino(
  {
    level: 'debug',
    base: {
      hostname: os.hostname,
      component: 'server-core'
    }
  },
  pino.multistream(streams)
)

export default logger
