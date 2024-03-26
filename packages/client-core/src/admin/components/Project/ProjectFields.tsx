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

import classNames from 'classnames'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Autocomplete from '@etherealengine/client-core/src/common/components/AutoCompleteSingle'
import InputRadio from '@etherealengine/client-core/src/common/components/InputRadio'
import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import InputSwitch from '@etherealengine/client-core/src/common/components/InputSwitch'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import LoadingView from '@etherealengine/client-core/src/common/components/LoadingView'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Container from '@etherealengine/ui/src/primitives/mui/Container'
import DialogTitle from '@etherealengine/ui/src/primitives/mui/DialogTitle'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import Tooltip from '@etherealengine/ui/src/primitives/mui/Tooltip'

import { DefaultUpdateSchedule } from '@etherealengine/common/src/interfaces/ProjectPackageJsonType'
import { ProjectBranchType, ProjectCommitType, ProjectType } from '@etherealengine/common/src/schema.type.module'
import { toDateTimeSql } from '@etherealengine/common/src/utils/datetime-sql'
import { ProjectService } from '../../../common/services/ProjectService'
import { AuthState } from '../../../user/services/AuthService'
import { ProjectUpdateService, ProjectUpdateState } from '../../services/ProjectUpdateService'
import styles from '../../styles/admin.module.scss'

interface Props {
  inputProject?: ProjectType | null | undefined
  existingProject?: boolean | undefined
  changeDestination?: boolean | undefined
  createProject?: boolean | undefined
  processing: boolean
}

const ProjectFields = ({
  inputProject,
  existingProject = false,
  changeDestination = false,
  createProject = false,
  processing
}: Props) => {
  const { t } = useTranslation()

  const project =
    existingProject && inputProject
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

  useEffect(() => {
    ProjectUpdateService.initializeProjectUpdate(project.name)
  }, [])

  const projectUpdateStatus = useHookstate(getMutableState(ProjectUpdateState)[project.name])

  const selfUser = useHookstate(getMutableState(AuthState).user)

  const matchingCommit = projectUpdateStatus?.value?.commitData?.find(
    (commit: ProjectCommitType) => commit.commitSHA === projectUpdateStatus.value.selectedSHA
  )
  const matchesEngineVersion = matchingCommit ? (matchingCommit as ProjectCommitType).matchesEngineVersion : false

  const handleChangeSource = (e) => {
    const { value } = e.target
    ProjectUpdateService.setSourceURLError(project.name, value ? '' : t('admin:components.project.urlRequired'))
    ProjectUpdateService.setSourceURL(project.name, value)
  }

  const handleChangeDestination = (e) => {
    const { value } = e.target
    ProjectUpdateService.setDestinationError(project.name, value ? '' : t('admin:components.project.urlRequired'))
    ProjectUpdateService.setDestinationURL(project.name, value)
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
            handleChangeBranch({ target: { value: project.sourceBranch } })
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

  const copyDestination = async () => {
    handleChangeSource({ target: { value: projectUpdateStatus.value.destinationURL } })
    handleChangeSourceRepo({ target: { value: projectUpdateStatus.value.destinationURL } })
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
            if ((existingProject && changeDestination) || createProject)
              ProjectUpdateService.setSubmitDisabled(project.name, false)
            ProjectUpdateService.setDestinationValid(project.name, destinationResponse.destinationValid)
            if (destinationResponse.projectName)
              ProjectUpdateService.setDestinationProjectName(project.name, destinationResponse.projectName)
            if (project.sourceRepo) {
              handleChangeSource({ target: { value: project.sourceRepo } })
              handleChangeSourceRepo({ target: { value: project.sourceRepo } })
            }
            if (destinationResponse.repoEmpty) ProjectUpdateService.setDestinationRepoEmpty(project.name, true)
            if (projectUpdateStatus.value.selectedSHA.length > 0)
              handleCommitChange({ target: { value: projectUpdateStatus.value.selectedSHA } })
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

  const handleChangeBranch = async (e) => {
    try {
      ProjectUpdateService.resetSourceState(project.name, { resetSourceURL: false, resetBranch: false })
      ProjectUpdateService.setSelectedBranch(project.name, e.target.value)
      ProjectUpdateService.setCommitsProcessing(project.name, true)
      const projectResponse = (await ProjectService.fetchProjectCommits(
        projectUpdateStatus.value.sourceURL,
        e.target.value
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
            handleCommitChange({ target: { value: project.commitSHA, commitData: projectResponse } })
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

  const hasGithubProvider = selfUser?.identityProviders?.value?.find((ip) => ip.type === 'github')

  const handleCommitChange = async (e) => {
    let { value, commitData } = e.target

    if (!commitData) {
      commitData = projectUpdateStatus.value.commitData
    }

    const selectedSHA = value
    ProjectUpdateService.setSourceVsDestinationChecked(project.name, false)
    ProjectUpdateService.setSelectedSHA(project.name, selectedSHA)
    if (selectedSHA === '') {
      ProjectUpdateService.setSourceValid(project.name, false)
      ProjectUpdateService.setCommitError(project.name, '')
      ProjectUpdateService.setSourceProjectName(project.name, '')
      return
    }
    const valueRegex = new RegExp(`^${value}`, 'g')
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

  const branchMenu: InputMenuItem[] = projectUpdateStatus?.value?.branchData.map((el: ProjectBranchType) => {
    return {
      value: el.name,
      label: `Branch: ${el.name} ${
        el.branchType === 'main' ? '(Main branch)' : el.branchType === 'deployment' ? '(Deployment branch)' : ''
      }`
    }
  })

  const commitMenu: InputMenuItem[] = projectUpdateStatus?.value?.commitData.map((el: ProjectCommitType) => {
    let label = `Commit ${el.commitSHA?.slice(0, 8)}`
    if (el.projectVersion) label += ` -- Project Ver. ${el.projectVersion}`
    if (el.engineVersion) label += ` -- Engine Ver. ${el.engineVersion}`
    if (el.datetime) {
      const datetime = new Date(el.datetime).toLocaleString('en-us', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })
      label += ` -- Pushed ${datetime}`
    }
    return {
      value: el.commitSHA,
      label
    }
  })

  useEffect(() => {
    if (
      projectUpdateStatus?.value?.destinationValid &&
      projectUpdateStatus?.value?.sourceValid &&
      !projectUpdateStatus?.value?.sourceVsDestinationChecked
    ) {
      ProjectUpdateService.setSourceVsDestinationProcessing(project.name, true)
      ProjectService.checkSourceMatchesDestination({
        sourceURL: projectUpdateStatus.value.sourceURL || '',
        selectedSHA: projectUpdateStatus.value.selectedSHA || '',
        destinationURL: projectUpdateStatus.value.destinationURL || '',
        existingProject: existingProject || false
      }).then((res) => {
        ProjectUpdateService.setSourceVsDestinationChecked(project.name, true)
        ProjectUpdateService.setSourceVsDestinationProcessing(project.name, false)
        if (res.error || res.text) {
          ProjectUpdateService.setProjectName(project.name, '')
          ProjectUpdateService.setSubmitDisabled(project.name, true)
          ProjectUpdateService.setSourceProjectMatchesDestination(project.name, false)
          ProjectUpdateService.setSourceVsDestinationError(project.name, res.text!)
          ProjectUpdateService.setSourceValid(project.name, false)
        } else {
          ProjectUpdateService.setProjectName(project.name, res.projectName!)
          ProjectUpdateService.setSubmitDisabled(project.name, !res.sourceProjectMatchesDestination)
          ProjectUpdateService.setSourceProjectMatchesDestination(project.name, res.sourceProjectMatchesDestination!)
          ProjectUpdateService.setSourceVsDestinationError(project.name, '')
          ProjectUpdateService.setSourceValid(project.name, true)
        }
      })
    } else {
      if (
        !projectUpdateStatus?.value?.sourceVsDestinationChecked &&
        !(existingProject && changeDestination) &&
        !createProject
      ) {
        ProjectUpdateService.setSourceVsDestinationProcessing(project.name, false)
        ProjectUpdateService.setSourceVsDestinationChecked(project.name, false)
        ProjectUpdateService.setProjectName(project.name, '')
        ProjectUpdateService.setSubmitDisabled(project.name, true)
        ProjectUpdateService.setSourceProjectMatchesDestination(project.name, false)
      }
    }
  }, [
    projectUpdateStatus?.value?.destinationValid,
    projectUpdateStatus?.value?.sourceValid,
    projectUpdateStatus?.value?.sourceVsDestinationChecked
  ])

  useEffect(() => {
    if (
      projectUpdateStatus?.value?.triggerSetDestination?.length > 0 &&
      projectUpdateStatus?.value?.destinationURL?.length === 0
    ) {
      ProjectUpdateService.setDestinationURL(project.name, projectUpdateStatus.value.triggerSetDestination)
      handleChangeDestinationRepo({
        target: {
          value: projectUpdateStatus.value.triggerSetDestination
        }
      })
    }
  }, [projectUpdateStatus?.value?.triggerSetDestination])

  const handleAutoUpdateEnabledChange = (e) => {
    const { checked } = e.target
    ProjectUpdateService.setUpdateType(project.name, checked ? 'tag' : 'none')
  }

  const handleAutoUpdateModeChange = (e) => {
    const { value } = e.target
    ProjectUpdateService.setUpdateType(project.name, value === 'prod' ? 'tag' : 'commit')
  }

  const handleAutoUpdateIntervalChange = (e) => {
    const { value } = e.target
    ProjectUpdateService.setUpdateSchedule(project.name, value)
  }

  return (
    <>
      {projectUpdateStatus && (
        <Container maxWidth="sm" className={styles.mt10}>
          <DialogTitle
            className={classNames({
              [styles.textAlign]: true,
              [styles.drawerHeader]: true
            })}
          >
            {' '}
            {existingProject && !changeDestination
              ? t('admin:components.project.updateProject')
              : existingProject && changeDestination
              ? t('admin:components.project.changeDestination')
              : createProject
              ? null
              : t('admin:components.project.addProject')}
          </DialogTitle>

          <DialogTitle
            className={classNames({
              [styles.textAlign]: true,
              [styles.drawerSubHeader]: true
            })}
          >
            {t('admin:components.project.destination')}
          </DialogTitle>

          {hasGithubProvider ? (
            <InputText
              name="urlSelect"
              label={t('admin:components.project.githubUrl')}
              value={projectUpdateStatus.value?.destinationURL}
              error={projectUpdateStatus.value?.destinationError}
              placeholder="https://github.com/{user}/{repo}"
              disabled={(existingProject || false) && !changeDestination}
              onChange={handleChangeDestination}
              onBlur={handleChangeDestinationRepo}
            />
          ) : (
            <div className={classNames(styles.textAlign, styles.defaultFont)}>
              {t('admin:components.project.needsGithubProvider')}
            </div>
          )}

          {!projectUpdateStatus.value?.destinationProcessing &&
            projectUpdateStatus.value?.destinationProjectName.length > 0 && (
              <div className={styles.projectVersion}>{`${t('admin:components.project.destinationProjectName')}: ${
                projectUpdateStatus.value.destinationProjectName
              }`}</div>
            )}
          {!projectUpdateStatus.value?.destinationProcessing && projectUpdateStatus.value?.destinationRepoEmpty && (
            <div className={styles.projectVersion}>{t('admin:components.project.destinationRepoEmpty')}</div>
          )}
          {projectUpdateStatus.value?.destinationProcessing && (
            <LoadingView
              title={t('admin:components.project.destinationProcessing')}
              variant="body1"
              flexDirection="row"
              fullHeight={false}
            />
          )}

          {!changeDestination && !createProject && (
            <DialogTitle
              className={classNames({
                [styles.textAlign]: true,
                [styles.drawerSubHeader]: true
              })}
            >
              {t('admin:components.project.source')}
            </DialogTitle>
          )}

          {!changeDestination && !createProject && (
            <div>
              {hasGithubProvider ? (
                <div className={styles.sourceContainer}>
                  <InputText
                    name="urlSelect"
                    label={t('admin:components.project.githubUrl')}
                    value={projectUpdateStatus.value?.sourceURL}
                    placeholder="https://github.com/{user}/{repo}"
                    error={projectUpdateStatus.value?.sourceURLError}
                    onChange={handleChangeSource}
                    onBlur={handleChangeSourceRepo}
                  />
                  <Tooltip title="Copy From Destination">
                    <IconButton
                      className={styles.gradientButton}
                      onClick={copyDestination}
                      icon={<Icon type="Difference" />}
                    />
                  </Tooltip>
                </div>
              ) : (
                <div className={classNames(styles.textAlign, styles.defaultFont)}>
                  {t('admin:components.project.needsGithubProvider')}
                </div>
              )}

              {!processing &&
                !projectUpdateStatus.value?.branchProcessing &&
                projectUpdateStatus.value?.branchData &&
                projectUpdateStatus.value?.branchData.length > 0 &&
                projectUpdateStatus.value?.showBranchSelector && (
                  <InputSelect
                    name="branchData"
                    label={t('admin:components.project.branchData')}
                    value={projectUpdateStatus.value?.selectedBranch}
                    menu={branchMenu}
                    error={projectUpdateStatus.value?.branchError}
                    onChange={handleChangeBranch}
                  />
                )}
              {!processing &&
                !projectUpdateStatus.value?.commitsProcessing &&
                projectUpdateStatus.value?.commitData &&
                projectUpdateStatus.value?.commitData.length > 0 &&
                projectUpdateStatus.value?.showCommitSelector && (
                  <Autocomplete
                    freeSolo={true}
                    data={commitMenu}
                    label={t('admin:components.project.commitData')}
                    value={projectUpdateStatus.value?.selectedSHA}
                    onChange={handleCommitChange}
                    error={projectUpdateStatus.value?.commitError}
                  />
                )}
            </div>
          )}

          {!processing &&
            !projectUpdateStatus.value?.commitsProcessing &&
            projectUpdateStatus.value?.sourceProjectName.length > 0 && (
              <div className={styles.projectVersion}>{`${t(
                'admin:components.project.sourceProjectName'
              )}: ${projectUpdateStatus.value?.sourceProjectName}`}</div>
            )}

          {projectUpdateStatus.value?.branchProcessing && (
            <LoadingView
              title={t('admin:components.project.branchProcessing')}
              flexDirection="row"
              variant="body1"
              fullHeight={false}
            />
          )}
          {projectUpdateStatus.value?.commitsProcessing && (
            <LoadingView
              title={t('admin:components.project.commitsProcessing')}
              flexDirection="row"
              variant="body1"
              fullHeight={false}
            />
          )}

          {projectUpdateStatus.value?.sourceVsDestinationProcessing && (
            <LoadingView
              title={t('admin:components.project.sourceVsDestinationProcessing')}
              variant="body1"
              flexDirection="row"
              fullHeight={false}
            />
          )}

          {!processing &&
            !projectUpdateStatus.value?.branchProcessing &&
            !projectUpdateStatus.value?.commitsProcessing &&
            projectUpdateStatus.value?.selectedSHA &&
            projectUpdateStatus.value?.selectedSHA.length > 0 &&
            projectUpdateStatus.value?.commitData.length > 0 &&
            !matchesEngineVersion && (
              <div className={classNames(styles.projectMismatchWarning)}>
                <Icon type="WarningAmber" />
                {t('admin:components.project.mismatchedProjectWarning')}
              </div>
            )}

          {projectUpdateStatus.value?.sourceVsDestinationError.length > 0 && (
            <div className={classNames(styles.errorText)}>{projectUpdateStatus.value?.sourceVsDestinationError}</div>
          )}

          <div
            className={classNames({
              [styles.validContainer]: true,
              [styles.valid]: projectUpdateStatus.value?.destinationValid,
              [styles.invalid]: !projectUpdateStatus.value?.destinationValid,
              [styles.defaultFont]: true
            })}
          >
            {projectUpdateStatus.value?.destinationValid && <Icon type="CheckCircle" />}
            {!projectUpdateStatus.value?.destinationValid && <Icon type="Cancel" />}
            {t('admin:components.project.destinationURLValid')}
          </div>

          {!(existingProject && changeDestination) && !createProject && (
            <div
              className={classNames({
                [styles.validContainer]: true,
                [styles.valid]: projectUpdateStatus.value?.sourceValid,
                [styles.invalid]: !projectUpdateStatus.value?.sourceValid,
                [styles.defaultFont]: true
              })}
            >
              {projectUpdateStatus.value?.sourceValid && <Icon type="CheckCircle" />}
              {!projectUpdateStatus.value?.sourceValid && <Icon type="Cancel" />}
              {t('admin:components.project.sourceURLValid')}
            </div>
          )}

          {!(existingProject && changeDestination) && !createProject && (
            <div
              className={classNames({
                [styles.validContainer]: true,
                [styles.valid]: projectUpdateStatus.value?.sourceProjectMatchesDestination,
                [styles.invalid]: !projectUpdateStatus.value?.sourceProjectMatchesDestination,
                [styles.defaultFont]: true
              })}
            >
              {projectUpdateStatus.value?.sourceProjectMatchesDestination && <Icon type="CheckCircle" />}
              {!projectUpdateStatus.value?.sourceProjectMatchesDestination && <Icon type="Cancel" />}
              {t('admin:components.project.sourceMatchesDestination')}
            </div>
          )}

          {!changeDestination && !createProject && (
            <>
              <DialogTitle
                className={classNames({
                  [styles.textAlign]: true,
                  [styles.drawerSubHeader]: true
                })}
              >
                {t('admin:components.project.autoUpdate')}
              </DialogTitle>

              <InputSwitch
                name="autoUpdateEnabled"
                label={t('admin:components.project.enableAutoUpdate')}
                checked={projectUpdateStatus.value?.updateType !== 'none'}
                onChange={handleAutoUpdateEnabledChange}
              />
            </>
          )}

          {!changeDestination && projectUpdateStatus.value?.updateType !== 'none' && (
            <>
              <InputRadio
                name="autoUpdateMode"
                label={t('admin:components.project.autoUpdateMode')}
                value={projectUpdateStatus.value?.updateType === 'tag' ? 'prod' : 'dev'}
                options={[
                  {
                    value: 'prod',
                    label: (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {t('admin:components.project.prod')}
                        <Tooltip title={t('admin:components.project.prodTooltip')} arrow>
                          <Icon type="Help" sx={{ fontSize: '20px', marginLeft: '5px', marginRight: '15px' }} />
                        </Tooltip>
                      </Box>
                    )
                  },
                  {
                    value: 'dev',
                    label: (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {t('admin:components.project.dev')}
                        <Tooltip title={t('admin:components.project.devTooltip')} arrow>
                          <Icon type="Help" sx={{ fontSize: '20px', marginLeft: '5px', marginRight: '15px' }} />
                        </Tooltip>
                      </Box>
                    )
                  }
                ]}
                onChange={handleAutoUpdateModeChange}
              />

              <InputSelect
                name="autoUpdateInterval"
                label={t('admin:components.project.autoUpdateInterval')}
                value={projectUpdateStatus.value?.updateSchedule || DefaultUpdateSchedule}
                menu={[
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
                ]}
                onChange={handleAutoUpdateIntervalChange}
              />
            </>
          )}
        </Container>
      )}
    </>
  )
}

export default ProjectFields
