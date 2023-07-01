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

import React, { useEffect, useState } from 'react'
import SketchPicker from 'react-color/lib/Sketch'
import styled from 'styled-components'

import Popover from '@mui/material/Popover'

import Input from './Input'

function toHex(rgba: any): string {
  if (typeof rgba !== 'string') {
    // a null check
    return ''
  }
  const values = rgba.substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')')).split(',')
  const r = parseInt(values[0].trim())
  const g = parseInt(values[1].trim())
  const b = parseInt(values[2].trim())

  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
  return `#${hex}`
}

/**
 * ColorInputContainer used to provide styles for ColorInputContainer div.
 *
 * @type {styled component}
 */
const ColorInputContainer = (styled as any).div`
  display: flex;
  position: relative;
  width: 100%;
  max-width: 100px;
`

/**
 * StyledColorInput used to provide styles for StyledColorInput div.
 *
 * @type {styled component}
 */
const StyledColorInput = (styled as any)(Input)`
  display: flex;
  flex: 1;
  align-items: center;
  &:focus-visible { outline: none; }
`

/**
 * ColorPreview used to provide styles for ColorPreview div.
 *
 * @type {styled component}
 */
const ColorPreview = (styled as any).div`
  width: 32px;
  height: auto;
  border-radius: 2px;
  padding: 6px;
  margin-right: 8px;
`

/**
 * ColorText used to provide styles for ColorText div.
 *
 * @type {styled component}
 */
const ColorText = (styled as any).div`
  padding-top: 2px;
`

/**
 * ColorInputPopover used to provide styles for ColorText popover.
 *
 * @type {styled component}
 */
const ColorInputPopover = (styled as any).div`
  box-shadow: var(--shadow30);
  margin-bottom: 3px;
`

interface ColorInputProp {
  value: string
  onChange: Function
  onSelect?: Function
  disabled?: boolean
  isValueAsInteger?: boolean
}

/**
 * ColorInput used to render the view of component.
 *
 * @param       {object | number} value
 * @param       {Function} onChange
 * @param       {boolean} disabled
 * @param       {any} rest
 * @constructor
 */

export function ColorInput({ value, onChange, onSelect, disabled, ...rest }: ColorInputProp) {
  const [color, setColor] = useState(value)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  useEffect(() => {
    if (color !== value) {
      setColor(value)
    }
  }, [value])

  const handleChange = (color) => {
    const rgbaColor = `rgba(${color.rgb.r},${color.rgb.g},${color.rgb.b},${color.rgb.a})`
    setColor(rgbaColor)
    onChange(rgbaColor)
  }

  const open = Boolean(anchorEl)

  //creating view for ColorInput
  return (
    <ColorInputContainer>
      <StyledColorInput as="button" disabled={disabled} onClick={handleClick}>
        <ColorPreview style={{ background: color }} />
        <ColorText>{toHex(color).toUpperCase()}</ColorText>
      </StyledColorInput>
      <Popover open={open && !disabled} anchorEl={anchorEl} onClose={handleClose}>
        <ColorInputPopover>
          <SketchPicker {...rest} color={color} disableAlpha={true} onChange={handleChange} />
        </ColorInputPopover>
      </Popover>
    </ColorInputContainer>
  )
}

ColorInput.defaultProps = {
  value: '',
  onChange: () => {}
}

export default ColorInput
