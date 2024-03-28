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

export interface BadgeProps {
  label: string
  className?: string
  textClassName?: string
  icon?: React.ReactNode
  variant?: 'success' | 'danger' | 'neutral' | 'warning'
}

const variantMap = {
  success: {
    containerClass: 'bg-theme-tagGreen',
    iconColor: '#15803d',
    textClass: 'text-green-900 dark:text-white'
  },
  danger: {
    containerClass: 'bg-theme-tagRed',
    iconColor: '#f43f5e',
    textClass: 'text-rose-900 dark:text-white'
  },
  neutral: {
    containerClass: 'bg-white dark:bg-gray-800',
    iconColor: 'black',
    textClass: 'text-black dark:text-white'
  },
  warning: {
    containerClass: 'bg-theme-tagYellow',
    iconColor: '#d6a407',
    textClass: 'text-yellow-900 dark:text-white'
  }
}

const Badge = ({ label, className, textClassName, icon, variant }: BadgeProps) => {
  let twClassName = twMerge('flex h-fit items-center justify-around gap-x-1.5	rounded-full px-2.5 py-0.5', className)

  let twTextClassName = textClassName

  let variantIconColor: null | string = null

  if (variant && variantMap[variant]) {
    const { containerClass, iconColor, textClass } = variantMap[variant]
    twClassName = twMerge(twClassName, containerClass)
    twTextClassName = twMerge(twTextClassName, textClass)
    variantIconColor = iconColor
  }

  return (
    <div className={twClassName}>
      {variantIconColor && React.isValidElement(icon)
        ? React.cloneElement(icon, {
            ...icon.props,
            // @ts-ignore
            color: variantIconColor
          })
        : icon}
      <span className={twTextClassName}>{label}</span>
    </div>
  )
}

export default Badge
