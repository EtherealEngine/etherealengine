import { sRGBEncoding } from 'three'
import { AssetLoader } from '../../assets/classes/AssetLoader'
import { XRInputSourceComponent } from '../../avatar/components/XRInputSourceComponent'
import { BinaryValue } from '../../common/enums/BinaryValue'
import { LifecycleValue } from '../../common/enums/LifecycleValue'
import { defineQuery, defineSystem, enterQuery, System } from 'bitecs'
import { Engine } from '../../ecs/classes/Engine'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { ECSWorld } from '../../ecs/classes/World'
import { getComponent } from '../../ecs/functions/EntityFunctions'
import { InputComponent } from '../../input/components/InputComponent'
import { LocalInputTagComponent } from '../../input/components/LocalInputTagComponent'
import { BaseInput } from '../../input/enums/BaseInput'
import { InputType } from '../../input/enums/InputType'
import { gamepadMapping } from '../../input/functions/GamepadInput'
import { XRReferenceSpaceType } from '../../input/types/WebXR'
import { addControllerModels } from '../functions/addControllerModels'
import { endXR, startWebXR } from '../functions/WebXRFunctions'
import { XR6DOF } from '../../input/enums/InputEnums'

/**
 * System for XR session and input handling
 *
 * @author Josh Field <github.com/hexafield>
 */

export const XRSystem = async (): Promise<System> => {
  const referenceSpaceType: XRReferenceSpaceType = 'local-floor'

  const localXRControllerQuery = defineQuery([InputComponent, LocalInputTagComponent, XRInputSourceComponent])
  const localXRControllerAddQuery = enterQuery(localXRControllerQuery)

  // TEMPORARY - precache controller model
  // TODO: remove this when IK system is in
  await AssetLoader.loadAsync({ url: '/models/webxr/controllers/valve_controller_knu_1_0_right.glb' })

  EngineEvents.instance.addEventListener(EngineEvents.EVENTS.XR_START, async (ev: any) => {
    Engine.renderer.outputEncoding = sRGBEncoding
    const sessionInit = { optionalFeatures: [referenceSpaceType] }
    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr', sessionInit)

      Engine.xrSession = session
      Engine.xrRenderer.setReferenceSpaceType(referenceSpaceType)
      Engine.xrRenderer.setSession(session)
      EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.XR_SESSION })

      Engine.xrRenderer.addEventListener('sessionend', async () => {
        endXR()
        EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.XR_END })
      })

      startWebXR()
    } catch (e) {
      console.log('Failed to create XR Session', e)
    }
  })

  return defineSystem((world: ECSWorld) => {
    if (Engine.xrRenderer?.isPresenting) {
      const session = Engine.xrFrame.session
      for (const source of session.inputSources) {
        if (source.gamepad) {
          const mapping = gamepadMapping[source.gamepad.mapping || 'xr-standard'][source.handedness]
          source.gamepad?.buttons.forEach((button, index) => {
            if (typeof mapping.buttons[index] !== 'undefined') {
              // TODO : support button.touched and button.value
              Engine.inputState.set(mapping.buttons[index], {
                type: InputType.BUTTON,
                value: [button.pressed ? BinaryValue.ON : BinaryValue.OFF],
                lifecycleState: button.pressed ? LifecycleValue.STARTED : LifecycleValue.ENDED
              })
            }
          })
          if (source.gamepad?.axes.length > 2) {
            Engine.inputState.set(mapping.axes, {
              type: InputType.TWODIM,
              value: [source.gamepad.axes[2], source.gamepad.axes[3]],
              lifecycleState: LifecycleValue.STARTED
            })
          } else {
            Engine.inputState.set(mapping.axes, {
              type: InputType.TWODIM,
              value: [source.gamepad.axes[0], source.gamepad.axes[1]],
              lifecycleState: LifecycleValue.STARTED
            })
          }
        }
      }
    }

    for (const entity of localXRControllerAddQuery(world)) {
      addControllerModels(entity)
    }

    for (const entity of localXRControllerQuery(world)) {
      const xrInputSourceComponent = getComponent(entity, XRInputSourceComponent)
      Engine.inputState.set(XR6DOF.HMD, {
        type: InputType.SIXDOF,
        value: [
          xrInputSourceComponent.head.position.x,
          xrInputSourceComponent.head.position.y,
          xrInputSourceComponent.head.position.z,
          xrInputSourceComponent.head.quaternion.w,
          xrInputSourceComponent.head.quaternion.x,
          xrInputSourceComponent.head.quaternion.y,
          xrInputSourceComponent.head.quaternion.z
        ],
        lifecycleState: LifecycleValue.CONTINUED
      })
      Engine.inputState.set(XR6DOF.LeftHand, {
        type: InputType.SIXDOF,
        value: [
          xrInputSourceComponent.controllerLeft.position.x,
          xrInputSourceComponent.controllerLeft.position.y,
          xrInputSourceComponent.controllerLeft.position.z,
          xrInputSourceComponent.controllerLeft.quaternion.w,
          xrInputSourceComponent.controllerLeft.quaternion.x,
          xrInputSourceComponent.controllerLeft.quaternion.y,
          xrInputSourceComponent.controllerLeft.quaternion.z
        ],
        lifecycleState: LifecycleValue.CONTINUED
      })
      Engine.inputState.set(XR6DOF.RightHand, {
        type: InputType.SIXDOF,
        value: [
          xrInputSourceComponent.controllerRight.position.x,
          xrInputSourceComponent.controllerRight.position.y,
          xrInputSourceComponent.controllerRight.position.z,
          xrInputSourceComponent.controllerRight.quaternion.w,
          xrInputSourceComponent.controllerRight.quaternion.x,
          xrInputSourceComponent.controllerRight.quaternion.y,
          xrInputSourceComponent.controllerRight.quaternion.z
        ],
        lifecycleState: LifecycleValue.CONTINUED
      })
    }

    return world
  })
  // TODO: add and remove controller models from grips
}
