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

import { ProjectService, ProjectState } from '@etherealengine/client-core/src/common/services/ProjectService'
import { ProjectSettingType, projectPath } from '@etherealengine/common/src/schema.type.module'
import { NO_PROXY, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { loadConfigForProject } from '@etherealengine/projects/loadConfigForProject'
import { useGet, useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Accordion from '@etherealengine/ui/src/primitives/tailwind/Accordion'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import Input from '@etherealengine/ui/src/primitives/tailwind/Input'
import LoadingCircle from '@etherealengine/ui/src/primitives/tailwind/LoadingCircle'
import Select from '@etherealengine/ui/src/primitives/tailwind/Select'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import React, { forwardRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HiMinus, HiPlusSmall } from 'react-icons/hi2'

const ProjectTab = forwardRef(({ open }: { open: boolean }, ref: React.MutableRefObject<HTMLDivElement>) => {
  const { t } = useTranslation()
  const state = useHookstate({
    loading: false,
    errorMessage: ''
  })
  const projectState = useHookstate(getMutableState(ProjectState))
  const projects = projectState.projects

  const settings = useHookstate<Array<ProjectSettingType> | []>([])
  const selectedProjectId = useHookstate(projects.get(NO_PROXY).length > 0 ? projects.get(NO_PROXY)[0].id : '')

  const project = useGet(projectPath, selectedProjectId.value, { query: { $select: ['settings'] } })

  const patchProjectSetting = useMutation(projectPath).patch

  useEffect(() => {
    ProjectService.fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId.value) {
      resetSettingsFromSchema()
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (!project.data?.settings || !project.data?.settings.length) {
      return
    }

    const tempSettings = JSON.parse(JSON.stringify(settings.value))
    for (const [index, setting] of tempSettings.entries()) {
      const savedSetting = project.data.settings.filter((item) => item.key === setting.key)
      if (savedSetting.length > 0) {
        tempSettings[index].value = savedSetting[0].value
      }
    }
    settings.set(tempSettings)
  }, [project.data?.settings])

  const resetSettingsFromSchema = async () => {
    const projectName = projects.value.filter((proj) => proj.id === selectedProjectId.value)
    const projectConfig = projectName?.length > 0 && (await loadConfigForProject(projectName[0].name))

    if (projectConfig && projectConfig?.settings) {
      const tempSetting = [] as ProjectSettingType[]

      for (const setting of projectConfig.settings) {
        tempSetting.push({ key: setting.key, value: '' })
      }

      settings.set(tempSetting)
    } else {
      settings.set([])
    }
  }

  const handleCancel = () => {
    resetSettingsFromSchema()
  }

  const handleSubmit = () => {
    state.loading.set(true)
    patchProjectSetting(selectedProjectId.value, { settings: settings.value })
      .then(() => {
        state.set({ loading: false, errorMessage: '' })
      })
      .catch((err) => {
        state.set({ loading: false, errorMessage: err.message })
      })
  }

  const projectsMenu = projects.value.map((el) => {
    return {
      label: el.name,
      value: el.id
    }
  })

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    settings[index].nested('value').set(e.target.value)
  }

  return (
    <Accordion
      title={t('admin:components.setting.project.header')}
      subtitle={t('admin:components.setting.project.subtitle')}
      expandIcon={<HiPlusSmall />}
      shrinkIcon={<HiMinus />}
      ref={ref}
      open={open}
    >
      <Select
        options={projectsMenu}
        currentValue={selectedProjectId.value}
        onChange={(value) => {
          console.log('selectedProject', value)
          selectedProjectId.set(value)
        }}
        label={t('admin:components.setting.project.header')}
        className="mb-8 mt-6 max-w-[50%]"
      />

      {settings?.length > 0 ? (
        <>
          {settings.value.map((setting, index) => (
            <div className="mb-3 grid grid-cols-2 gap-2" key={index}>
              <Input className="col-span-1" label="Key Name" disabled value={setting.key} />
              <Input
                className="col-span-1"
                label="Value"
                value={setting.value || ''}
                onChange={(e) => handleSettingsChange(e, index)}
              />
            </div>
          ))}
          <div className="mb-3 grid grid-cols-8 gap-2">
            <Button className="bg-theme-highlight text-primary col-span-1" fullWidth onClick={handleCancel}>
              {t('admin:components.setting.project.clear')}
            </Button>
            <Button
              className="col-span-1"
              fullWidth
              onClick={handleSubmit}
              startIcon={state.loading.value && <LoadingCircle className="h-8 w-8" />}
            >
              {t('admin:components.setting.project.submit')}
            </Button>
          </div>
        </>
      ) : (
        <Text component="h3" className="text-red-400">
          {t('admin:components.setting.project.noSettingsMessage')}
        </Text>
      )}

      {state.errorMessage.value && (
        <Text component="h3" className="text-red-400">
          {state.errorMessage.value}
        </Text>
      )}
    </Accordion>
  )
})

export default ProjectTab
