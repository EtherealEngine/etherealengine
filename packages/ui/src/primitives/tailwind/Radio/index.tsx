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

export const RadioRoot = ({
  label,
  value,
  onChange,
  selected,
  className,
  disabled
}: {
  label: string
  value: string | number
  onChange: React.ChangeEventHandler<HTMLInputElement>
  selected: boolean
  className?: string
  disabled?: boolean
}) => {
  const twClassname = twMerge('flex items-center', className)
  return (
    <div className={twClassname}>
      <input
        type="radio"
        checked={selected}
        value={value}
        name={label}
        onChange={onChange}
        disabled={disabled}
        className="text-blue-primary focus:ring-blue-primary checked:border-blue-primary shrink-0 rounded-full border-gray-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-offset-gray-800"
      />
      <label
        onClick={() => onChange({ target: { value } } as any)}
        htmlFor={label}
        className="text-theme-primary ml-2 cursor-pointer align-bottom text-sm font-medium"
      >
        {label}
      </label>
    </div>
  )
}

type OptionValueType = string | number

const Radio = <T extends OptionValueType>({
  value,
  options,
  onChange,
  className,
  horizontal,
  disabled
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (value: T) => void
  className?: string
  horizontal?: boolean
  disabled?: boolean
}) => {
  return (
    <div className={twMerge(`grid gap-6 ${horizontal ? 'grid-flow-col' : ''}`, className)}>
      {options.map(({ label, value: optionValue }) => (
        <RadioRoot
          key={label}
          selected={value === optionValue}
          label={label}
          value={optionValue}
          onChange={(event) => onChange(event.target.value as T)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

export default Radio
