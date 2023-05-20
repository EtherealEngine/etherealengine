/* eslint-disable @typescript-eslint/ban-types */
import { V1Pod, V1PodSpec, V1Probe, V1Service, V1ServiceSpec } from '@kubernetes/client-node'
import request from 'request'

import { BotPod, BotService, SpawnBotPod } from '@etherealengine/common/src/interfaces/AdminBot'
import { getState } from '@etherealengine/hyperflux'
import { Application } from '@etherealengine/server-core/declarations'
import config from '@etherealengine/server-core/src/appconfig'
import serverLogger, { logger } from '@etherealengine/server-core/src/ServerLogger'
import { ServerState } from '@etherealengine/server-core/src/ServerState'

const packageName = 'ee-bot'
const packageUrl = 'https://github.com/SYBIOTE/ee-bot' // to be changed after PR
const servicePort = 4000
let serviceIp = `${packageName}-service.default.svc.cluster.local`

async function waitForCondition(
  conditionFn: () => Promise<Boolean>,
  maxWaitSeconds: number,
  pollingIntervalSeconds: number
): Promise<void> {
  const maxWaitMillis = maxWaitSeconds * 1000
  const pollingIntervalMillis = pollingIntervalSeconds * 1000
  const start = Date.now()
  while (Date.now() < start + maxWaitMillis) {
    const result = await conditionFn()
    if (result) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, pollingIntervalMillis))
  }
  throw new Error(`Timeout waiting for condition after ${maxWaitSeconds} seconds`)
}

export const getBotPodBody = (botid: string) => {
  const podSpec: V1PodSpec = {
    containers: [
      {
        name: 'bot-container',
        image: 'sybiote/ee-bot:latest',
        ports: [
          {
            containerPort: 4000
          }
        ]
      }
    ]
  }

  const pod: V1Pod = {
    metadata: {
      name: `${packageName}-pod-${botid}`,
      labels: {
        app: packageName
      }
    },
    spec: podSpec
  }
  return pod
}

export const getBotServiceBody = () => {
  const serviceSpec: V1ServiceSpec = {
    type: 'ClusterIP',
    ports: [
      {
        name: 'http',
        port: servicePort,
        targetPort: 3000
      }
    ],
    selector: {
      app: packageName
    }
  }
  const service: V1Service = {
    metadata: {
      name: `${packageName}-service`
    },
    spec: serviceSpec
  }
  return service
}

export const findBotPod = async (query = `${packageName}`) => {
  logger.info(`trying to get Pod with query ${query}`)
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  if (k8DefaultClient) {
    try {
      const podsResult = await k8DefaultClient.listNamespacedPod(
        'default',
        undefined,
        undefined,
        undefined,
        `metadata.name=${query}`
      ) // filter metadta label by prefix
      const pods: BotPod[] = []
      for (const pod of podsResult.body.items) {
        pods.push({
          name: pod.metadata!.name!,
          status: pod.status!.phase!,
          ip: pod.status!.podIP!
        })
      }
      logger.info(pods)
      return pods
    } catch (e) {
      serverLogger.error(`${packageName} pod fetch failed`)
      serverLogger.error(e)
      return e
    }
  } else {
    serverLogger.info('k8s client not available!')
  }
}

export const findBotService = async (query = `${packageName}`) => {
  logger.info(`trying to get Service with query ${query}`)
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  if (k8DefaultClient) {
    try {
      const serviceResult = await k8DefaultClient.listNamespacedService(
        'default',
        undefined,
        undefined,
        undefined,
        `metadata.name=${query}`
      ) // filter metadta label by prefix
      const services: BotService[] = []
      for (const service of serviceResult.body.items) {
        services.push({
          name: service.metadata?.name!,
          ip: service.spec?.clusterIP as string
        })
      }
      logger.info(services)
      return services
    } catch (e) {
      serverLogger.error(`${packageName} service fetch failed`)
      serverLogger.error(e)
      return e
    }
  } else {
    serverLogger.info('k8s client not available!')
  }
}

export const createBotService = async () => {
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  const service = getBotServiceBody()
  const serviceName = service.metadata?.name!
  if (k8DefaultClient) {
    try {
      findBotService(serviceName).then((currservice) => {
        if (currservice.length != 0) {
          serverLogger.info('service aleady exists skippping creation')
          serviceIp = currservice[0].ip as string
          return
        }
      })

      k8DefaultClient.createNamespacedService('default', service).then((deployService) => {
        serviceIp = deployService.body.spec?.clusterIP as string
        serverLogger.info(`${packageName} Service created! ip = ${serviceIp}`)
        return deployService
      })
    } catch (e) {
      serverLogger.error(`${packageName} service creation failed`)
      serverLogger.error(e)
      return e
    }
  } else {
    serverLogger.info('k8s client not available!')
  }
}

export const createBotPod = async (data: any) => {
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  const pod = getBotPodBody(data.id)
  const podName = pod.metadata?.name!
  logger.info(`trying to create bot pod with name ${podName}`)
  if (k8DefaultClient) {
    try {
      findBotPod(podName).then((currPod) => {
        if (currPod.length != 0) {
          serverLogger.info(`pod for id ${data.id} already exists skippping creation`)
          return
        }
      })

      k8DefaultClient.createNamespacedPod('default', pod).then((deployPod) => {
        logger.info(`${packageName} Pod created!`)
        return deployPod
      })
    } catch (e) {
      serverLogger.error(`${packageName} pod creation failed`)
      serverLogger.error(e)
      return e
    }
  } else {
    serverLogger.info('k8s client not available!')
  }
}

export const waitBotPodReady = async (podName) => {
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  if (k8DefaultClient) {
    try {
      await waitForCondition(
        async () => {
          const podResponse = await k8DefaultClient.readNamespacedPod(podName, 'default')
          const conditions = podResponse.body.status?.conditions
          const readyCondition = conditions?.find((c) => c.type === 'Ready')
          return readyCondition?.status === 'True'
        },
        300, // maximum time to wait in seconds
        20 // polling interval in seconds
      )
    } catch (e) {
      serverLogger.error(`${packageName} pod creation failed`)
      serverLogger.error(e)
      return e
    }
  }
}

export const callBotApi = async (data) => {
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  const pod = getBotPodBody(data.id)
  const podName = pod.metadata!.name!
  if (k8DefaultClient) {
    try {
      findBotPod(podName).then((currPod) => {
        if (currPod.length == 0) {
          serverLogger.info(`pod for id ${data.id} doesnt exist skipping API call`)
          return
        }
      })

      findBotService(podName).then((currService) => {
        if (currService.length == 0) {
          serverLogger.info(`${packageUrl}-service doesnt exist, creating service first`)
          createBotService()
        }
      })

      const endpoint: string = data.endpoint
      const method: string = data.method.toUpperCase()
      const requestBody = data.json
      const options = {
        url: `http://${serviceIp}:${servicePort}${endpoint}`,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        json: requestBody
      }

      request(options, (error, response, body) => {
        if (error) {
          serverLogger.error(error)
        } else {
          serverLogger.info(options.url, body)
          return response
        }
      })
    } catch (e) {
      serverLogger.error(`${packageName} run code failed`)
      serverLogger.error(e)
      return e
    }
  }
}

export const deleteBotService = async () => {
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  if (k8DefaultClient) {
    try {
      findBotService(`${packageName}-service`).then((currservice) => {
        if (currservice.length == 0) {
          serverLogger.info('service does not exist skippping deletion')
          return
        }
      })

      k8DefaultClient.deleteNamespacedService(`${packageName}-service`, 'default').then((destroyService) => {
        logger.info(`${packageName} Service destroyed!`)
        return destroyService
      })
    } catch (e) {
      serverLogger.error(`${packageName} service deletion failed`)
      serverLogger.error(e)
      return e
    }
  } else {
    serverLogger.info('k8s client not available!')
  }
}

export const deleteBodPod = async (data: any) => {
  logger.info(`trying to delete bot pod`)
  const k8DefaultClient = getState(ServerState).k8DefaultClient
  if (k8DefaultClient) {
    try {
      findBotPod(`${packageName}-pod-${data.id}`).then((currPod) => {
        if (currPod.length == 0) {
          serverLogger.info(`pod for ${data.id} does not exists skippping creation`)
          return
        }
      })

      k8DefaultClient.deleteNamespacedPod(`${packageName}-pod-${data.id}`, 'default').then((destroyPod) => {
        logger.info(`${packageName} Pod deleted!`)
        return destroyPod
      })
    } catch (e) {
      serverLogger.error(`${packageName} pod deletion failed`)
      serverLogger.error(e)
      return e
    }
  } else {
    serverLogger.info('k8s client not available!')
  }
}
