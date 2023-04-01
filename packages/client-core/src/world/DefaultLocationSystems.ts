import { SystemModuleType } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { SystemUpdateType } from '@etherealengine/engine/src/ecs/functions/SystemUpdateType'

import WebcamInputSystem from '../media/webcam/WebcamInput'
import AvatarUISystem from '../systems/AvatarUISystem'
import LoadingUISystem from '../systems/LoadingUISystem'
import PartySystem from '../systems/state/PartySystem'
import WarningUISystem from '../systems/WarningUISystem'
import WidgetUISystem from '../systems/WidgetUISystem'
import UpdateNearbyUsersSystem from '../transports/UpdateNearbyUsersSystem'
import UserUISystem from '../user/UserUISystem'

export const DefaultLocationSystems: SystemModuleType<any>[] = [
  {
    uuid: 'ee.client.core.UserUISystem',
    type: SystemUpdateType.POST_RENDER,
    systemLoader: () => Promise.resolve({ default: UserUISystem })
  },
  {
    uuid: 'ee.client.core.LoadingUISystem',
    type: SystemUpdateType.UPDATE,
    systemLoader: () => Promise.resolve({ default: LoadingUISystem })
  },
  {
    uuid: 'ee.client.core.AvatarUISystem',
    type: SystemUpdateType.UPDATE,
    systemLoader: () => Promise.resolve({ default: AvatarUISystem })
  },
  {
    uuid: 'ee.client.core.WidgetUISystem',
    type: SystemUpdateType.UPDATE,
    systemLoader: () => Promise.resolve({ default: WidgetUISystem })
  },
  {
    uuid: 'ee.client.core.PartySystem',
    type: SystemUpdateType.POST_RENDER,
    systemLoader: () => Promise.resolve({ default: PartySystem })
  },
  {
    uuid: 'ee.client.core.UpdateNearbyUsersSystem',
    type: SystemUpdateType.POST_RENDER,
    systemLoader: () => Promise.resolve({ default: UpdateNearbyUsersSystem })
  },
  {
    uuid: 'ee.client.core.WebcamInputSystem',
    type: SystemUpdateType.UPDATE_EARLY,
    systemLoader: () => Promise.resolve({ default: WebcamInputSystem })
  },
  {
    uuid: 'ee.client.core.WarningUISystem',
    type: SystemUpdateType.POST_RENDER,
    systemLoader: () => Promise.resolve({ default: WarningUISystem })
  }
]
