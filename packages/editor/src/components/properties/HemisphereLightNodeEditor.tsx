import React from 'react'
import NodeEditor from './NodeEditor'
import InputGroup from '../inputs/InputGroup'
import ColorInput from '../inputs/ColorInput'
import NumericInputGroup from '../inputs/NumericInputGroup'
import { useTranslation } from 'react-i18next'
import { CommandManager } from '../../managers/CommandManager'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { HemisphereLightComponent } from '@xrengine/engine/src/scene/components/HemisphereLightComponent'
import { updateHemisphereLight } from '@xrengine/engine/src/scene/functions/loaders/HemisphereLightFunctions'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { EditorComponentType } from './Util'

/**
 * HemisphereLightNodeEditor used to provide property customization view for HemisphereLightNode.
 *
 * @author Robert Long
 * @type {class Compoment}
 */
export const HemisphereLightNodeEditor: EditorComponentType = (props) => {
  const { t } = useTranslation()

  //function handle change in skyColor property
  const onChangeSkyColor = (skyColor) => {
    CommandManager.instance.setPropertyOnSelectionEntities({
      updateFunction: updateHemisphereLight,
      component: HemisphereLightComponent,
      properties: { skyColor }
    })
  }

  //function to handle changes in ground property
  const onChangeGroundColor = (groundColor) => {
    CommandManager.instance.setPropertyOnSelectionEntities({
      updateFunction: updateHemisphereLight,
      component: HemisphereLightComponent,
      properties: { groundColor }
    })
  }

  //function to handle changes in intensity property
  const onChangeIntensity = (intensity) => {
    CommandManager.instance.setPropertyOnSelectionEntities({
      updateFunction: updateHemisphereLight,
      component: HemisphereLightComponent,
      properties: { intensity }
    })
  }

  //renders view to customize HemisphereLightNode
  const lightComponent = getComponent(props.node.entity, HemisphereLightComponent)

  return (
    <NodeEditor {...props} description={t('editor:properties.hemisphere.description')}>
      <InputGroup name="Sky Color" label={t('editor:properties.hemisphere.lbl-skyColor')}>
        <ColorInput value={lightComponent.skyColor} onChange={onChangeSkyColor} />
      </InputGroup>
      <InputGroup name="Ground Color" label={t('editor:properties.hemisphere.lbl-groundColor')}>
        <ColorInput value={lightComponent.groundColor} onChange={onChangeGroundColor} />
      </InputGroup>
      <NumericInputGroup
        name="Intensity"
        label={t('editor:properties.hemisphere.lbl-intensity')}
        min={0}
        smallStep={0.001}
        mediumStep={0.01}
        largeStep={0.1}
        value={lightComponent.intensity}
        onChange={onChangeIntensity}
        unit="cd"
      />
    </NodeEditor>
  )
}

HemisphereLightNodeEditor.iconComponent = VerifiedUserIcon

export default HemisphereLightNodeEditor
