import React, { Component, useState } from 'react'
import InputGroup from '../inputs/InputGroup'
import StringInput from '../inputs/StringInput'
import styled from 'styled-components'
import { withTranslation } from 'react-i18next'
import { CommandManager } from '../../managers/CommandManager'

/**
 * Creating styled component using InputGroup component.
 *
 * @author Robert Long
 * @type {Styled Component}
 */
const StyledNameInputGroup = (styled as any)(InputGroup)`
  label {
    width: auto !important;
    padding-right: 8px;
  }
`

type Types = {
  node: any
  t: Function
}

/**
 * NameInputGroup is used to render input group PropertiesPanelContainer.
 *
 * @author Robert Long
 * @type {class component}
 */
const NameInputGroup = (props: Types) => {
  const setNameToComponent = (name) => {
    const nameComponent = getComponent(props.node.eid, NameComponent)
    nameComponent.name = name
  }

  let [name, setName] = useState(props.node.name)
  let [focusedNode, setFocusedNode] = useState(null)

  //function to handle change in name property
  const onUpdateName = (name) => {
    setName(name)
    setFocusedNode(null)
  }

  //function called when element get focused
  //Updating state of component
  const onFocus = () => {
    setFocusedNode(props.node)
    setName(props.node.name)
  }

  // function to handle onBlur event on name property
  const onBlurName = () => {
    // Check that the focused node is current node before setting the property.
    // This can happen when clicking on another node in the HierarchyPanel
    if (props?.node?.name !== name && props?.node === focusedNode) {
      CommandManager.instance.setPropertyOnSelection('name', name)
    }

    setFocusedNode(null)
  }

  //function to handle keyUp event on name property
  const onKeyUpName = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      CommandManager.instance.setPropertyOnSelection('name', (this.state as any).name)
    }
  }
  //rendering view NameInputGroup component
  let n = name

  if (!focusedNode) {
    n = props.node.name
  }

  return (
    <StyledNameInputGroup name="Name" label={props.t('editor:properties.name.lbl-name')}>
      <StringInput value={name} onChange={onUpdateName} onFocus={onFocus} onBlur={onBlurName} onKeyUp={onKeyUpName} />
    </StyledNameInputGroup>
  )
}

export default withTranslation()(NameInputGroup)
