import { World } from '@xrengine/engine/src/ecs/classes/World'
import { removeComponent, setComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { VisibleComponent } from '@xrengine/engine/src/scene/components/VisibleComponent'
import { XRState } from '@xrengine/engine/src/xr/XRState'
import { XRUIInteractableComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { Widget, Widgets } from '@xrengine/engine/src/xrui/Widgets'
import { getState } from '@xrengine/hyperflux'

import AccessibilityIcon from '@mui/icons-material/Accessibility'

export function createHeightAdjutmentWidget(world: World) {
  const ui = createXRUI(() => null)
  removeComponent(ui.entity, VisibleComponent)
  setComponent(ui.entity, XRUIInteractableComponent)

  const xrState = getState(XRState)

  const widget: Widget = {
    ui,
    label: 'Height Adjustment',
    icon: AccessibilityIcon,
    onOpen: () => {
      // set user height from viewer pose
      const viewerPose = xrState.viewerPose.value
      if (viewerPose) {
        xrState.userEyeLevel.set(viewerPose.transform.position.y)
      }
    }
  }

  const id = Widgets.registerWidget(world, ui.entity, widget)
}
