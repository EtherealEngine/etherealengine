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
import {
  LocationData,
  LocationID,
  LocationType,
  SceneID,
  locationPath
} from '@etherealengine/common/src/schema.type.module'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Input from '@etherealengine/ui/src/primitives/tailwind/Input'
import Modal from '@etherealengine/ui/src/primitives/tailwind/Modal'
import Select from '@etherealengine/ui/src/primitives/tailwind/Select'
import Toggle from '@etherealengine/ui/src/primitives/tailwind/Toggle'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminSceneService, AdminSceneState } from '../../../admin/services/SceneService'

const getDefaultErrors = () => ({
  name: '',
  maxUsers: '',
  scene: '',
  serverError: ''
})

export default function AddEditLocationModal({ location }: { location?: LocationType }) {
  const { t } = useTranslation()

  const locationMutation = useMutation(locationPath)

  const submitLoading = useHookstate(false)
  const errors = useHookstate(getDefaultErrors())

  const name = useHookstate(location?.name || '')
  const maxUsers = useHookstate(location?.maxUsersPerInstance || 20)
  const scene = useHookstate(location?.sceneId || '')
  const videoEnabled = useHookstate<boolean>(location?.locationSetting.videoEnabled || true)
  const audioEnabled = useHookstate<boolean>(location?.locationSetting.audioEnabled || true)
  const screenSharingEnabled = useHookstate<boolean>(location?.locationSetting.screenSharingEnabled || true)

  const adminSceneState = useHookstate(getMutableState(AdminSceneState))

  useEffect(() => {
    AdminSceneService.fetchAdminScenes()
    const sceneId = location?.sceneId || ''
    if (sceneId) {
      // sceneId is in the format of "projects/PROJECT_NAME/SCENE_NAME.scene.json"
      // so we strip off projects & scene.json and set the scene state
      scene.set(sceneId.slice(9, -11))
    }
  }, [])

  const handleSubmit = async () => {
    errors.set(getDefaultErrors())

    if (!name.value) {
      errors.name.set(t('admin:components.location.nameCantEmpty'))
    }
    if (!maxUsers.value) {
      errors.maxUsers.set(t('admin:components.location.maxUserCantEmpty'))
    }
    if (!scene.value) {
      errors.scene.set(t('admin:components.location.sceneCantEmpty'))
    }
    if (Object.values(errors.value).some((value) => value.length > 0)) {
      return
    }

    submitLoading.set(true)

    const locationData: LocationData = {
      name: name.value,
      slugifiedName: '',
      sceneId: `projects/${scene.value}.scene.json` as SceneID,
      maxUsersPerInstance: maxUsers.value,
      locationSetting: {
        id: '',
        locationId: '' as LocationID,
        locationType: location?.locationSetting.locationType as 'private' | 'public' | 'showroom',
        audioEnabled: audioEnabled.value,
        screenSharingEnabled: screenSharingEnabled.value,
        faceStreamingEnabled: false,
        videoEnabled: videoEnabled.value,
        createdAt: '',
        updatedAt: ''
      },
      isLobby: false,
      isFeatured: false
    }

    try {
      if (location?.id) {
        await locationMutation.patch(location.id, locationData)
      } else {
        await locationMutation.create(locationData)
      }
      PopoverState.hidePopupover()
    } catch (err) {
      errors.serverError.set(err.message)
    }
    submitLoading.set(false)
  }

  return (
    <Modal
      title={
        location?.id ? t('admin:components.location.updateLocation') : t('admin:components.location.createLocation')
      }
      className="w-[50vw]"
      onSubmit={handleSubmit}
      onClose={PopoverState.hidePopupover}
      submitLoading={submitLoading.value}
    >
      <div className="relative grid w-full gap-6">
        {errors.serverError.value && <p className="mb-3 text-rose-800">{errors.serverError.value}</p>}
        <Input
          label={t('admin:components.location.lbl-name')}
          value={name.value}
          onChange={(event) => name.set(event.target.value)}
          error={errors.name.value}
          disabled={submitLoading.value}
        />
        <Input
          type="number"
          label={t('admin:components.location.lbl-maxuser')}
          value={maxUsers.value}
          onChange={(event) => maxUsers.set(Math.max(parseInt(event.target.value, 0), 0))}
          error={errors.maxUsers.value}
          disabled={submitLoading.value}
        />
        <Select
          label={t('admin:components.location.lbl-scene')}
          currentValue={scene.value}
          onChange={(value) => scene.set(value)}
          disabled={adminSceneState.retrieving.value || submitLoading.value}
          options={
            adminSceneState.retrieving.value
              ? [{ value: '', label: t('common:select.fetching') }]
              : [
                  { value: '', label: t('admin:components.location.selectScene'), disabled: true },
                  ...adminSceneState.scenes.value.map((scene) => ({
                    label: `${scene.name} (${scene.project})`,
                    value: `${scene.project}/${scene.name}`
                  }))
                ]
          }
          error={errors.scene.value}
        />
        <Toggle
          label={t('admin:components.location.lbl-ve')}
          value={videoEnabled.value}
          onChange={videoEnabled.set}
          disabled={submitLoading.value}
        />
        <Toggle
          label={t('admin:components.location.lbl-ae')}
          value={audioEnabled.value}
          onChange={audioEnabled.set}
          disabled={submitLoading.value}
        />
        <Toggle
          label={t('admin:components.location.lbl-se')}
          value={screenSharingEnabled.value}
          onChange={screenSharingEnabled.set}
          disabled={submitLoading.value}
        />
      </div>
    </Modal>
  )
}
