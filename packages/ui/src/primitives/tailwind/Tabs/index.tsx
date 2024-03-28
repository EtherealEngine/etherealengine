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

import { useHookstate } from '@etherealengine/hyperflux'
import React, { ReactNode, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import Text from '../Text'

export interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  tabsData: {
    title: string
    tabLabel: string
    bottomComponent?: ReactNode
    rightComponent?: ReactNode
    ref?: React.RefObject<HTMLDivElement>
    disabled?: boolean
  }[]
  tabContainerClassName?: string
  tabClassName?: string
  scrollable?: boolean
  onTabChange?: (index: number) => void
}

const Tabs = ({
  tabsData,
  tabContainerClassName,
  tabClassName,
  scrollable,
  onTabChange,
  ...props
}: TabProps): JSX.Element => {
  const twTabContainerClassName = twMerge('flex gap-4', tabContainerClassName)
  const twTabClassName = twMerge(
    'text-theme-secondary p-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-b dark:hover:border-b-blue-400',
    tabClassName
  )
  const currentTab = useHookstate(0)

  useEffect(() => {
    if (
      scrollable &&
      tabsData.length &&
      tabsData[currentTab.value] &&
      tabsData[currentTab.value].ref &&
      tabsData[currentTab.value].ref?.current
    ) {
      tabsData[currentTab.value].ref?.current?.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'smooth'
      })
    }
    if (onTabChange) {
      onTabChange(currentTab.value)
    }
  }, [currentTab])

  return (
    <div className="relative overflow-y-auto">
      <Text component="h2" fontSize="xl" className="mb-6">
        {tabsData[currentTab.value]?.title}
      </Text>
      <div className="bg-theme-primary sticky top-0 flex justify-between">
        <div className={twMerge(twTabContainerClassName, tabContainerClassName)} {...props}>
          {tabsData.map((tab, index) => (
            <button
              key={index}
              className={twMerge(
                twTabClassName,
                currentTab.value === index ? 'text-theme-primary border-b-blue-primary border-b font-semibold' : '',
                tab.disabled ? 'border-none' : ''
              )}
              disabled={tab.disabled}
              onClick={() => {
                currentTab.set(index)
              }}
            >
              {tab.tabLabel}
            </button>
          ))}
        </div>
        {tabsData[currentTab.value]?.rightComponent}
      </div>
      {scrollable ? (
        tabsData.map((tab, index) => (
          <div className="mt-4" key={index}>
            {tab.bottomComponent}
          </div>
        ))
      ) : (
        <div className="mt-4">{tabsData[currentTab.value]?.bottomComponent}</div>
      )}
    </div>
  )
}

export default Tabs
