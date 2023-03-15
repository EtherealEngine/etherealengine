import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { defineAction } from '@etherealengine/hyperflux'

import { matches } from '../../common/functions/MatchesUtils'

export class MotionCaptureAction {
  static setData = defineAction({
    type: 'xre.world.SET_MOCAP_DATA',
    data: matches.any,
    $topic: NetworkTopics.world
  })
  static getData = defineAction({
    type: 'xre.world.GET_MOCAP_DATA',
    data: matches.any,
    $topic: NetworkTopics.world
  })
}
