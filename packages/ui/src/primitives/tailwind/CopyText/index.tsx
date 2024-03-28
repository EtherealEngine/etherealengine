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

import { NO_PROXY, useHookstate } from '@etherealengine/hyperflux'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HiCheck, HiDocument } from 'react-icons/hi2'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'

export interface CopyTextProps extends React.HTMLAttributes<HTMLTextAreaElement> {
  text: string
  className?: string
  size?: 'small' | 'medium' | 'large'
}

const CopyText = ({ text, className, size = 'small' }: CopyTextProps) => {
  const { t } = useTranslation()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buttonIcon = useHookstate(<HiDocument />)

  const copyText = () => {
    navigator.clipboard.writeText(text)
    buttonIcon.set(<HiCheck />)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      buttonIcon.set(<HiDocument />)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <Button
      title={t('common:components.copyText')}
      variant="outline"
      size={size}
      onClick={copyText}
      className={twMerge('p-1.5 [&>*]:m-0', className)}
      startIcon={buttonIcon.get(NO_PROXY)}
    />
  )
}

export default CopyText
