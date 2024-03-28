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

import React from 'react'
import { twMerge } from 'tailwind-merge'
import Label from '../Label'

export interface ToggleProps {
  value: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  labelClassName?: string
  containerClassName?: string
  className?: string
  onChange: (value: boolean) => void
  disabled?: boolean
}

const sizeMap = {
  md: 'w-11 h-6 after:w-5 after:h-5 after:top-[2px] after:start-[2px]',
  lg: 'w-16 h-9 after:w-7 after:h-7 after:top-[4px] after:start-[5px]'
}

const Toggle = ({
  containerClassName,
  className,
  labelClassName,
  size,
  label,
  value,
  onChange,
  disabled
}: ToggleProps) => {
  const twClassName = twMerge(
    "peer relative cursor-pointer rounded-full bg-gray-200 after:absolute after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']",
    'peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800',
    'peer-disabled:pointer-events-none peer-disabled:opacity-50',
    className,
    sizeMap[size ?? 'md']
  )
  const containerTwClassName = twMerge('flex items-center gap-4', containerClassName)

  return (
    <div className={containerTwClassName}>
      <input
        disabled={disabled}
        type="checkbox"
        className="peer sr-only"
        checked={value}
        onChange={() => onChange(!value)}
      />
      <div className={twClassName} onClick={() => onChange(!value)} />
      {label && <Label className={labelClassName}>{label}</Label>}
    </div>
  )
}

export default Toggle
