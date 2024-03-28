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

import SketchPicker from '@uiw/react-color-sketch'
import React, { useEffect, useState } from 'react'
import { Color } from 'three'

import Popover from '@mui/material/Popover'

// kept to show style inheritance
import './ColorInput.css'

interface ColorInputProp {
  value: Color
  onChange: (color: Color) => void
  onSelect?: (color: Color) => void
  onRelease?: (color: Color) => void
  disabled?: boolean
  isValueAsInteger?: boolean
}

export function ColorInput({ value, onChange, onRelease, onSelect, disabled, ...rest }: ColorInputProp) {
  const [color, setColor] = useState(value)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  useEffect(() => {
    if (color !== value) {
      setColor(value)
    }
  }, [value])

  const handleClose = () => {
    setAnchorEl(null)
    onRelease && onRelease(color)
  }

  const handleSelect = () => {
    if (color !== value) {
      setColor(value)
    }
    if (onSelect) onSelect(value)
  }

  const handleChange = ({ hex }) => {
    const color = new Color(hex)
    setColor(color)
    onChange(color)
    return color
  }

  const open = Boolean(anchorEl)
  const hexColor = typeof color.getHexString === 'function' ? '#' + color.getHexString() : '#000'

  //creating view for ColorInput
  return (
    <div className="ColorInputContainer">
      <button className="StyledColorInput Input" disabled={disabled} onClick={handleClick}>
        <div className="ColorPreview" style={{ background: hexColor }} />
        <div className="ColorText">{hexColor.toUpperCase()}</div>
      </button>
      <Popover open={open && !disabled} anchorEl={anchorEl} onSelect={handleSelect} onClose={handleClose}>
        <div className="ColorInputPopover">
          <SketchPicker {...rest} color={hexColor} disableAlpha={true} onChange={handleChange} />
        </div>
      </Popover>
    </div>
  )
}

ColorInput.defaultProps = {
  value: new Color(),
  onChange: () => {}
}

export default ColorInput
