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
import hierarchyStyles from '../hierarchy/styles.module.scss'
import BehaveFlow from './BehaveFlow'

import GraphIcon from '@mui/icons-material/AutoGraph'

import { TabData } from 'rc-dock'
import { useTranslation } from 'react-i18next'
import { PanelDragContainer, PanelIcon, PanelTitle } from '../layout/Panel'
import styles from '../styles.module.scss'

export const GraphPanel = () => {
  return (
    <>
      <div className={hierarchyStyles.panelContainer}>
        <div className={hierarchyStyles.panelSection}>
          <BehaveFlow />
        </div>
      </div>
    </>
  )
}

export const GraphPanelTitle = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.dockableTab}>
      <PanelDragContainer>
        <PanelIcon as={GraphIcon} size={12} />
        <PanelTitle>{t('editor:graphPanel.name')}</PanelTitle>
      </PanelDragContainer>
    </div>
  )
}

export const GraphPanelTab: TabData = {
  id: 'graphPanel',
  closable: true,
  cached: true,
  title: <GraphPanelTitle />,
  content: <GraphPanel />
}

export default GraphPanel
