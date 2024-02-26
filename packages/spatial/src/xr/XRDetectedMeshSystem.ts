/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { useEffect } from 'react'

import { getMutableState, getStateUnsafe, useHookstate } from '@etherealengine/hyperflux'

import { getComponent } from '@etherealengine/ecs/src/ComponentFunctions'
import { removeEntity } from '@etherealengine/ecs/src/EntityFunctions'
import { defineSystem } from '@etherealengine/ecs/src/SystemFunctions'
import { XRDetectedMeshComponent } from './XRDetectedMeshComponent'
import { XRDetectedPlaneComponent } from './XRDetectedPlaneComponent'
import { ReferenceSpace, XRState } from './XRState'
import { XRSystem } from './XRSystem'

/** https://github.com/immersive-web/webxr-samples/blob/main/proposals/plane-detection.html */

declare global {
  interface XRFrame {
    /** WebXR implements detectedPlanes on the XRFrame, but the current typescript implementation has it on worldInformation */
    detectedPlanes?: XRPlaneSet
  }

  interface XRPlane {
    semanticLabel?: string
  }
}

const handleDetectedPlanes = (frame: XRFrame) => {
  const detectedPlanes = frame.worldInformation?.detectedPlanes ?? frame.detectedPlanes
  if (!detectedPlanes) return

  for (const [plane, entity] of XRDetectedPlaneComponent.detectedPlanesMap) {
    if (!detectedPlanes.has(plane)) {
      removeEntity(entity)
      XRDetectedPlaneComponent.detectedPlanesMap.delete(plane)
      XRDetectedPlaneComponent.planesLastChangedTimes.delete(plane)
    }
  }

  for (const plane of detectedPlanes) {
    if (!XRDetectedPlaneComponent.detectedPlanesMap.has(plane)) {
      XRDetectedPlaneComponent.foundPlane(plane)
    }
    const entity = XRDetectedPlaneComponent.detectedPlanesMap.get(plane)!
    const lastKnownTime = XRDetectedPlaneComponent.planesLastChangedTimes.get(plane)!
    if (plane.lastChangedTime > lastKnownTime) {
      XRDetectedPlaneComponent.updatePlaneGeometry(entity, getComponent(entity, XRDetectedPlaneComponent).plane)
    }
    XRDetectedPlaneComponent.updatePlanePose(entity, plane)
  }
}

const handleDetectedMeshes = (frame: XRFrame) => {
  if (!frame.detectedMeshes) return

  for (const [mesh, entity] of XRDetectedMeshComponent.detectedMeshesMap) {
    if (!frame.detectedMeshes.has(mesh)) {
      removeEntity(entity)
      XRDetectedMeshComponent.detectedMeshesMap.delete(mesh)
      XRDetectedMeshComponent.meshesLastChangedTimes.delete(mesh)
    }
  }

  for (const mesh of frame.detectedMeshes) {
    if (!XRDetectedMeshComponent.detectedMeshesMap.has(mesh)) {
      XRDetectedMeshComponent.foundMesh(mesh)
    }
    const entity = XRDetectedMeshComponent.detectedMeshesMap.get(mesh)!
    const lastKnownTime = XRDetectedMeshComponent.meshesLastChangedTimes.get(mesh)!
    if (mesh.lastChangedTime > lastKnownTime) {
      XRDetectedMeshComponent.updateMeshGeometry(entity, getComponent(entity, XRDetectedMeshComponent).mesh)
    }
    XRDetectedMeshComponent.updateMeshPose(entity, mesh)
  }
}
const execute = () => {
  const frame = getStateUnsafe(XRState).xrFrame
  if (!frame?.session || frame.session.environmentBlendMode === 'opaque' || !ReferenceSpace.localFloor) return

  handleDetectedPlanes(frame)
  handleDetectedMeshes(frame)
}

const reactor = () => {
  const session = useHookstate(getMutableState(XRState).session)
  useEffect(() => {
    return () => {
      if (session.value) return
      for (const [, entity] of XRDetectedPlaneComponent.detectedPlanesMap) {
        removeEntity(entity)
      }
      XRDetectedPlaneComponent.detectedPlanesMap.clear()
      XRDetectedPlaneComponent.planesLastChangedTimes.clear()
      for (const [, entity] of XRDetectedMeshComponent.detectedMeshesMap) {
        removeEntity(entity)
      }
      XRDetectedMeshComponent.detectedMeshesMap.clear()
      XRDetectedMeshComponent.meshesLastChangedTimes.clear()
    }
  }, [session])
  return null
}

export const XRDetectedMeshSystem = defineSystem({
  uuid: 'ee.engine.XRDetectedMeshSystem',
  insert: { with: XRSystem },
  execute,
  reactor
})
