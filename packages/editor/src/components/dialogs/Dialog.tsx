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

import React, { useCallback } from 'react'

import { Button, SecondaryButton } from '../inputs/Button'

const dialogContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '4px',
  backgroundColor: 'var(--dockBackground)',
  maxWidth: '800px',
  minWidth: '250px',
  minHeight: '150px',
  maxHeight: '80vh'
}

const dialogHeaderStyles = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  padding: '8px',
  fontSize: '20px',
  overflow: 'hidden',
  borderTopLeftRadius: 'inherit',
  borderTopRightRadius: 'inherit',
  color: 'white'
}

const dialogContentStyles = {
  color: 'var(--textColor)',
  display: 'flex',
  flex: 1,
  flexDirection: 'row',
  overflow: 'hidden',
  padding: '8px',
  minHeight: '100px',
  fontFamily: 'var(--lato)',
  fontSize: '12px',
  backgroundColor: 'var(--background)'
}

const dialogBottomNavStyles = {
  display: 'flex',

  padding: '8px',
  marginBottom: '10px'
}

const buttonStyles = {
  minWidth: '75px',
  margin: '10px'
}

const DialogForm = ({ tag, onSubmit, children }) => {
  return tag ? React.createElement(tag, { onSubmit }, children) : <form onSubmit={onSubmit}>{children}</form>
}
/**
 * Dialog used to render view for Dialog which contains form.
 *
 * @param  {Props}
 * @constructor
 */
interface Props {
  tag?: any
  title?: string
  bottomNav?: any
  children?: any
  cancelLabel?: string
  confirmLabel?: string
  onCancel?: any
  onConfirm?: any
  disabled?: boolean
}

const Dialog = (props: Props) => {
  // callback function used to handle form submit
  const onSubmitForm = useCallback(
    (e) => {
      e.preventDefault()

      if (props.onConfirm) {
        props.onConfirm(e)
      }
    },
    [props.onConfirm]
  )
  // returning view for Dialog component
  return (
    <DialogForm tag={props.tag} onSubmit={onSubmitForm}>
      <div style={dialogContainerStyles as React.CSSProperties}>
        <div style={dialogHeaderStyles as React.CSSProperties}>{props.title}</div>
        <div style={dialogContentStyles as React.CSSProperties}>{props.children}</div>
        {(props.onConfirm || props.onCancel || props.bottomNav) && (
          <div style={dialogBottomNavStyles}>
            {props.bottomNav}
            {props.onCancel && (
              <SecondaryButton onClick={props.onCancel} style={buttonStyles}>
                {props.cancelLabel || 'Cancel'}
              </SecondaryButton>
            )}
            {props.onConfirm && (
              <Button
                disabled={props.disabled}
                type="submit"
                onClick={props.tag === 'form' ? null : props.onConfirm}
                style={buttonStyles}
              >
                {props.confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </DialogForm>
  )
}

export default Dialog
