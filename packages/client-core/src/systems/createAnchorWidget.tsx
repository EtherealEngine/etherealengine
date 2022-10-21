import { World } from '@xrengine/engine/src/ecs/classes/World'
import { removeComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { VisibleComponent } from '@xrengine/engine/src/scene/components/VisibleComponent'
import { WidgetName, Widgets } from '@xrengine/engine/src/xrui/Widgets'

import PersonIcon from '@mui/icons-material/Person'

import { createAnchorWidgetUI } from './ui/AnchorWidgetUI'

export function createAnchorWidget(world: World) {
  const ui = createAnchorWidgetUI()
  removeComponent(ui.entity, VisibleComponent)
  Widgets.registerWidget(world, ui.entity, {
    ui,
    label: WidgetName.PROFILE,
    icon: PersonIcon,
    system: () => {}
  })
}
