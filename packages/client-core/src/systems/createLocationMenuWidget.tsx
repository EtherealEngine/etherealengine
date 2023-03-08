import { removeComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { WidgetName, Widgets } from '@etherealengine/engine/src/xrui/Widgets'

import { createLocationMenuView } from './ui/LocationMenuView'

export function createLocationMenuWidget() {
  const ui = createLocationMenuView()
  removeComponent(ui.entity, VisibleComponent)

  Widgets.registerWidget(ui.entity, {
    ui,
    label: WidgetName.LOCATION,
    icon: 'LocationOn',
    system: () => {}
  })
}
