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

import { State, useHookstate } from '@etherealengine/hyperflux'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdClose } from 'react-icons/io'
import Input from '../Input'
import Label from '../Label'

export interface LabelProps extends React.HtmlHTMLAttributes<HTMLLabelElement> {
  emailList: State<string[]>
  error?: string
  label?: string
  disabled?: boolean
}

const isInList = (email: string, emailList: string[]) => {
  return emailList.includes(email)
}

const isEmail = (email: string) => {
  return /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/.test(email)
}

const MultiEmailInput = ({ emailList, error, label, disabled }: LabelProps) => {
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)

  const state = useHookstate({
    currentEmail: '',
    errorLabel: ''
  } as {
    currentEmail: string
    errorLabel: string
  })

  const addToEmailList = () => {
    const value = state.currentEmail.value.trim()

    if (value && isValid(value)) {
      emailList.merge([state.currentEmail.value])
      state.currentEmail.set('')
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ','].includes(event.key)) {
      event.preventDefault()
      addToEmailList()
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    state.merge({
      currentEmail: event.target.value,
      errorLabel: ''
    })
  }

  const handleDelete = (email: string) => {
    emailList.set(emailList.value.filter((item) => item !== email))
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()

    const paste = event.clipboardData.getData('text')
    const emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g)

    if (emails) {
      const toBeAdded = emails.filter((email) => !isInList(email, emailList.value))
      emailList.merge(toBeAdded)
    }
  }

  const isValid = (email: string) => {
    state.errorLabel.set('')
    let error = ''

    if (isInList(email, emailList.value)) {
      error = t('common:multiEmailInput.alreadyAdded', { email })
    }

    if (!isEmail(email)) {
      error = t('common:multiEmailInput.invalidEmail', { email })
    }

    if (error) {
      state.errorLabel.set(error)

      return false
    }

    return true
  }

  useEffect(() => {
    console.log('debug1 the ref was', ref)
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        addToEmailList()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [ref])

  let errorLabel = state.errorLabel.value || error

  return (
    <>
      {label && <Label className="self-stretch">{label}</Label>}

      {emailList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emailList.value.map((item) => (
            <div
              className="flex w-fit items-center justify-between gap-1 rounded-full bg-neutral-300 px-2 py-1 text-black"
              key={item}
            >
              {item}
              <button
                disabled={disabled}
                className="button rounded-full bg-white p-1"
                onClick={() => handleDelete(item)}
              >
                <IoMdClose />
              </button>
            </div>
          ))}
        </div>
      )}

      <Input
        className="w-full"
        value={state.currentEmail.value}
        placeholder={t('common:multiEmailInput.placeholder')}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        ref={ref}
      />

      {errorLabel && <p className="error text-[#E11D48]">{errorLabel}</p>}
    </>
  )
}

export default MultiEmailInput