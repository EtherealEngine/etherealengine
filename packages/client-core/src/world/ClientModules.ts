import { MediaModule } from '@xrengine/engine/src/audio/MediaModule'
import { AvatarClientModule } from '@xrengine/engine/src/avatar/AvatarClientModule'
import { AvatarCommonModule } from '@xrengine/engine/src/avatar/AvatarCommonModule'
import { CameraModule } from '@xrengine/engine/src/camera/CameraModule'
import { DebugModule } from '@xrengine/engine/src/debug/DebugModule'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { ECSSerializationModule } from '@xrengine/engine/src/ecs/ECSSerializationModule'
import { initSystems } from '@xrengine/engine/src/ecs/functions/SystemFunctions'
import { InputModule } from '@xrengine/engine/src/input/InputModule'
import { InteractionModule } from '@xrengine/engine/src/interaction/InteractionModule'
import { RealtimeNetworkingModule } from '@xrengine/engine/src/networking/RealtimeNetworkingModule'
import { RendererModule } from '@xrengine/engine/src/renderer/RendererModule'
import { SceneClientModule } from '@xrengine/engine/src/scene/SceneClientModule'
import { SceneCommonModule } from '@xrengine/engine/src/scene/SceneCommonModule'
import { TransformModule } from '@xrengine/engine/src/transform/TransformModule'
import { XRModule } from '@xrengine/engine/src/xr/XRModule'
import { XRUIModule } from '@xrengine/engine/src/xrui/XRUIModule'

export function ClientModules() {
  return initSystems(Engine.instance.currentWorld, [
    ...XRModule(),
    ...TransformModule(),
    ...ECSSerializationModule(),
    ...RendererModule(),
    ...MediaModule(),
    ...InputModule(),
    ...SceneCommonModule(),
    ...SceneClientModule(),
    ...AvatarCommonModule(),
    ...AvatarClientModule(),
    ...CameraModule(),
    ...XRUIModule(),
    ...InteractionModule(),
    ...RealtimeNetworkingModule(),
    ...DebugModule()
  ])
}
