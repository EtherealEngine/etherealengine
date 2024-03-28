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
  helmBuilderVersionPath,
  helmMainVersionPath,
  helmSettingPath
} from '@etherealengine/common/src/schema.type.module'
import { useHookstate } from '@etherealengine/hyperflux'
import { useFind, useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import Accordion from '@etherealengine/ui/src/primitives/tailwind/Accordion'
import Button from '@etherealengine/ui/src/primitives/tailwind/Button'
import LoadingCircle from '@etherealengine/ui/src/primitives/tailwind/LoadingCircle'
import Select from '@etherealengine/ui/src/primitives/tailwind/Select'
import Text from '@etherealengine/ui/src/primitives/tailwind/Text'
import React, { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HiMinus, HiPlusSmall } from 'react-icons/hi2'

const HelmTab = forwardRef(({ open }: { open: boolean }, ref: React.MutableRefObject<HTMLDivElement>) => {
  const { t } = useTranslation()

  const state = useHookstate({
    loading: false,
    errorMessage: ''
  })

  const helmSetting = useFind(helmSettingPath).data.at(0)
  const id = helmSetting?.id
  const selectedMainVersion = useHookstate(helmSetting?.main)

  const helmMainVersions = useFind(helmMainVersionPath).data
  const mainVersionMenu = helmMainVersions.map((el) => {
    return {
      value: el as string,
      label: el
    }
  })

  const helmBuilderVersions = useFind(helmBuilderVersionPath).data
  const selectedBuilderVersion = useHookstate(helmSetting?.builder)
  const builderVersionMenu = helmBuilderVersions.map((el) => {
    return {
      value: el as string,
      label: el
    }
  })

  const patchHelmSetting = useMutation(helmSettingPath).patch
  const handleSubmit = (event) => {
    event.preventDefault()

    if (!id || !selectedMainVersion.value || !selectedBuilderVersion.value) return

    state.loading.set(true)
    patchHelmSetting(id, { main: selectedMainVersion.value, builder: selectedBuilderVersion.value })
      .then(() => {
        state.set({ loading: false, errorMessage: '' })
      })
      .catch((e) => {
        state.set({ loading: false, errorMessage: e.message })
      })
  }

  const handleCancel = () => {
    selectedMainVersion.set(helmSetting?.main)
    selectedBuilderVersion.set(helmSetting?.builder)
  }

  return (
    <Accordion
      title={t('admin:components.setting.helm.header')}
      subtitle={t('admin:components.setting.helm.subtitle')}
      expandIcon={<HiPlusSmall />}
      shrinkIcon={<HiMinus />}
      ref={ref}
      open={open}
    >
      <Text component="p" className="mb-6 mt-2 dark:text-[#A3A3A3]">
        {t('admin:components.setting.helm.subtitle')}
      </Text>

      <div className="mb-6 grid w-full grid-cols-2 gap-2">
        <Select
          label={t('admin:components.setting.helm.main')}
          options={mainVersionMenu}
          onChange={(value) => {
            selectedMainVersion.set(value as string)
          }}
          currentValue={selectedMainVersion.value || ''}
          className="col-span-1"
        />

        <Select
          label={t('admin:components.setting.helm.builder')}
          options={builderVersionMenu}
          onChange={(value) => {
            selectedBuilderVersion.set(value as string)
          }}
          currentValue={selectedBuilderVersion.value || ''}
          className="col-span-1"
        />

        <div className="col-span-1 mt-6 grid grid-cols-4 gap-6">
          <Button className="bg-theme-highlight text-primary col-span-1" onClick={handleCancel} fullWidth>
            {t('admin:components.common.reset')}
          </Button>

          <Button
            variant="primary"
            className="col-span-1"
            onClick={handleSubmit}
            startIcon={state.loading.value && <LoadingCircle className="h-6 w-6" />}
            fullWidth
          >
            {t('admin:components.common.save')}
          </Button>
        </div>
      </div>
    </Accordion>
  )
})

export default HelmTab
