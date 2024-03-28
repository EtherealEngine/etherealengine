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

import { useClickOutside } from '@etherealengine/common/src/utils/useClickOutside'
import { useHookstate } from '@etherealengine/hyperflux'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HiXCircle } from 'react-icons/hi2'
import { MdOutlineKeyboardArrowDown } from 'react-icons/md'
import { twMerge } from 'tailwind-merge'
import Checkbox from '../Checkbox'
import Input from '../Input'
import Label from '../Label'
import Text from '../Text'

export interface MultiSelectProps<T extends string | number> {
  label?: string
  className?: string
  error?: string
  description?: string
  options: { label: string; value: T; disabled?: boolean }[]
  selectedOptions: T[]
  onChange: (values: T[]) => void
  placeholder?: string
  menuClassName?: string
}

const MultiSelect = <T extends string | number>({
  className,
  label,
  error,
  description,
  options,
  selectedOptions,
  onChange,
  placeholder,
  menuClassName
}: MultiSelectProps<T>) => {
  const { t } = useTranslation()
  const twClassName = twMerge('bg-theme-surface-main relative', className)
  const ref = useRef<HTMLDivElement>(null)

  const showOptions = useHookstate(false)
  const searchInput = useHookstate('')

  const filteredOptions = useHookstate(options)
  useEffect(() => {
    filteredOptions.set(options)
  }, [options])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchInput.set(e.target.value)
    const newOptions: MultiSelectProps<T>['options'] = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].label.toLowerCase().startsWith(e.target.value.toLowerCase())) {
        newOptions.push(options[i])
      }
    }
    filteredOptions.set(newOptions)
  }

  useClickOutside(ref, () => showOptions.set(false))

  return (
    <div className={twClassName} ref={ref}>
      <Label>{label}</Label>
      {description && <p className="text-theme-secondary self-stretch text-xs">{description}</p>}
      {error && (
        <p className="text-theme-iconRed inline-flex items-center gap-2.5 self-start text-sm">
          <HiXCircle /> {error}
        </p>
      )}
      <div
        className="bg-theme-surface-main border-theme-primary textshadow-sm mt-2 flex min-h-10 w-full flex-auto flex-wrap items-center rounded-lg border px-3.5 pr-7"
        onClick={() => showOptions.set((value) => !value)}
      >
        {selectedOptions.length === 0 && (
          <Text theme="secondary" className="text-gray-400">
            {placeholder || t('common:select.selectOptions')}
          </Text>
        )}
        {selectedOptions.map((selectedOption) => (
          <div
            key={selectedOption}
            className="border-theme-primary m-1 flex h-7 items-center justify-center gap-1 rounded border bg-neutral-300 p-1 font-medium text-black"
          >
            <Text className="text-black">{options.find((opt) => opt.value === selectedOption)?.label}</Text>
            <HiXCircle
              className="cursor-pointer"
              onClick={() => onChange(selectedOptions.filter((opt) => opt !== selectedOption))}
            />
          </div>
        ))}
      </div>

      <MdOutlineKeyboardArrowDown
        size="1.5em"
        className={`text-theme-primary absolute right-3 top-10 transition-transform ${
          showOptions.value ? 'rotate-180' : ''
        }`}
        onClick={() => showOptions.set((value) => !value)}
      />

      <div
        className={`border-theme-primary bg-theme-secondary absolute z-[1000] mt-2 w-full rounded border ${
          showOptions.value ? 'visible' : 'hidden'
        }`}
      >
        <Input placeholder={t('common:select.filter')} value={searchInput.value} onChange={handleSearch} />
        <ul className={twMerge('max-h-40 overflow-auto [&>li]:px-4 [&>li]:py-2 [&>li]:text-gray-500 ', menuClassName)}>
          {filteredOptions.value.map((option) => (
            <li
              key={option.value}
              className={twMerge(
                'text-theme-primary cursor-pointer px-4 py-2',
                option.disabled ? 'cursor-not-allowed' : 'hover:bg-theme-surface-main hover:text-theme-highlight'
              )}
              onClick={() => {
                if (option.disabled) return
                if (!selectedOptions.find((opt) => opt === option.value)) {
                  onChange([...selectedOptions, option.value])
                } else {
                  onChange(selectedOptions.filter((opt) => opt && opt !== option.value))
                }
              }}
            >
              {option.disabled ? (
                <Label>{option.label}</Label>
              ) : (
                <Checkbox
                  onChange={(selected) => {
                    if (selected) {
                      onChange([...selectedOptions, option.value])
                    } else {
                      onChange(selectedOptions.filter((opt) => opt && opt !== option.value))
                    }
                  }}
                  value={selectedOptions.some((opt) => opt && opt === option.value)}
                  label={option.label}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MultiSelect
