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

import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import { instancePath } from '@etherealengine/common/src/schema.type.module'
import { useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Modal from '@etherealengine/ui/src/primitives/tailwind/Modal'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import { useHookstate } from '@hookstate/core'
import React from 'react'
import { useTranslation } from 'react-i18next'

export default function RemoveInstanceModal({ instanceId }: { instanceId: string }) {
  const { t } = useTranslation()
  const removeInstance = useMutation(instancePath).remove
  const error = useHookstate('')
  const modalProcessing = useHookstate(false)

  const submitRemoveInstance = async () => {
    error.set('')
    try {
      modalProcessing.set(true)
      await removeInstance(instanceId)
      PopoverState.hidePopupover()
    } catch (e) {
      error.set(e.message)
    }
    modalProcessing.set(false)
  }

  return (
    <Modal
      title={t('admin:components.setting.patchInstanceserver')}
      className="w-[50vw]"
      onSubmit={submitRemoveInstance}
      onClose={PopoverState.hidePopupover}
      submitLoading={modalProcessing.value}
    >
      <Text component="h2">{`${t('admin:components.instance.confirmInstanceDelete')} (${instanceId}) ?`}</Text>
      {error.value ? <p className="mt-2 text-rose-700">{error.value}</p> : null}
    </Modal>
  )
}
