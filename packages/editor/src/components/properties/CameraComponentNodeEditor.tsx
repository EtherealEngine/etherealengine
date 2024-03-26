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

import { useComponent } from '@etherealengine/ecs'
import { CameraComponent } from '@etherealengine/spatial/src/camera/components/CameraComponent'
import React from 'react'
import { useTranslation } from 'react-i18next'
import NumericInputGroup from '../inputs/NumericInputGroup'
import PropertyGroup from './PropertyGroup'
import { EditorComponentType, commitProperty, updateProperty } from './Util'

export const CameraComponentNodeEditor: EditorComponentType = (props) => {
  const { t } = useTranslation()
  const cameraComponent = useComponent(props.entity, CameraComponent).value
  return (
    <PropertyGroup name={t('editor:properties.cameraComponent.name')}>
      <NumericInputGroup
        name="FOV"
        label={t('editor:properties.cameraComponent.fov')}
        min={0}
        max={1000}
        smallStep={0.001}
        mediumStep={0.01}
        largeStep={1}
        value={cameraComponent.fov}
        onChange={updateProperty(CameraComponent, 'fov')}
        onRelease={commitProperty(CameraComponent, 'fov')}
      />
      <NumericInputGroup
        name="Aspect Ratio"
        label={t('editor:properties.cameraComponent.far')}
        min={0}
        max={1000}
        smallStep={0.001}
        mediumStep={0.01}
        largeStep={1}
        value={cameraComponent.far}
        onChange={updateProperty(CameraComponent, 'far')}
        onRelease={commitProperty(CameraComponent, 'far')}
      />
      <NumericInputGroup
        name="Near"
        label={t('editor:properties.cameraComponent.near')}
        min={0}
        max={1000}
        smallStep={0.001}
        mediumStep={0.01}
        largeStep={1}
        value={cameraComponent.near}
        onChange={updateProperty(CameraComponent, 'near')}
        onRelease={commitProperty(CameraComponent, 'near')}
      />
      <NumericInputGroup
        name="Far"
        label={t('editor:properties.cameraComponent.far')}
        min={0}
        max={1000}
        smallStep={0.001}
        mediumStep={0.01}
        largeStep={1}
        value={cameraComponent.far}
        onChange={updateProperty(CameraComponent, 'far')}
        onRelease={commitProperty(CameraComponent, 'far')}
      />
    </PropertyGroup>
  )
}

export default CameraComponentNodeEditor
