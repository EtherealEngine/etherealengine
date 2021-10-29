import React, { Component } from 'react'
import NodeEditor from '../properties/NodeEditor'
import InputGroup from '../inputs/InputGroup'
import ImageInput from '../inputs/ImageInput'
import Vector3Input from '../inputs/Vector3Input'
import Vector2Input from '../inputs/Vector2Input'
import { Cloud } from '@styled-icons/fa-solid/Cloud'
import i18n from 'i18next'
import { withTranslation } from 'react-i18next'
import ColorInput from '../inputs/ColorInput'
import { CommandManager } from '../../managers/CommandManager'

//declaring properties for CloudsNodeEditor
type CloudsNodeEditorProps = {
  node: any
  t: Function
}

/**
 * CloudsNodeEditor provides the editor to customize properties.
 *
 * @author Robert Long
 * @type {class component}
 */
const CloudsNodeEditor = (props: CloudsNodeEditorProps) => {
  const onChangeProperty = (name: string) => {
    return (value) => {
      CommandManager.instance.setPropertyOnSelection(name, value)
    }
  }

  return (
    <NodeEditor {...props} description={props.t('editor:properties.clouds.description')}>
      <InputGroup name="Image" label={props.t('editor:properties.clouds.lbl-image')}>
        <ImageInput value={props.node.texture} onChange={onChangeProperty('texture')} />
      </InputGroup>

      <InputGroup name="World Scale" label={props.t('editor:properties.clouds.lbl-wroldScale')}>
        <Vector3Input
          value={props.node.worldScale}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          onChange={onChangeProperty('worldScale')}
        />
      </InputGroup>

      <InputGroup name="Dimensions" label={props.t('editor:properties.clouds.lbl-dimensions')}>
        <Vector3Input
          value={props.node.dimensions}
          smallStep={1}
          mediumStep={1}
          largeStep={1}
          onChange={onChangeProperty('dimensions')}
        />
      </InputGroup>

      <InputGroup name="Noise Zoom" label={props.t('editor:properties.clouds.lbl-noiseZoom')}>
        <Vector3Input
          value={props.node.noiseZoom}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          onChange={onChangeProperty('noiseZoom')}
        />
      </InputGroup>

      <InputGroup name="Noise Offset" label={props.t('editor:properties.clouds.lbl-noiseOffset')}>
        <Vector3Input
          value={props.node.noiseOffset}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          onChange={onChangeProperty('noiseOffset')}
        />
      </InputGroup>

      <InputGroup name="Sprite Scale" label={props.t('editor:properties.clouds.lbl-spriteScale')}>
        <Vector2Input value={props.node.spriteScaleRange} onChange={onChangeProperty('spriteScaleRange')} />
      </InputGroup>

      <InputGroup name="Fog Color" label={props.t('editor:properties.clouds.lbl-fogColor')}>
        <ColorInput value={props.node.fogColor} onChange={onChangeProperty('fogColor')} disabled={false} />
      </InputGroup>

      <InputGroup name="Fog Range" label={props.t('editor:properties.clouds.lbl-fogRange')}>
        <Vector2Input value={props.node.fogRange} onChange={onChangeProperty('fogRange')} />
      </InputGroup>
    </NodeEditor>
  )
}

CloudsNodeEditor.iconComponent = Cloud
CloudsNodeEditor.description = i18n.t('editor:properties.clouds.description')

export default withTranslation()(CloudsNodeEditor)
