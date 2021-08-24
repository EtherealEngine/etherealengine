import { Vector3 } from 'three'
import { XREngineBot } from '@xrengine/bot'
import { setupXR, testWebXR } from '../utils/testWebXR'
import { BotHooks, XRBotHooks } from '@xrengine/engine/src/bot/enums/BotHooks'
import { teleportToBall } from './actions/teleportToBallTest'
import { headUpdateTest, hitBallTest } from './actions/hitBallTest'
import { resetBall } from './actions/resetBallTest'

const maxTimeout = 60 * 1000
const bot = new XREngineBot({ name: 'bot-1', headless: false, autoLog: false })
const bot2 = new XREngineBot({ name: 'bot-2', headless: false, autoLog: false })

const domain = process.env.APP_HOST
// TODO: load GS & client from static world file instead of having to run independently
const locationName = process.env.TEST_LOCATION_NAME

const vector3 = new Vector3()

describe.skip('Golf tests', () => {

  beforeAll(async () => {
    await bot.launchBrowser()
    await bot.enterLocation(`https://${domain}/golf/${locationName}`)
    await bot.awaitHookPromise(BotHooks.LocationLoaded)
    await bot.delay(3000)
    await setupXR(bot)
    await bot.runHook(BotHooks.InitializeBot)
    await bot.runHook(XRBotHooks.OverrideXR)

    await bot2.launchBrowser()
    await bot2.enterLocation(`https://${domain}/golf/${locationName}`)
    await bot2.awaitHookPromise(BotHooks.LocationLoaded)
    await bot2.delay(3000)
    await setupXR(bot2)
    await bot2.runHook(BotHooks.InitializeBot)
    await bot2.runHook(XRBotHooks.OverrideXR)
  }, maxTimeout)

  afterAll(async () => {
    await bot.delay(1000)
    await bot.quit()

    await bot2.delay(1000)
    await bot2.quit()
  }, maxTimeout)

  
  testWebXR(bot)
  headUpdateTest(bot)
  // Test player ids
  // Test state stuff like score and current hole

  teleportToBall(bot)
  hitBallTest(bot)

  testWebXR(bot2)
  headUpdateTest(bot2)

  teleportToBall(bot2)
  hitBallTest(bot2)

  teleportToBall(bot)
  hitBallTest(bot)

  teleportToBall(bot)
  hitBallTest(bot)
  // resetBall(bot)


  teleportToBall(bot)
  hitBallTest(bot)
  // resetBall(bot)


  teleportToBall(bot)
  hitBallTest(bot)
  // resetBall(bot)


  teleportToBall(bot)
  hitBallTest(bot)
  // resetBall(bot)

  // resetBall(bot)

})
