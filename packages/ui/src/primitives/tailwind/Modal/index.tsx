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

import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MdClose } from 'react-icons/md'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'
import LoadingCircle from '../LoadingCircle'
import Text from '../Text'

export interface ModalProps {
  title?: string
  hideFooter?: boolean
  className?: string
  children: ReactNode
  loading?: boolean
  onClose?: () => void
  onSubmit?: () => void
}

export const ModalHeader = ({ title, onClose }: { closeIcon?: boolean; title?: string; onClose?: () => void }) => {
  return (
    <div className="border-b-theme-primary relative flex items-center justify-center border-b px-6 py-5">
      {title && <Text>{title}</Text>}
      <Button
        variant="outline"
        className="absolute right-0 border-0 dark:bg-transparent dark:text-[#A3A3A3]"
        startIcon={<MdClose />}
        onClick={onClose}
      />
    </div>
  )
}

export const ModalFooter = ({ onCancel, onSubmit }: { onCancel?: () => void; onSubmit?: () => void }) => {
  const { t } = useTranslation()
  return (
    <div className="border-t-theme-primary grid grid-flow-col border-t px-6 py-5">
      <Button variant="outline" onClick={onCancel}>
        {t('common:components.cancel')}
      </Button>
      {onSubmit && (
        <Button onClick={onSubmit} className="place-self-end">
          {t('common:components.confirm')}
        </Button>
      )}
    </div>
  )
}

const Modal = ({ title, onClose, onSubmit, hideFooter, children, className, loading }: ModalProps) => {
  const twClassName = twMerge('relative max-h-full w-full max-w-2xl p-4', className)
  const loadingStyle = !loading ? 'w-max' : ''
  return (
    <div className={twClassName}>
      <div className={`bg-theme-primary relative rounded-lg shadow ${loadingStyle}`}>
        {onClose && <ModalHeader title={title} onClose={onClose} />}
        {loading && (
          <div className="h-full w-full px-10 py-6">
            <LoadingCircle className="h-8 w-8" />
          </div>
        )}
        {!loading && <div className="w-full px-10 py-6">{children}</div>}
        {!loading && !hideFooter && <ModalFooter onCancel={onClose} onSubmit={onSubmit} />}
      </div>
    </div>
  )
}

export default Modal
