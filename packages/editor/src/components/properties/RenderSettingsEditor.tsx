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
import { useTranslation } from 'react-i18next'
import {
  ACESFilmicToneMapping,
  BasicShadowMap,
  CineonToneMapping,
  LinearToneMapping,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  ReinhardToneMapping,
  VSMShadowMap
} from 'three'

import { getComponent, useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useQuery } from '@etherealengine/engine/src/ecs/functions/QueryFunctions'
import { DirectionalLightComponent } from '@etherealengine/engine/src/scene/components/DirectionalLightComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { RenderSettingsComponent } from '@etherealengine/engine/src/scene/components/RenderSettingsComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import BooleanInput from '../inputs/BooleanInput'
import CompoundNumericInput from '../inputs/CompoundNumericInput'
import InputGroup from '../inputs/InputGroup'
import SelectInput from '../inputs/SelectInput'
import PropertyGroup from './PropertyGroup'
import { EditorComponentType, commitProperty, updateProperty } from './Util'

/**
 * ToneMappingOptions array containing tone mapping type options.
 *
 * @type {Array}
 */
const ToneMappingOptions = [
  {
    label: 'No Tone Mapping',
    value: NoToneMapping
  },
  {
    label: 'Linear Tone Mapping',
    value: LinearToneMapping
  },
  {
    label: 'Reinhard Tone Mapping',
    value: ReinhardToneMapping
  },
  {
    label: 'Cineon Tone Mapping',
    value: CineonToneMapping
  },
  {
    label: 'ACES Filmic Tone Mapping',
    value: ACESFilmicToneMapping
  }
]

/**
 * ShadowTypeOptions array containing shadow type options.
 *
 * @type {Array}
 */
const ShadowTypeOptions = [
  {
    label: 'No Shadow Map',
    value: -1
  },
  {
    label: 'Basic Shadow Map',
    value: BasicShadowMap
  },
  {
    label: 'PCF Shadow Map',
    value: PCFShadowMap
  },
  {
    label: 'PCF Soft Shadow Map',
    value: PCFSoftShadowMap
  },
  {
    label: 'VSM Shadow Map',
    value: VSMShadowMap
  }
]

export const RenderSettingsEditor: EditorComponentType = (props) => {
  const { t } = useTranslation()
  const rendererSettingsState = useComponent(props.entity, RenderSettingsComponent)

  const directionalLightOptions = useQuery([DirectionalLightComponent]).map((entity) => {
    return {
      label: getComponent(entity, NameComponent),
      value: getComponent(entity, UUIDComponent)
    }
  })

  return (
    <PropertyGroup
      name={t('editor:properties.renderSettings.name')}
      description={t('editor:properties.renderSettings.description')}
    >
      <InputGroup
        name="Primary Light"
        label={t('editor:properties.renderSettings.lbl-primaryLight')}
        info={t('editor:properties.renderSettings.info-primaryLight')}
      >
        <SelectInput
          options={directionalLightOptions}
          value={rendererSettingsState.primaryLight.value}
          onChange={commitProperty(RenderSettingsComponent, 'primaryLight')}
        />
      </InputGroup>
      <InputGroup
        name="Use Cascading Shadow Maps"
        label={t('editor:properties.renderSettings.lbl-csm')}
        info={t('editor:properties.renderSettings.info-csm')}
      >
        <BooleanInput
          value={rendererSettingsState.csm.value}
          onChange={commitProperty(RenderSettingsComponent, 'csm')}
        />
      </InputGroup>
      <InputGroup
        name="Tone Mapping"
        label={t('editor:properties.renderSettings.lbl-toneMapping')}
        info={t('editor:properties.renderSettings.info-toneMapping')}
      >
        <SelectInput
          options={ToneMappingOptions}
          value={rendererSettingsState.toneMapping.value}
          onChange={commitProperty(RenderSettingsComponent, 'toneMapping')}
        />
      </InputGroup>
      <InputGroup
        name="Tone Mapping Exposure"
        label={t('editor:properties.renderSettings.lbl-toneMappingExposure')}
        info={t('editor:properties.renderSettings.info-toneMappingExposure')}
      >
        <CompoundNumericInput
          min={0}
          max={10}
          step={0.1}
          value={rendererSettingsState.toneMappingExposure.value}
          onChange={updateProperty(RenderSettingsComponent, 'toneMappingExposure')}
          onRelease={commitProperty(RenderSettingsComponent, 'toneMappingExposure')}
        />
      </InputGroup>
      <InputGroup
        name="Shadow Map Type"
        label={t('editor:properties.renderSettings.lbl-shadowMapType')}
        info={t('editor:properties.renderSettings.info-shadowMapType')}
      >
        <SelectInput
          options={ShadowTypeOptions}
          value={rendererSettingsState.shadowMapType.value ?? -1}
          onChange={commitProperty(RenderSettingsComponent, 'shadowMapType')}
        />
      </InputGroup>
    </PropertyGroup>
  )
}
