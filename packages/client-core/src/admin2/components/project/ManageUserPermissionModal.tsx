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

import { NotificationService } from '@etherealengine/client-core/src/common/services/NotificationService'
import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import { ProjectService } from '@etherealengine/client-core/src/common/services/ProjectService'
import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { userHasAccess } from '@etherealengine/client-core/src/user/userHasAccess'
import { InviteCode, ProjectPermissionType, ProjectType } from '@etherealengine/common/src/schema.type.module'
import { getMutableState } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Input from '@etherealengine/ui/src/primitives/tailwind/Input'
import Modal from '@etherealengine/ui/src/primitives/tailwind/Modal'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import Toggle from '@etherealengine/ui/src/primitives/tailwind/Toggle'
import { useHookstate } from '@hookstate/core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlineRemoveCircleOutline } from 'react-icons/md'

export default function ManageUserPermissionModal({
  project,
  projectPermissions
}: {
  project: ProjectType
  projectPermissions: readonly ProjectPermissionType[]
}) {
  console.log('ManageUserPermissionModal', project, projectPermissions)
  const { t } = useTranslation()
  const selfUser = useHookstate(getMutableState(AuthState)).user
  const userInviteCode = useHookstate('' as InviteCode)
  const userInviteCodeError = useHookstate(undefined)
  const selfUserPermission =
    project?.projectPermissions?.find((permission) => permission.userId === selfUser.id.value)?.type === 'owner' ||
    userHasAccess('admin:admin')
      ? 'owner'
      : 'user'

  const handleCreatePermission = async () => {
    if (!userInviteCode.value) {
      userInviteCodeError.set(t('admin:components.project.inviteCodeCantEmpty'))
      return
    }
    try {
      await ProjectService.createPermission(userInviteCode.value, project.id)
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  }

  const handlePatchPermission = async (permission: ProjectPermissionType) => {
    try {
      await ProjectService.patchPermission(permission.id, permission.type === 'owner' ? 'user' : 'owner')
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  }

  const handleRemovePermission = async (id: string) => {
    try {
      await ProjectService.removePermission(id)
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  }

  return (
    <Modal
      title={t('admin:components.project.userAccess')}
      className="w-[50vw]"
      onSubmit={() => {
        handleCreatePermission()
      }}
      hideFooter={selfUserPermission !== 'owner'}
      onClose={() => PopoverState.hidePopupover()}
    >
      {selfUserPermission === 'owner' && (
        <Input
          label={t('admin:components.project.userInviteCode')}
          value={userInviteCode.value}
          onChange={(event) => userInviteCode.set(event.target.value as InviteCode)}
          error={userInviteCodeError.value}
        />
      )}
      <div className="grid gap-4">
        {projectPermissions?.map((permission) => (
          <div key={permission.id} className="flex items-center gap-2">
            <Text fontSize="sm">
              {permission.userId === selfUser.id.value ? `${permission.user?.name} (you)` : permission.user?.name}
            </Text>
            <Text fontSize="sm" theme="secondary">
              {permission.type}
            </Text>
            <Toggle
              value={permission.type === 'owner'}
              onChange={() => handlePatchPermission(permission)}
              disabled={
                selfUserPermission !== 'owner' ||
                selfUser.id.value === permission.userId ||
                projectPermissions?.length === 1
              }
            />
            <Button
              startIcon={<MdOutlineRemoveCircleOutline />}
              title="Remove Access"
              onClick={() => handleRemovePermission(permission.id)}
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}
