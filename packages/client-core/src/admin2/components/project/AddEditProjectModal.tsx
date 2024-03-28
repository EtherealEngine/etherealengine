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

import {
  ProjectUpdateService,
  ProjectUpdateState
} from '@etherealengine/client-core/src/admin/services/ProjectUpdateService'
import { PopoverState } from '@etherealengine/client-core/src/common/services/PopoverState'
import { ProjectService } from '@etherealengine/client-core/src/common/services/ProjectService'
import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { DefaultUpdateSchedule } from '@etherealengine/common/src/interfaces/ProjectPackageJsonType'
import { ProjectBranchType, ProjectCommitType, ProjectType } from '@etherealengine/common/src/schema.type.module'
import { toDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import { getMutableState } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Input from '@etherealengine/ui/src/primitives/tailwind/Input'
import Label from '@etherealengine/ui/src/primitives/tailwind/Label'
import LoadingCircle from '@etherealengine/ui/src/primitives/tailwind/LoadingCircle'
import { ModalHeader } from '@etherealengine/ui/src/primitives/tailwind/Modal'
import Radios from '@etherealengine/ui/src/primitives/tailwind/Radio'
import Select from '@etherealengine/ui/src/primitives/tailwind/Select'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import Toggle from '@etherealengine/ui/src/primitives/tailwind/Toggle'
import { useHookstate } from '@hookstate/core'
import { t } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { CiCircleCheck, CiCircleRemove, CiWarning } from 'react-icons/ci'

const autoUpdateIntervalOptions = [
  {
    value: '*/5 * * * *',
    label: `5 ${t('admin:components.project.minutes')}`
  },
  {
    value: '*/30 * * * *',
    label: `30 ${t('admin:components.project.minutes')}`
  },
  {
    value: '0 * * * *',
    label: `1 ${t('admin:components.project.hour')}`
  },
  {
    value: '0 */3 * * *',
    label: `3 ${t('admin:components.project.hours')}`
  },
  {
    value: '0 */6 * * *',
    label: `6 ${t('admin:components.project.hours')}`
  },
  {
    value: '0 */12 * * *',
    label: `12 ${t('admin:components.project.hours')}`
  },
  {
    value: '0 0 * * *',
    label: `1 ${t('admin:components.project.day')}`
  }
]

export default function AddEditProjectModal({
  update,
  inputProject,
  onSubmit,
  processing,
  submitDisabled
}: {
  update: boolean
  inputProject?: ProjectType
  onSubmit: () => void
  submitDisabled: boolean
  processing: boolean
}) {
  const { t } = useTranslation()
  const showAutoUpdateOptions = useHookstate(false)

  const project =
    update && inputProject
      ? inputProject
      : {
          id: '',
          name: 'tempProject',
          thumbnail: '',
          repositoryPath: '',
          needsRebuild: false,
          updateType: 'none' as ProjectType['updateType'],
          commitSHA: '',
          sourceBranch: '',
          sourceRepo: '',
          commitDate: toDateTimeSql(new Date())
        }
  const projectUpdateStatus = useHookstate(getMutableState(ProjectUpdateState)[project.name])

  const user = useHookstate(getMutableState(AuthState).user)
  const hasGithubProvider = user.identityProviders.value.find((ip) => ip.type === 'github')

  const matchingCommit = projectUpdateStatus?.value?.commitData?.find(
    (commit: ProjectCommitType) => commit.commitSHA === projectUpdateStatus.value.selectedSHA
  )
  const matchesEngineVersion = matchingCommit ? (matchingCommit as ProjectCommitType).matchesEngineVersion : false

  const branchSelectOptions = projectUpdateStatus?.value?.branchData.map((projectBranch: ProjectBranchType) => ({
    value: projectBranch.name,
    name: `Branch: ${projectBranch.name} ${
      projectBranch.branchType === 'main'
        ? '(Main branch)'
        : projectBranch.branchType === 'deployment'
        ? '(Deployment branch)'
        : ''
    }`
  }))

  const commitSelectOptions = projectUpdateStatus?.value?.commitData.map((projectCommit: ProjectCommitType) => {
    let name = `Commit ${projectCommit.commitSHA?.slice(0, 8)}`
    if (projectCommit.projectVersion) name += ` -- Project Ver. ${projectCommit.projectVersion}`
    if (projectCommit.engineVersion) name += ` -- Engine Ver. ${projectCommit.engineVersion}`
    if (projectCommit.datetime) {
      const datetime = new Date(projectCommit.datetime).toLocaleString('en-us', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })
      name += ` -- Pushed ${datetime}`
    }
    return {
      value: projectCommit.commitSHA,
      name
    }
  })

  const handleCommitChange = async (commitValue: string, commitData?: any) => {
    if (!commitData) {
      commitData = projectUpdateStatus.value.commitData
    }

    const selectedSHA = commitValue
    ProjectUpdateService.setSourceVsDestinationChecked(project.name, false)
    ProjectUpdateService.setSelectedSHA(project.name, selectedSHA)
    if (selectedSHA === '') {
      ProjectUpdateService.setSourceValid(project.name, false)
      ProjectUpdateService.setCommitError(project.name, '')
      ProjectUpdateService.setSourceProjectName(project.name, '')
      return
    }
    const valueRegex = new RegExp(`^${commitValue}`, 'g')
    let matchingCommit = commitData.find((data) => valueRegex.test(data.commitSHA))
    if (!matchingCommit) {
      const commitResponse = (await ProjectService.checkUnfetchedCommit({
        url: projectUpdateStatus.value.sourceURL,
        selectedSHA
      })) as any
      if (commitResponse.error) {
        ProjectUpdateService.setCommitError(project.name, commitResponse.text)
        ProjectUpdateService.setSourceProjectName(project.name, '')
        return
      } else {
        ProjectUpdateService.mergeCommitData(project.name, commitResponse)
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null)
          }, 100)
        })
        matchingCommit = commitData.find((data) => valueRegex.test(data.commitSHA))
      }
    }
    ProjectUpdateService.setSourceProjectName(project.name, matchingCommit?.projectName || '')
    ProjectUpdateService.setCommitError(project.name, '')
    ProjectUpdateService.setSourceValid(project.name, true)
  }

  const handleChangeBranch = async (branchValue: string) => {
    try {
      ProjectUpdateService.resetSourceState(project.name, { resetSourceURL: false, resetBranch: false })
      ProjectUpdateService.setSelectedBranch(project.name, branchValue)
      ProjectUpdateService.setCommitsProcessing(project.name, true)
      const projectResponse = (await ProjectService.fetchProjectCommits(
        projectUpdateStatus.value.sourceURL,
        branchValue
      )) as any
      ProjectUpdateService.setCommitsProcessing(project.name, false)
      if (projectResponse.error) {
        ProjectUpdateService.setShowCommitSelector(project.name, false)
        ProjectUpdateService.setBranchError(project.name, projectResponse.text)
      } else {
        ProjectUpdateService.setShowCommitSelector(project.name, true)
        ProjectUpdateService.setCommitData(project.name, projectResponse)

        if (project.commitSHA) {
          const commitExists = projectResponse.find((item: ProjectCommitType) => item.commitSHA === project.commitSHA)

          if (commitExists) {
            handleCommitChange(project.commitSHA, projectResponse)
          }
        }
      }
    } catch (err) {
      ProjectUpdateService.setCommitsProcessing(project.name, false)
      ProjectUpdateService.setShowCommitSelector(project.name, false)
      ProjectUpdateService.setBranchError(project.name, err.message)
      console.log('projectResponse error', err)
    }
  }

  const handleChangeDestination = (e) => {
    const { value } = e.target
    ProjectUpdateService.setDestinationError(project.name, value ? '' : t('admin:components.project.urlRequired'))
    ProjectUpdateService.setDestinationURL(project.name, value)
  }

  const handleChangeDestinationRepo = async (e) => {
    if (e.target.value && e.target.value.length > 0) {
      try {
        ProjectUpdateService.resetDestinationState(project.name, { resetDestinationURL: false })
        ProjectUpdateService.setDestinationValid(project.name, false)
        ProjectUpdateService.setDestinationProcessing(project.name, true)
        const destinationResponse = await ProjectService.checkDestinationURLValid({
          url: e.target.value,
          inputProjectURL: inputProject?.repositoryPath
        })
        ProjectUpdateService.setDestinationProcessing(project.name, false)
        if (destinationResponse.error) {
          ProjectUpdateService.setDestinationValid(project.name, false)
          ProjectUpdateService.setDestinationError(project.name, destinationResponse.text!)
        } else {
          if (destinationResponse.destinationValid) {
            if (update) ProjectUpdateService.setSubmitDisabled(project.name, false)
            ProjectUpdateService.setDestinationValid(project.name, destinationResponse.destinationValid)
            if (destinationResponse.projectName)
              ProjectUpdateService.setDestinationProjectName(project.name, destinationResponse.projectName)
            if (project.sourceRepo) {
              handleChangeSource({ target: { value: project.sourceRepo } })
              handleChangeSourceRepo({ target: { value: project.sourceRepo } })
            }
            if (destinationResponse.repoEmpty) ProjectUpdateService.setDestinationRepoEmpty(project.name, true)
            if (projectUpdateStatus.value.selectedSHA.length > 0)
              handleCommitChange(projectUpdateStatus.value.selectedSHA)
          } else {
            ProjectUpdateService.setDestinationValid(project.name, false)
            ProjectUpdateService.setDestinationError(project.name, destinationResponse.text!)
          }
        }
      } catch (err) {
        ProjectUpdateService.setDestinationProcessing(project.name, false)
        ProjectUpdateService.setDestinationValid(project.name, false)
        ProjectUpdateService.setDestinationError(project.name, err.message)
        console.log('Destination error', err)
      }
    }
  }

  const handleChangeSource = (e) => {
    const { value } = e.target
    ProjectUpdateService.setSourceURLError(project.name, value ? '' : t('admin:components.project.urlRequired'))
    ProjectUpdateService.setSourceURL(project.name, value)
  }

  const handleChangeSourceRepo = async (e) => {
    try {
      ProjectUpdateService.resetSourceState(project.name, { resetSourceURL: false })
      ProjectUpdateService.setBranchProcessing(project.name, true)
      const branchResponse = (await ProjectService.fetchProjectBranches(e.target.value)) as any
      ProjectUpdateService.setBranchProcessing(project.name, false)
      if (branchResponse.error) {
        ProjectUpdateService.setShowBranchSelector(project.name, false)
        ProjectUpdateService.setSourceURLError(project.name, branchResponse.text)
      } else {
        ProjectUpdateService.setShowBranchSelector(project.name, true)
        ProjectUpdateService.setBranchData(project.name, branchResponse)
        if (project.sourceBranch) {
          const branchExists = branchResponse.find((item: ProjectBranchType) => item.name === project.sourceBranch)

          if (branchExists) {
            handleChangeBranch(project.sourceBranch)
          }
        }
      }
    } catch (err) {
      ProjectUpdateService.setBranchProcessing(project.name, false)
      ProjectUpdateService.setShowBranchSelector(project.name, false)
      ProjectUpdateService.setBranchError(project.name, err.message)
      console.log('Branch fetch error', err)
    }
  }

  return (
    <div className="relative max-h-full w-[50vw] max-w-2xl p-4">
      <div className="bg-theme-surface-main relative rounded-lg shadow">
        <ModalHeader
          title={update ? t('admin:components.project.updateProject') : t('admin:components.project.addProject')}
          onClose={() => {
            ProjectUpdateService.clearProjectUpdate(project.name)
            PopoverState.hidePopupover()
          }}
        />
        <div className="w-full px-10 py-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              {hasGithubProvider ? (
                <Input
                  label={`${t('admin:components.project.destination')} (${t('admin:components.project.githubUrl')})`}
                  placeholder="https://github.com/{user}/{repo}"
                  disabled={update}
                  value={projectUpdateStatus.value?.destinationURL}
                  error={projectUpdateStatus.value?.destinationError}
                  onChange={handleChangeDestination}
                  onBlur={handleChangeDestinationRepo}
                  description={
                    !projectUpdateStatus.value?.destinationProcessing &&
                    projectUpdateStatus.value?.destinationProjectName.length > 0
                      ? `${t('admin:components.project.destinationProjectName')}: ${projectUpdateStatus.value
                          ?.destinationProjectName}`
                      : undefined
                  }
                />
              ) : (
                <Text>{t('admin:components.project.needsGithubProvider')}</Text>
              )}
              {!projectUpdateStatus.value?.destinationProcessing && projectUpdateStatus.value?.destinationRepoEmpty && (
                <Text fontSize="sm" theme="secondary">
                  {t('admin:components.project.destinationRepoEmpty')}
                </Text>
              )}
              {projectUpdateStatus.value?.destinationProcessing && (
                <div className="flex items-center gap-3">
                  <LoadingCircle className="h-6 w-6" />
                  <Text>{t('admin:components.project.destinationProcessing')}</Text>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              {hasGithubProvider ? (
                <Input
                  label={`${t('admin:components.project.source')} (${t('admin:components.project.githubUrl')})`}
                  placeholder="https://github.com/{user}/{repo}"
                  disabled={update}
                  value={projectUpdateStatus.value?.sourceURL}
                  error={projectUpdateStatus.value?.sourceURLError}
                  onChange={handleChangeSource}
                  onBlur={handleChangeSourceRepo}
                  description={
                    !projectUpdateStatus.value?.destinationProcessing &&
                    projectUpdateStatus.value?.destinationProjectName.length > 0
                      ? `${t('admin:components.project.sourceProjectName')}: ${projectUpdateStatus.value
                          ?.destinationProjectName}`
                      : undefined
                  }
                />
              ) : (
                <Text>{t('admin:components.project.needsGithubProvider')}</Text>
              )}
              <div className="flex items-center gap-3">
                <div>
                  <LoadingCircle className="h-6 w-6" />
                </div>
                <Text>{t('admin:components.project.destinationProcessing')}</Text>
              </div>
            </div>

            {!projectUpdateStatus.value?.branchProcessing &&
              projectUpdateStatus.value?.branchData &&
              projectUpdateStatus.value?.branchData.length > 0 &&
              projectUpdateStatus.value?.showBranchSelector && (
                <Select
                  label={t('admin:components.project.branchData')}
                  currentValue={projectUpdateStatus.value?.selectedBranch}
                  options={branchSelectOptions}
                  error={projectUpdateStatus.value?.branchError}
                  onChange={handleChangeBranch}
                />
              )}
            {projectUpdateStatus.value?.branchProcessing && (
              <div className="flex items-center gap-3">
                <LoadingCircle className="h-6 w-6" />
                <Text>{t('admin:components.project.branchProcessing')}</Text>
              </div>
            )}

            {!projectUpdateStatus.value?.commitsProcessing &&
              projectUpdateStatus.value?.commitData &&
              projectUpdateStatus.value?.commitData.length > 0 &&
              projectUpdateStatus.value?.showCommitSelector && (
                <Select
                  label={t('admin:components.project.commitData')}
                  currentValue={projectUpdateStatus.value?.selectedSHA}
                  onChange={handleCommitChange}
                  options={commitSelectOptions}
                  error={projectUpdateStatus.value?.commitError}
                  description={
                    !projectUpdateStatus.value?.commitsProcessing &&
                    projectUpdateStatus.value?.sourceProjectName.length > 0
                      ? `${t('admin:components.project.sourceProjectName')}: ${projectUpdateStatus.value
                          ?.sourceProjectName}`
                      : undefined
                  }
                />
              )}
            {projectUpdateStatus.value?.commitsProcessing && (
              <div className="flex items-center gap-3">
                <LoadingCircle className="h-6 w-6" />
                <Text>{t('admin:components.project.commitsProcessing')}</Text>
              </div>
            )}

            {projectUpdateStatus.value?.sourceVsDestinationProcessing && (
              <div className="flex items-center gap-3">
                <LoadingCircle className="h-6 w-6" />
                <Text>{t('admin:components.project.sourceVsDestinationProcessing')}</Text>
              </div>
            )}

            {!projectUpdateStatus.value?.branchProcessing &&
              !projectUpdateStatus.value?.commitsProcessing &&
              projectUpdateStatus.value?.selectedSHA &&
              projectUpdateStatus.value?.selectedSHA.length > 0 &&
              projectUpdateStatus.value?.commitData.length > 0 &&
              !matchesEngineVersion && (
                <div className="bg-theme-bannerInformative flex items-center justify-center gap-3 rounded-lg p-4">
                  <div>
                    <CiWarning className="h-5 w-5 bg-transparent" />
                  </div>
                  <Text>{t('admin:components.project.mismatchedProjectWarning')}</Text>
                </div>
              )}

            {projectUpdateStatus.value?.sourceVsDestinationError.length > 0 && (
              <Text className="text-red-400">{projectUpdateStatus.value?.sourceVsDestinationError}</Text>
            )}

            {!update && (
              <Text
                className={
                  projectUpdateStatus.value?.destinationValid
                    ? 'text-green-400'
                    : 'text-red-400' + ' flex items-center gap-2'
                }
              >
                {projectUpdateStatus.value?.destinationValid && <CiCircleCheck />}
                {!projectUpdateStatus.value?.destinationValid && <CiCircleRemove />}
                {t('admin:components.project.destinationURLValid')}
              </Text>
            )}

            {!update && (
              <Text
                className={
                  projectUpdateStatus.value?.sourceValid
                    ? 'text-green-400'
                    : 'text-red-400' + ' flex items-center gap-2'
                }
              >
                {projectUpdateStatus.value?.sourceValid && <CiCircleCheck />}
                {!projectUpdateStatus.value?.sourceValid && <CiCircleRemove />}
                {t('admin:components.project.sourceURLValid')}
              </Text>
            )}

            {!update && (
              <Text
                className={
                  projectUpdateStatus.value?.sourceProjectMatchesDestination
                    ? 'text-green-400'
                    : 'text-red-400' + ' flex items-center gap-2'
                }
              >
                {projectUpdateStatus.value?.sourceProjectMatchesDestination && <CiCircleCheck />}
                {!projectUpdateStatus.value?.sourceProjectMatchesDestination && <CiCircleRemove />}
                {t('admin:components.project.sourceMatchesDestination')}
              </Text>
            )}

            <Text>{t('admin:components.project.autoUpdate')}</Text>
            <Toggle
              value={showAutoUpdateOptions.value}
              onChange={(value) => {
                console.log('debug1 the value was', value)
                showAutoUpdateOptions.set(value)
              }}
              label={t('admin:components.project.enableAutoUpdate')}
            />
            {showAutoUpdateOptions.value && (
              <div className="flex w-full">
                <div className="w-1/2">
                  <Label className="mb-4">{t('admin:components.project.autoUpdateMode')}</Label>
                  <Radios
                    horizontal
                    options={[
                      { label: t('admin:components.project.prod'), value: 'prod' },
                      { label: t('admin:components.project.dev'), value: 'dev' }
                    ]}
                    value={projectUpdateStatus.value?.updateType === 'tag' ? 'prod' : 'dev'}
                    onChange={(value) =>
                      ProjectUpdateService.setUpdateType(project.name, value === 'prod' ? 'tag' : 'commit')
                    }
                  />
                </div>
                <div className="w-1/2">
                  <Select
                    label={t('admin:components.project.autoUpdateInterval')}
                    options={autoUpdateIntervalOptions}
                    currentValue={projectUpdateStatus.value?.updateSchedule || DefaultUpdateSchedule}
                    onChange={(value) => ProjectUpdateService.setUpdateSchedule(project.name, value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t-theme-primary grid grid-flow-col border-t px-6 py-5">
          <Button
            variant="outline"
            onClick={() => {
              ProjectUpdateService.clearProjectUpdate(project.name)
              PopoverState.hidePopupover()
            }}
          >
            {t('common:components.cancel')}
          </Button>
          {onSubmit && (
            <Button
              onClick={onSubmit}
              disabled={submitDisabled || processing}
              endIcon={processing ? <LoadingCircle className="h-6 w-6" /> : undefined}
              className="place-self-end"
            >
              {t('common:components.confirm')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
