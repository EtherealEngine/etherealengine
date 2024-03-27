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

import { useHookstate } from '@hookstate/core'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import { projectPath } from '@etherealengine/common/src/schema.type.module'
import { useFind } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import FormField from '../inputs/FormField'
import StringInput from '../inputs/StringInput'
import Dialog from './Dialog'

/**
 * CopySceneDialog used to show dialog for saving scene to another project
 */
export function CopySceneDialog({
  currentSceneName,
  currentProjectName,
  onConfirm,
  onCancel
}: {
  onConfirm: (val: { name: string; projectName: string }) => void
  onCancel: (val?: boolean) => void
}) {
  const name = useHookstate('')
  const { t } = useTranslation()

  const projectsQuery = useFind(projectPath, {
    query: {
      allowed: true,
      $limit: 100,
      action: 'admin',
      $sort: {
        name: 1
      }
    }
  })

  const projectsMenu: InputMenuItem[] = projectsQuery.data.map((el) => {
    return {
      label: el.name,
      value: el.name
    }
  })
  const selectedProject = useHookstate('')
  const handleProjectChange = (e) => {
    const { value } = e.target
    selectedProject.set(value)
  }
  /**
   * onConfirmCallback callback function is used handle confirm dialog.
   *
   * @type {function}
   */
  const onConfirmCallback = useCallback(
    (e) => {
      e.preventDefault()
      onConfirm({ name: name.value, projectName: selectedProject.value })
    },
    [onConfirm]
  )

  /**
   * onCancelCallback callback function used to handle cancel of dialog.
   *
   * @type {function}
   */
  const onCancelCallback = useCallback(
    (e) => {
      e.preventDefault()
      onCancel()
    },
    [onCancel]
  )

  //returning view for dialog view.
  return (
    <Dialog
      title={t('editor:dialog.copyScene.title')}
      onConfirm={onConfirmCallback}
      onCancel={onCancelCallback}
      confirmLabel={t('editor:dialog.copyScene.lbl-confirm')}
      disabled={selectedProject.value === '' || name.value.length === 0}
    >
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={}>Current Scene: {currentSceneName}</div>
          <div style={}>Current Project: {currentProjectName}</div>
          <FormField>
            <label htmlFor="name">{t('editor:dialog.copyScene.lbl-name')}</label>
            <StringInput
              id="name"
              required
              pattern={'[A-Za-z0-9-\':"!@#$%^&*(),.?~ ]{4,64}'}
              title={t('editor:dialog.copyScene.info-name')}
              value={name.value}
              onChange={(newName) => name.set(newName)}
            />
          </FormField>
          <InputSelect
            name="selectProject"
            label={t('editor:dialog.copyScene.project')}
            value={selectedProject.value}
            menu={projectsMenu}
            onChange={handleProjectChange}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default CopySceneDialog
