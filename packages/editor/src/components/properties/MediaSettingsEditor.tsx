import React from 'react'
import { useTranslation } from 'react-i18next'

import { DistanceModel, DistanceModelOptions } from '@xrengine/engine/src/audio/constants/AudioConstants'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { getState, useHookstate } from '@xrengine/hyperflux'

import BooleanInput from '../inputs/BooleanInput'
import CompoundNumericInput from '../inputs/CompoundNumericInput'
import InputGroup from '../inputs/InputGroup'
import NumericInputGroup from '../inputs/NumericInputGroup'
import SelectInput from '../inputs/SelectInput'

export const MediaSettingsEditor = () => {
  const { t } = useTranslation()
  const sceneMetadata = useHookstate(getState(Engine.instance.currentWorld.sceneMetadata).mediaSettings)
  const settings = sceneMetadata.get({ noproxy: true })

  return (
    <>
      <InputGroup
        name="Media Distance Model"
        label={t('editor:properties.scene.lbl-mediaDistanceModel')}
        info={t('editor:properties.scene.info-mediaDistanceModel')}
      >
        <SelectInput
          options={DistanceModelOptions}
          value={settings.distanceModel}
          onChange={(val) => sceneMetadata.distanceModel.set(val)}
        />
      </InputGroup>
      <InputGroup
        name="Use Immersive Media"
        label={t('editor:properties.scene.lbl-immersiveMedia')}
        info={t('editor:properties.scene.info-immersiveMedia')}
      >
        <BooleanInput value={settings.immersiveMedia} onChange={(val) => sceneMetadata.immersiveMedia.set(val)} />
      </InputGroup>

      {settings.distanceModel === DistanceModel.Linear ? (
        <InputGroup
          name="Media Rolloff Factor"
          label={t('editor:properties.scene.lbl-mediaRolloffFactor')}
          info={t('editor:properties.scene.info-mediaRolloffFactor')}
        >
          <CompoundNumericInput
            min={0}
            max={1}
            smallStep={0.001}
            mediumStep={0.01}
            largeStep={0.1}
            value={settings.rolloffFactor}
            onChange={(val) => sceneMetadata.rolloffFactor.set(val)}
          />
        </InputGroup>
      ) : (
        <NumericInputGroup
          name="Media Rolloff Factor"
          label={t('editor:properties.scene.lbl-mediaRolloffFactor')}
          info={t('editor:properties.scene.info-mediaRolloffFactorInfinity')}
          min={0}
          smallStep={0.1}
          mediumStep={1}
          largeStep={10}
          value={settings.rolloffFactor}
          onChange={(val) => sceneMetadata.rolloffFactor.set(val)}
        />
      )}
      <NumericInputGroup
        name="Media Ref Distance"
        label={t('editor:properties.scene.lbl-mediaRefDistance')}
        info={t('editor:properties.scene.info-mediaRefDistance')}
        min={0}
        smallStep={0.1}
        mediumStep={1}
        largeStep={10}
        value={settings.refDistance}
        onChange={(val) => sceneMetadata.refDistance.set(val)}
        unit="m"
      />
      <NumericInputGroup
        name="Media Max Distance"
        label={t('editor:properties.scene.lbl-mediaMaxDistance')}
        info={t('editor:properties.scene.info-mediaMaxDistance')}
        min={0}
        smallStep={0.1}
        mediumStep={1}
        largeStep={10}
        value={settings.maxDistance}
        onChange={(val) => sceneMetadata.maxDistance.set(val)}
        unit="m"
      />
      <NumericInputGroup
        name="Media Cone Inner Angle"
        label={t('editor:properties.scene.lbl-mediaConeInnerAngle')}
        info={t('editor:properties.scene.info-mediaConeInnerAngle')}
        min={0}
        max={360}
        smallStep={0.1}
        mediumStep={1}
        largeStep={10}
        value={settings.coneInnerAngle}
        onChange={(val) => sceneMetadata.coneInnerAngle.set(val)}
        unit="°"
      />
      <NumericInputGroup
        name="Media Cone Outer Angle"
        label={t('editor:properties.scene.lbl-mediaConeOuterAngle')}
        info={t('editor:properties.scene.info-mediaConeOuterAngle')}
        min={0}
        max={360}
        smallStep={0.1}
        mediumStep={1}
        largeStep={10}
        value={settings.coneOuterAngle}
        onChange={(val) => sceneMetadata.coneOuterAngle.set(val)}
        unit="°"
      />
      <InputGroup
        name="Media Cone Outer Gain"
        label={t('editor:properties.scene.lbl-mediaConeOuterGain')}
        info={t('editor:properties.scene.info-mediaConeOuterGain')}
      >
        <CompoundNumericInput
          min={0}
          max={1}
          step={0.01}
          value={settings.coneOuterGain}
          onChange={(val) => sceneMetadata.coneOuterGain.set(val)}
        />
      </InputGroup>
    </>
  )
}
