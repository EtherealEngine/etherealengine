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

import DockLayout, { DockMode } from 'rc-dock'
import React from 'react'

import {
  AssetSelectionChangePropsType,
  AssetsPreviewPanel
} from '@etherealengine/editor/src/components/assets/AssetsPreviewPanel'
import FileBrowserContentPanel from '@etherealengine/editor/src/components/assets/FileBrowser/FileBrowserContentPanel'
import { DockContainer } from '@etherealengine/editor/src/components/EditorDockContainer'

import DrawerView from '../../common/DrawerView'

interface Props {
  name: string
  open: boolean
  onClose: () => void
}

const ViewProjectFiles = ({ name, open, onClose }: Props) => {
  const assetsPreviewPanelRef = React.useRef()

  const onLayoutChangedCallback = () => {
    ;(assetsPreviewPanelRef as any).current?.onLayoutChanged?.()
  }

  const onSelectionChanged = (props: AssetSelectionChangePropsType) => {
    ;(assetsPreviewPanelRef as any).current?.onSelectionChanged?.(props)
  }

  let defaultLayout = {
    dockbox: {
      mode: 'vertical' as DockMode,
      children: [
        {
          size: 3,
          mode: 'horizontal' as DockMode,
          children: [
            {
              tabs: [
                {
                  id: 'filesPanel',
                  title: 'Project Files',
                  content: <FileBrowserContentPanel selectedFile={name} onSelectionChanged={onSelectionChanged} />
                }
              ]
            }
          ]
        },
        {
          size: 2,
          tabs: [{ id: 'previewPanel', title: 'Preview', content: <AssetsPreviewPanel ref={assetsPreviewPanelRef} /> }]
        }
      ]
    }
  }

  return (
    <div id="project-container">
      <DrawerView open={open} onClose={onClose}>
        <DockContainer dividerAlpha={0.3}>
          <DockLayout
            defaultLayout={defaultLayout}
            style={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 70, right: 5, bottom: 5 }}
            onLayoutChange={onLayoutChangedCallback}
          />
        </DockContainer>
      </DrawerView>
    </div>
  )
}

export default ViewProjectFiles
