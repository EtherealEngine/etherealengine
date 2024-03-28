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
import Tabs from '@etherealengine/ui/src/primitives/tailwind/Tabs'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import ProjectTab from './tabs/project'

import AuthenticationTab from './tabs/authentication'
import ClientTab from './tabs/client'
import EmailTab from './tabs/email'
import HelmTab from './tabs/helm'

import { t } from 'i18next'
import InstanceServerTab from './tabs/instanceServer'
import ServerTab from './tabs/server'
import TaskServerTab from './tabs/taskServer'

export const SettingsTabsData = [
  {
    label: t('admin:components.setting.project.header'),
    Component: ProjectTab
  },
  {
    label: t('admin:components.setting.server.header'),
    Component: ServerTab
  },
  {
    label: t('admin:components.setting.helm.header'),
    Component: HelmTab
  },
  {
    label: t('admin:components.setting.client.header'),
    Component: ClientTab
  },
  {
    label: t('admin:components.setting.instanceServer.header'),
    Component: InstanceServerTab
  },
  {
    label: t('admin:components.setting.taskServer.taskServer'),
    Component: TaskServerTab
  },
  {
    label: t('admin:components.setting.email.header'),
    Component: EmailTab
  },
  {
    label: t('admin:components.setting.authentication.header'),
    Component: AuthenticationTab
  }
]

export default function Settings() {
  const { t } = useTranslation()

  const openState = useHookstate(SettingsTabsData.map(() => false))

  const refs = useRef<React.RefObject<HTMLDivElement>[]>(SettingsTabsData.map(() => React.createRef()))

  const tabsData = SettingsTabsData.map((tabData, idx) => ({
    title: t('admin:components.setting.settings'),
    tabLabel: tabData.label,
    bottomComponent: <tabData.Component ref={refs.current[idx]} open={openState[idx].value} />,
    ref: refs.current[idx]
  }))

  const onTabChange = (index: number) => {
    openState.set(openState.value.map((_, i) => i === index))
  }

  return <Tabs scrollable tabsData={tabsData} onTabChange={onTabChange} />
}
