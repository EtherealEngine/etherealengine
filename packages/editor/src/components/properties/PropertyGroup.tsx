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

import React, { Fragment } from 'react'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'

import Tooltip from '@etherealengine/ui/src/primitives/mui/Tooltip'
import { useTranslation } from 'react-i18next'
import CollapsibleBlock from '../layout/CollapsibleBlock'
import './PropertyGroup.css'

interface Props {
  name?: string
  description?: string
  openDetails?: boolean
  onClose?: () => void
  onOpenInPanelClick?: () => void
  children?: React.ReactNode
  rest?: Record<string, unknown>
}

const PropertyGroup = ({ name, description, openDetails, onClose, onOpenInPanelClick, children, ...rest }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="property-group" {...rest}>
      <CollapsibleBlock
        defaultOpen={openDetails}
        label={
          <>
            <span style={{ cursor: 'default', userSelect: 'none' }} onDoubleClick={() => onOpenInPanelClick?.()}>
              {name}
            </span>
            <div style={{ flexGrow: 1 }} />
            {onOpenInPanelClick && (
              <Tooltip title={t('editor:properties.lbl-openInNewPanel')}>
                <button className="property-icon-button" onClick={onOpenInPanelClick}>
                  <OpenInNewIcon fontSize="inherit" />
                </button>
              </Tooltip>
            )}
            {onClose && (
              <Tooltip title={t('editor:properties.lbl-removeComponent')}>
                <button className="property-icon-button" onPointerUp={onClose}>
                  <RemoveCircleOutlineIcon fontSize="inherit" />
                </button>
              </Tooltip>
            )}
          </>
        }
      >
        <div className="property-group-header" onClick={onOpenInPanelClick}>
          {name}
        </div>
        {description && (
          <div className="property-group-description">
            {description.split('\\n').map((line, i) => (
              <Fragment key={i}>
                {line}
                <br />
              </Fragment>
            ))}
          </div>
        )}
        <div className="property-group-content">{children}</div>
      </CollapsibleBlock>
    </div>
  )
}

export default PropertyGroup
