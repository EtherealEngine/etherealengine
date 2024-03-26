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

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import ProjectFields from '@etherealengine/client-core/src/admin/components/Project/ProjectFields'

import { useHookstate } from '@hookstate/core'

import { Dialog, DialogContent, DialogTitle, TextField } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import FormControl from '@mui/material/FormControl'

import { ProjectUpdateState } from '@etherealengine/client-core/src/admin/services/ProjectUpdateService'
import { DefaultUpdateSchedule } from '@etherealengine/common/src/interfaces/ProjectPackageJsonType'
import { ProjectType } from '@etherealengine/common/src/schemas/projects/project.schema'
import { getMutableState } from '@etherealengine/hyperflux'
import { Button } from '../inputs/Button'
import styles from './styles.module.scss'

interface Props {
  open: boolean
  onSuccess: (name: string, repositoryPath?: string) => Promise<void>
  onClose: () => void
}

export const CreateProjectDialog = ({ open, onSuccess, onClose }: Props): any => {
  const { t } = useTranslation()

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [projectName, setProjectName] = useState('')

  const project = {
    id: '',
    name: 'tempProject',
    thumbnail: '',
    repositoryPath: '',
    needsRebuild: false,
    updateType: 'none' as ProjectType['updateType'],
    updateSchedule: DefaultUpdateSchedule,
    commitSHA: '',
    commitDate: new Date()
  }

  const projectUpdateStatus = useHookstate(getMutableState(ProjectUpdateState)[project.name]).value

  const handleCreateProject = async () => {
    if (!projectName) return

    setProcessing(true)
    try {
      await onSuccess(projectName, projectUpdateStatus?.destinationURL)
      closeDialog()
    } catch (err) {
      setError(err.message)
    }

    setProcessing(false)
  }

  const handleSubmitOnEnter = (event) => {
    if (event.key === 'Enter') {
      handleCreateProject()
    }
  }

  const closeDialog = () => {
    setProjectName('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      classes={{ paper: styles.createProjectDialog }}
      onClose={closeDialog}
      closeAfterTransition
      TransitionComponent={Fade}
      TransitionProps={{ in: open }}
    >
      <DialogTitle>{t('editor.projects.createProject')}</DialogTitle>
      <DialogContent>
        {processing ? (
          <div className={styles.processing}>
            <CircularProgress size={30} />
            <div className={styles.text}>{t('editor.projects.processing')}</div>
          </div>
        ) : (
          <FormControl>
            <TextField
              id="outlined-basic"
              variant="outlined"
              size="small"
              placeholder={t('editor.projects.projectName')}
              InputProps={{
                classes: {
                  root: styles.inputContainer,
                  notchedOutline: styles.outline,
                  input: styles.input
                }
              }}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value.toLowerCase())}
              onKeyDown={handleSubmitOnEnter}
            />
            {error && error.length > 0 && <h2 className={styles.errorMessage}>{error}</h2>}
            <ProjectFields inputProject={null} createProject={true} processing={processing} />
            <Button
              onClick={handleCreateProject}
              className={styles.btn}
              disabled={!projectName || projectUpdateStatus?.submitDisabled}
            >
              {t('editor.projects.lbl-createProject')}
            </Button>
          </FormControl>
        )}
      </DialogContent>
    </Dialog>
  )
}
