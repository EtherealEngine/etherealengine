import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { TransformGizmoComponent } from '@xrengine/engine/src/scene/components/TransformGizmo'

const GIZMO_SIZE = 10

export default async function GizmoSystem(_: World) {
  const gizmoQuery = defineQuery([TransformGizmoComponent])

  return () => {
    for (const entity of gizmoQuery()) {
      const gizmoObj = getComponent(entity, TransformGizmoComponent).gizmo
      if (!gizmoObj || !gizmoObj.visible) return

      const eyeDistance = gizmoObj.position.distanceTo(Engine.instance.currentWorld.camera.position) / GIZMO_SIZE
      gizmoObj.scale.set(eyeDistance, eyeDistance, eyeDistance)
    }
  }
}
