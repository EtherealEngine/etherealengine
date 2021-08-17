import { TouchApp } from '@styled-icons/material/TouchApp'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { GamepadAxis, GamepadButtons } from '@xrengine/engine/src/input/enums/InputEnums'
import { ClientInputSystem, enableInput } from '@xrengine/engine/src/input/systems/ClientInputSystem'
import nipplejs from 'nipplejs'
import React, { FunctionComponent, useEffect, useRef } from 'react'
import styles from './TouchGamepad.module.scss'
import { TouchGamepadProps } from './TouchGamepadProps'
import {
  handleTouch,
  handleTouchDirectionalPad,
  handleTouchGamepadButton,
  handleTouchMove,
} from '@xrengine/engine/src/input/schema/ClientInputSchema'
import { addClientInputListeners, removeClientInputListeners } from '@xrengine/engine/src/input/functions/clientInputListeners'

export const TouchGamepad: FunctionComponent<TouchGamepadProps> = () => {
  const leftContainer = useRef<HTMLDivElement>()

  const triggerButton = (button: GamepadButtons, pressed: boolean): void => {
    const eventType = pressed ? 'touchgamepadbuttondown' : 'touchgamepadbuttonup'
    const event = new CustomEvent(eventType, { detail: { button } })
    document.dispatchEvent(event)
  }

  const buttonsConfig: Array<{ button: GamepadButtons; label: string }> = [
    {
      button: GamepadButtons.A,
      label: 'A'
    }
  ]

  const buttons = buttonsConfig.map((value, index) => {
    return (
      <div
        key={index}
        className={
          styles.controllButton + ' ' + styles[`gamepadButton_${value.label}`] + ' ' + styles.availableButton
          // (hovered ? styles.availableButton : styles.notAvailableButton)
        }
        onPointerDown={(): void => triggerButton(value.button, true)}
        onPointerUp={(): void => triggerButton(value.button, false)}
      >
        <TouchApp />
      </div>
    )
  })

  useEffect(() => {
    // mount
    const size = window.innerHeight * 0.15
    const bottom = window.innerHeight * 0.1

    const stickLeft = nipplejs.create({
      zone: leftContainer.current,
      mode: 'static',
      position: { left: '40%', bottom: bottom + 'px' },
      color: 'white',
      size: size,
      dynamicPage: true
    })
 
	const canvasElement = (document.getElementById('engine-renderer-canvas') as HTMLCanvasElement)
    stickLeft.on('move', (e, data) => {
	
	  if (canvasElement.addEventListener) {  // all browsers except IE before version 9
		addClientInputListeners(canvasElement)
      }
      else {
		if (canvasElement.attachEvent) {   // IE before version 9
			canvasElement.attachEvent ("touchstart", function (e) {
			  handleTouch(e)
			  handleTouchMove(e)
			})
		    canvasElement.attachEvent('touchend', handleTouch)
		    canvasElement.attachEvent('touchcancel', handleTouch)
		    canvasElement.attachEvent('touchmove', handleTouchMove)
		}
      }	  
      const event = new CustomEvent('touchstickmove', {
        detail: {
          stick: GamepadAxis.Left,
          value: { x: data.vector.y, y: -data.vector.x, angleRad: data.angle.radian }
        }
      })
      document.dispatchEvent(event)
	  
    })

    stickLeft.on('end', (e, data) => {
      const event = new CustomEvent('touchstickmove', {
        detail: { stick: GamepadAxis.Left, value: { x: 0, y: 0, angleRad: 0 } }
      })
      document.dispatchEvent(event)
    })

    return (): void => {
      // unmount
      stickLeft.destroy()
    }
  }, [])

  return (
    <>
      <div className={styles.stickLeft} ref={leftContainer} />
      <div className={styles.controlButtonContainer}>{buttons}</div>
    </>
  )
}

export default TouchGamepad
