import { sRGBEncoding, Quaternion, Vector3 } from 'three'
import { AssetLoader } from '../../assets/classes/AssetLoader'
import { XRInputSourceComponent } from '../components/XRInputSourceComponent'
import { BinaryValue } from '../../common/enums/BinaryValue'
import { LifecycleValue } from '../../common/enums/LifecycleValue'
import { Engine } from '../../ecs/classes/Engine'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { System } from '../../ecs/classes/System'
import { World } from '../../ecs/classes/World'
import { defineQuery, getComponent } from '../../ecs/functions/ComponentFunctions'
import { InputComponent } from '../../input/components/InputComponent'
import { LocalInputTagComponent } from '../../input/components/LocalInputTagComponent'
import { InputType } from '../../input/enums/InputType'
import { gamepadMapping } from '../../input/functions/GamepadInput'
import { XRReferenceSpaceType } from '../../input/types/WebXR'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { initializeXRInputs } from '../functions/addControllerModels'
import { endXR, startWebXR } from '../functions/WebXRFunctions'
import { updateXRControllerAnimations } from '../functions/controllerAnimation'

/**
 * System for XR session and input handling
 * @author Josh Field <github.com/hexafield>
 */

export default async function XRSystem(world: World): Promise<System> {
  const localXRControllerQuery = defineQuery([InputComponent, LocalInputTagComponent, XRInputSourceComponent])
  const xrControllerQuery = defineQuery([XRInputSourceComponent])

  const quat = new Quaternion()
  const quat2 = new Quaternion()
  const vector3 = new Vector3()

  // TEMPORARY - precache controller model
  // Cache hand models
  await AssetLoader.loadAsync({ url: '/default_assets/controllers/hands/left.glb' })
  await AssetLoader.loadAsync({ url: '/default_assets/controllers/hands/right.glb' })
  await AssetLoader.loadAsync({ url: '/default_assets/controllers/hands/left_controller.glb' })
  await AssetLoader.loadAsync({ url: '/default_assets/controllers/hands/right_controller.glb' })

  EngineEvents.instance.addEventListener(EngineEvents.EVENTS.XR_START, async (ev: any) => {
    Engine.renderer.outputEncoding = sRGBEncoding
    const sessionInit = { optionalFeatures: ['local-floor', 'hand-tracking', 'layers'] }
    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr', sessionInit)

      Engine.xrSession = session
      Engine.xrManager.setSession(session)
      Engine.xrManager.setFoveation(1)
      EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.XR_SESSION })

      Engine.xrManager.getCamera().layers.enableAll()

      Engine.xrManager.addEventListener('sessionend', async () => {
        endXR()
        EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.XR_END })
      })

      startWebXR()
    } catch (e) {
      console.log('Failed to create XR Session', e)
    }
  })

  return () => {
    if (Engine.xrManager?.isPresenting) {
      const session = Engine.xrFrame.session
      for (const source of session.inputSources) {
        if (source.gamepad) {
          const mapping = gamepadMapping[source.gamepad.mapping || 'xr-standard'][source.handedness]
          source.gamepad?.buttons.forEach((button, index) => {
            // TODO : support button.touched and button.value
            const prev = Engine.prevInputState.get(mapping.buttons[index])
            if (!prev && button.pressed == false) return
            const continued = prev?.value && button.pressed
            Engine.inputState.set(mapping.buttons[index], {
              type: InputType.BUTTON,
              value: [button.pressed ? BinaryValue.ON : BinaryValue.OFF],
              lifecycleState: button.pressed
                ? continued
                  ? LifecycleValue.Continued
                  : LifecycleValue.Started
                : LifecycleValue.Ended
            })
          })
          if (source.gamepad?.axes.length > 2) {
            Engine.inputState.set(mapping.axes, {
              type: InputType.TWODIM,
              value: [source.gamepad.axes[2], source.gamepad.axes[3]],
              lifecycleState: LifecycleValue.Started
            })
          } else {
            Engine.inputState.set(mapping.axes, {
              type: InputType.TWODIM,
              value: [source.gamepad.axes[0], source.gamepad.axes[1]],
              lifecycleState: LifecycleValue.Started
            })
          }
        }
      }
    }

    for (const entity of localXRControllerQuery.enter()) {
      initializeXRInputs(entity)
    }

    //XR Controller mesh animation update
    for (const entity of xrControllerQuery()) {
      const inputSource = getComponent(entity, XRInputSourceComponent)
      updateXRControllerAnimations(inputSource)
    }

    for (const entity of localXRControllerQuery()) {
      const xrInputSourceComponent = getComponent(entity, XRInputSourceComponent)
      const transform = getComponent(entity, TransformComponent)

      xrInputSourceComponent.container.updateWorldMatrix(true, true)

      quat.copy(transform.rotation).invert()
      xrInputSourceComponent.head.quaternion.copy(Engine.camera.quaternion).premultiply(quat)

      vector3.subVectors(Engine.camera.position, transform.position)
      vector3.applyQuaternion(quat)
      xrInputSourceComponent.head.position.copy(vector3)
    }
  }
  // TODO: add and remove controller models from grips
}
