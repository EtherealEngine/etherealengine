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

import { ProjectUpdateState } from '@etherealengine/client-core/src/admin/services/ProjectUpdateService'
import { NotificationService } from '@etherealengine/client-core/src/common/services/NotificationService'
import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import { ProjectService, ProjectState } from '@etherealengine/client-core/src/common/services/ProjectService'
import config from '@etherealengine/common/src/config'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import LoadingCircle from '@etherealengine/ui/src/primitives/tailwind/LoadingCircle'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HiArrowPath, HiPlus } from 'react-icons/hi2'
import AddEditProjectModal from './AddEditProjectModal'
import UpdateEngineModal from './UpdateEngineModal'

export default function ProjectTopMenu() {
  const { t } = useTranslation()
  const projectState = useHookstate(getMutableState(ProjectState))
  const modalProcessing = useHookstate(false)

  const projectUpdateStatus = useHookstate(getMutableState(ProjectUpdateState)['tempProject']).value

  ProjectService.useAPIListeners()

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (projectState.rebuilding.value) {
      interval = setInterval(ProjectService.checkReloadStatus, 10000)
    } else {
      if (interval) clearInterval(interval)
      ProjectService.fetchProjects()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [projectState.rebuilding.value])
  return (
    <div className="mb-4 flex justify-between gap-2">
      <div className="flex gap-2">
        <Button
          startIcon={<HiArrowPath />}
          size="small"
          onClick={() => {
            PopoverState.showPopupover(<UpdateEngineModal />)
          }}
          disabled={config.client.localBuildOrDev}
          endIcon={
            !config.client.localBuildOrDev && projectState.rebuilding.value ? (
              <LoadingCircle className="h-6 w-6" />
            ) : undefined
          }
        >
          {!config.client.localBuildOrDev && projectState.rebuilding.value
            ? t('admin:components.project.rebuilding')
            : t('admin:components.project.updateAndRebuild')}
        </Button>
        <Button
          startIcon={<HiPlus />}
          size="small"
          onClick={() => {
            PopoverState.showPopupover(
              <AddEditProjectModal
                processing={modalProcessing.value}
                onSubmit={async () => {
                  modalProcessing.set(true)
                  await ProjectService.uploadProject({
                    sourceURL: projectUpdateStatus.sourceURL,
                    destinationURL: projectUpdateStatus.destinationURL,
                    name: projectUpdateStatus.projectName,
                    reset: true,
                    commitSHA: projectUpdateStatus.selectedSHA,
                    sourceBranch: projectUpdateStatus.selectedBranch,
                    updateType: projectUpdateStatus.updateType,
                    updateSchedule: projectUpdateStatus.updateSchedule
                  }).catch((err) => {
                    NotificationService.dispatchNotify(err.message, { variant: 'error' })
                  })
                  modalProcessing.set(false)
                }}
                submitDisabled={projectUpdateStatus ? projectUpdateStatus.submitDisabled : true}
                update={false}
              />
            )
          }}
        >
          {t('admin:components.project.addProject')}
        </Button>
      </div>
    </div>
  )
}
