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

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import LoadingView from '@etherealengine/client-core/src/common/components/LoadingView'
import { NO_PROXY, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Checkbox from '@etherealengine/ui/src/primitives/mui/Checkbox'
import Container from '@etherealengine/ui/src/primitives/mui/Container'
import DialogActions from '@etherealengine/ui/src/primitives/mui/DialogActions'
import DialogTitle from '@etherealengine/ui/src/primitives/mui/DialogTitle'
import FormControlLabel from '@etherealengine/ui/src/primitives/mui/FormControlLabel'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'

import { DefaultUpdateSchedule } from '@etherealengine/common/src/interfaces/ProjectPackageJsonType'
import { ProjectBuilderTagsType, ProjectType, helmSettingPath } from '@etherealengine/common/src/schema.type.module'
import { useFind } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import { ProjectService, ProjectState } from '../../../common/services/ProjectService'
import DrawerView from '../../common/DrawerView'
import { ProjectUpdateService, ProjectUpdateState } from '../../services/ProjectUpdateService'
import styles from '../../styles/admin.module.scss'
import ProjectFields from './ProjectFields'

interface Props {
  open: boolean
  builderTags: ProjectBuilderTagsType[]
  onClose: () => void
}

const UpdateDrawer = ({ open, builderTags, onClose }: Props) => {
  const { t } = useTranslation()
  const error = useHookstate('')
  const selectedTag = useHookstate('')
  const updateProjects = useHookstate(false)
  const projectsToUpdate = useHookstate(new Map())
  const submitDisabled = useHookstate(true)
  const processing = useHookstate(false)
  const helmSetting = useFind(helmSettingPath).data.at(0)

  const adminProjectState = useHookstate(getMutableState(ProjectState))
  const adminProjects = adminProjectState.projects
  const engineCommit = adminProjectState.builderInfo.engineCommit

  ProjectService.useAPIListeners()

  const projectUpdateStatus = useHookstate(getMutableState(ProjectUpdateState))

  const handleClose = () => {
    error.set('')
    selectedTag.set('')
    updateProjects.set(false)
    adminProjects.get({ noproxy: true }).forEach((adminProject) => {
      if (projectsToUpdate.get(NO_PROXY).get(adminProject.name))
        ProjectUpdateService.clearProjectUpdate(adminProject.name)
    })
    projectsToUpdate.set(new Map())
    processing.set(false)
    onClose()
  }

  const handleTagChange = async (e) => {
    selectedTag.set(e.target.value)
  }

  const tagMenu: InputMenuItem[] = builderTags.map((el) => {
    const pushedDate = new Date(el.pushedAt).toLocaleString('en-us', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
    return {
      value: el.tag,
      label: `Commit ${el.commitSHA?.slice(0, 8)} -- ${el.tag === engineCommit.value ? '(Current) ' : ''}Version ${
        el.engineVersion
      } -- Pushed ${pushedDate}`
    }
  })

  const handleSubmit = async () => {
    processing.set(true)
    await ProjectService.updateEngine(
      selectedTag.value,
      updateProjects.value,
      Object.keys(projectUpdateStatus.value).map((name) => {
        return {
          name: projectUpdateStatus[name].projectName.value,
          sourceURL: projectUpdateStatus[name].sourceURL.value,
          destinationURL: projectUpdateStatus[name].destinationURL.value,
          reset: true,
          commitSHA: projectUpdateStatus[name].selectedSHA.value,
          sourceBranch: projectUpdateStatus[name].selectedBranch.value,
          updateType: projectUpdateStatus[name].updateType.value || ('none' as ProjectType['updateType']),
          updateSchedule: projectUpdateStatus[name].updateSchedule.value || DefaultUpdateSchedule
        }
      })
    )
    processing.set(false)
    handleClose()
  }

  const toggleProjectToUpdate = async (e: React.ChangeEvent<HTMLInputElement>, project: ProjectType) => {
    const thisProjectName = project.name
    const newProjects = new Map(projectsToUpdate.get(NO_PROXY))
    if (newProjects.get(thisProjectName)) {
      newProjects.delete(thisProjectName)
      ProjectUpdateService.clearProjectUpdate(project.name)
    } else {
      newProjects.set(thisProjectName, true)
      ProjectUpdateService.initializeProjectUpdate(project.name)
      ProjectUpdateService.setTriggerSetDestination(
        project.name,
        project.repositoryPath,
        project.updateType,
        project.updateSchedule
      )
    }
    projectsToUpdate.set(newProjects)
  }

  useEffect(() => {
    const invalidProjects =
      Object.keys(projectUpdateStatus.value)
        .map((projectName) => projectUpdateStatus[projectName]?.submitDisabled.value)
        .indexOf(true) > -1
    submitDisabled.set(selectedTag?.value?.length === 0 || invalidProjects)
  }, [selectedTag?.value, projectUpdateStatus])

  useEffect(() => {
    const matchingTag = builderTags.find((tag) => tag.tag === engineCommit.value)
    if (open && engineCommit.value && matchingTag && selectedTag.value.length === 0) selectedTag.set(engineCommit.value)
  }, [open, engineCommit.value, builderTags])

  return (
    <DrawerView open={open} onClose={handleClose}>
      <Container maxWidth="sm" className={styles.mt20}>
        <DialogTitle
          className={classNames({
            [styles.textAlign]: true,
            [styles.drawerHeader]: true
          })}
        >
          {' '}
          {t('admin:components.project.updateEngine')}
        </DialogTitle>

        <div className={styles.helmSubheader}>
          <div>{t('admin:components.setting.helm.mainHelmToDeploy')}</div>:
          <a href="/admin/settings#helm">{helmSetting?.main || 'Current Version'}</a>
        </div>

        <div className={styles.helmSubheader}>
          <div>{t('admin:components.setting.helm.builderHelmToDeploy')}</div>:
          <a href="/admin/settings#helm">{helmSetting?.builder || 'Current Version'}</a>
        </div>

        {
          <InputSelect
            name="commitData"
            label={t('admin:components.project.commitData')}
            value={selectedTag.value}
            menu={tagMenu}
            error={error.value}
            onChange={handleTagChange}
          />
        }

        <FormControlLabel
          control={
            <Checkbox checked={updateProjects.value} onChange={() => updateProjects.set(!updateProjects.value)} />
          }
          label={t('admin:components.project.updateSelector')}
        />

        {updateProjects.value && (
          <>
            <div className={styles.projectUpdateWarning}>
              <Icon type="WarningAmber" />
              {t('admin:components.project.projectWarning')}
            </div>
            <div className={styles.projectSelector}>
              {adminProjects
                .get(NO_PROXY)
                ?.filter((project) => project.name !== 'default-project' && project.repositoryPath?.length > 0)
                .map((project) => (
                  <div key={project.id} className={styles.projectUpdateContainer}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={projectsToUpdate.get(NO_PROXY).get(project.name)}
                          onChange={(e) => toggleProjectToUpdate(e, project)}
                        />
                      }
                      label={project.name}
                    />

                    {projectsToUpdate.get(NO_PROXY).get(project.name) && projectUpdateStatus[project.name] && (
                      <ProjectFields
                        inputProject={project}
                        existingProject={true}
                        changeDestination={false}
                        processing={processing.value}
                      />
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        <DialogActions>
          <>
            <Button className={styles.outlinedButton} onClick={handleClose}>
              {t('admin:components.common.cancel')}
            </Button>
            {!processing.value && (
              <Button className={styles.gradientButton} disabled={submitDisabled.value} onClick={handleSubmit}>
                {t('admin:components.common.submit')}
              </Button>
            )}
            {processing.value && (
              <LoadingView title={t('admin:components.project.processing')} variant="body1" fullHeight={false} />
            )}
          </>
        </DialogActions>
      </Container>
    </DrawerView>
  )
}

export default UpdateDrawer
