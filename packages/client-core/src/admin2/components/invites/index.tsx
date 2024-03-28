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
import { InviteType } from '@etherealengine/common/src/schema.type.module'
import { useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Input from '@etherealengine/ui/src/primitives/tailwind/Input'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HiMagnifyingGlass, HiPlus } from 'react-icons/hi2'
import AddEditInviteModal from './AddEditInviteModal'
import InviteTable from './InviteTable'
import RemoveInviteModal from './RemoveInviteModal'

export default function Invites() {
  const { t } = useTranslation()
  const search = useHookstate({ local: '', query: '' })
  const debouncedSearchQueryRef = useRef<ReturnType<typeof setTimeout>>()

  const selectedInvites = useHookstate<InviteType[]>([])

  useEffect(() => clearTimeout(debouncedSearchQueryRef.current), [])

  return (
    <>
      <div>
        <Text fontSize="xl" className="mb-6">
          {t('admin:components.invite.invites')}
        </Text>
        <div className="mb-4 flex justify-between">
          <Input
            placeholder={t('common:components.search')}
            value={search.local.value}
            onChange={(event) => {
              search.local.set(event.target.value)

              if (debouncedSearchQueryRef) {
                clearTimeout(debouncedSearchQueryRef.current)
              }

              debouncedSearchQueryRef.current = setTimeout(() => {
                search.query.set(event.target.value)
              }, 100)
            }}
            className="bg-theme-surface-main"
            containerClassname="w-1/5 block"
            startComponent={<HiMagnifyingGlass />}
          />
          <div className="flex gap-4">
            {selectedInvites.length > 0 && (
              <div>
                <Button
                  variant="danger"
                  size="small"
                  fullWidth
                  onClick={() => {
                    PopoverState.showPopupover(<RemoveInviteModal invites={selectedInvites.value} />)
                  }}
                >
                  {t('admin:components.invite.removeInvites')}
                </Button>
              </div>
            )}
            <div className="ml-auto">
              <Button
                startIcon={<HiPlus />}
                size="small"
                fullWidth
                onClick={() => {
                  PopoverState.showPopupover(<AddEditInviteModal />)
                }}
              >
                {t('admin:components.invite.create')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <InviteTable selectedInvites={selectedInvites} search={search.query.value} />
    </>
  )
}
