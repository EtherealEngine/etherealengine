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

import DockLayout, { DockMode, LayoutData } from 'rc-dock'
import React, { ReactNode, RefObject, createContext, useContext } from 'react'
import { ProjectBrowserPanelTab } from './assets/ProjectBrowserPanel'
import { SceneAssetsPanelTab } from './assets/SceneAssetsPanel'
import { ScenePanelTab } from './assets/ScenesPanel'
import { PropertiesPanelTab } from './element/PropertiesPanel'
import { HierarchyPanelTab } from './hierarchy/HierarchyPanel'
import { MaterialLibraryPanelTab } from './materials/MaterialLibraryPanel'
import { ViewportPanelTab } from './panels/ViewportPanel'

const DockContainerContext = createContext({ dockPanelRef: { current: null } as RefObject<DockLayout> })

export const DockContainerProvider = ({
  dockPanelRef,
  children
}: {
  dockPanelRef: RefObject<DockLayout>
  children: ReactNode
}) => <DockContainerContext.Provider value={{ dockPanelRef }}>{children}</DockContainerContext.Provider>

export const useDockPanel = () => useContext(DockContainerContext).dockPanelRef.current

export const DockContainer = ({
  children,
  id = 'editor-dock',
  dividerAlpha = 0
}: {
  id?: string
  dividerAlpha?: number
  children: ReactNode
}) => {
  const dockContainerStyles = {
    '--dividerAlpha': dividerAlpha
  }

  return (
    <div id={id} className="dock-container" style={dockContainerStyles as React.CSSProperties}>
      {children}
    </div>
  )
}

export const COMPONENT_PROPERTIES_TAB = 'ComponentPropertiesTab'

export const defaultLayout: LayoutData = {
  dockbox: {
    mode: 'horizontal' as DockMode,
    children: [
      {
        mode: 'vertical' as DockMode,
        size: 3,
        children: [
          {
            tabs: [ScenePanelTab, ProjectBrowserPanelTab, SceneAssetsPanelTab]
          }
        ]
      },
      {
        mode: 'vertical' as DockMode,
        size: 8,
        children: [
          {
            id: '+5',
            tabs: [ViewportPanelTab],
            size: 1
          }
        ]
      },
      {
        mode: 'vertical' as DockMode,
        size: 2,
        children: [
          {
            tabs: [HierarchyPanelTab, MaterialLibraryPanelTab]
          },
          {
            id: COMPONENT_PROPERTIES_TAB,
            tabs: [PropertiesPanelTab]
          }
        ]
      }
    ]
  }
}
