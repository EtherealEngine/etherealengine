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

import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Popover from '@etherealengine/ui/src/primitives/mui/Popover'

interface SketchColorPickerProps {
  name: string
  value: string
  onChange: (value: string) => void
}

const SketchColorPicker = ({ name, value, onChange }: SketchColorPickerProps) => {
  const [color, setColor] = useState(value)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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
  const id = open ? 'simple-popover' : undefined

  return (
    <div id={name}>
      <style>
        {`
          #${name} .color {
            margin: 0px;
            width: 36px;
            height: 14px;
            border-radius: 2px;
            background: ${color};
          }

          #${name} .swatch {
            padding: 5px;
            width: 46px;
            min-width: 46px;
            background: #fff;
            border-radius: 1px;
            display: inline-block;
            cursor: pointer;
          }
        `}
      </style>
      <Button className="swatch" onClick={handleClick}>
        <div className="color" />
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <SketchPicker color={color} onChange={handleChange} />
      </Popover>
    </div>
  )
}

export default SketchColorPicker
