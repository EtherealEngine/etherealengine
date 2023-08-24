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

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { Instance } from '@etherealengine/common/src/interfaces/Instance'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Dialog from '@etherealengine/ui/src/primitives/mui/Dialog'
import DialogActions from '@etherealengine/ui/src/primitives/mui/DialogActions'
import DialogContent from '@etherealengine/ui/src/primitives/mui/DialogContent'
import DialogTitle from '@etherealengine/ui/src/primitives/mui/DialogTitle'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'

import { useFind, useMutation } from '@etherealengine/engine/src/common/functions/FeathersHooks'
import { BotType, botPath } from '@etherealengine/engine/src/schemas/bot/bot.schema'
import { locationPath } from '@etherealengine/engine/src/schemas/social/location.schema'
import { NotificationService } from '../../../common/services/NotificationService'
import { AuthState } from '../../../user/services/AuthService'
import { validateForm } from '../../common/validation/formValidation'
import styles from '../../styles/admin.module.scss'

interface Props {
  open: boolean
  bot?: BotType
  onClose: () => void
}

const UpdateBot = ({ open, bot, onClose }: Props) => {
  const { t } = useTranslation()
  const state = useHookstate({
    name: '',
    description: '',
    instance: '',
    location: ''
  })
  const formErrors = useHookstate({
    name: '',
    description: '',
    location: ''
  })
  const currentInstance = useHookstate<Instance[]>([])

  const instanceQuery = useFind('instance')
  const instancesData = instanceQuery.data

  const locationQuery = useFind(locationPath)
  const locationData = locationQuery.data

  const updateBot = useMutation(botPath).update
  const user = useHookstate(getMutableState(AuthState).user)

  useEffect(() => {
    if (bot) {
      state.set({
        name: bot?.name,
        description: bot?.description,
        instance: bot?.instance?.id || '',
        location: bot?.location?.id || ''
      })
    }
  }, [bot])

  const locationsMenu: InputMenuItem[] = locationData.map((el) => {
    return {
      label: el.name,
      value: el.id
    }
  })

  const instancesMenu: InputMenuItem[] = currentInstance.get({ noproxy: true }).map((el) => {
    return {
      label: el.ipAddress,
      value: el.id
    }
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target

    switch (name) {
      case 'name':
        formErrors.merge({ name: value.length < 2 ? t('admin:components.bot.nameCantEmpty') : '' })
        break
      case 'description':
        formErrors.merge({ description: value.length < 2 ? t('admin:components.bot.descriptionCantEmpty') : '' })
        break
      case 'location':
        formErrors.merge({ location: value.length < 2 ? t('admin:components.bot.locationCantEmpty') : '' })
        break
      default:
        break
    }
    state.merge({ [name]: value })
  }

  const data: Instance[] = instancesData.map((element) => {
    return element
  })

  useEffect(() => {
    const instanceFilter = data.filter((el) => el.locationId === state.location.value)
    if (instanceFilter.length > 0) {
      state.merge({ instance: state.instance.value || '' })
      currentInstance.set(instanceFilter)
    } else {
      currentInstance.set([])
      state.merge({ instance: '' })
    }
  }, [state.location.value, instancesData])

  const handleUpdate = () => {
    const data: BotType = {
      name: state.name.value,
      instanceId: state.instance.value || '',
      userId: user.id.value,
      description: state.description.value,
      locationId: state.location.value
    }

    formErrors.merge({
      name: state.name.value ? '' : t('admin:components.bot.nameCantEmpty'),
      description: state.description.value ? '' : t('admin:components.bot.descriptionCantEmpty'),
      location: state.location.value ? '' : t('admin:components.bot.locationCantEmpty')
    })

    if (validateForm(state.value, formErrors.value) && bot) {
      updateBot(bot.id, data)
      state.set({ name: '', description: '', instance: '', location: '' })
      currentInstance.set([])
      onClose()
    } else {
      NotificationService.dispatchNotify(t('admin:components.common.fillRequiredFields'), { variant: 'error' })
    }
  }

  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="form-dialog-title"
        PaperProps={{ className: styles.paperDialog }}
        onClose={onClose}
      >
        <DialogTitle id="form-dialog-title">{t('admin:components.bot.updateBot')}</DialogTitle>
        <DialogContent>
          <InputText
            name="name"
            label={t('admin:components.bot.name')}
            value={state.name.value}
            error={formErrors.name.value}
            onChange={handleInputChange}
          />

          <InputText
            name="description"
            label={t('admin:components.bot.description')}
            value={state.description.value}
            error={formErrors.description.value}
            onChange={handleInputChange}
          />

          <InputSelect
            name="location"
            label={t('admin:components.bot.location')}
            value={state.location.value}
            error={formErrors.location.value}
            menu={locationsMenu}
            onChange={handleInputChange}
            endControl={
              <IconButton
                onClick={locationQuery.refetch}
                icon={<Icon type="Autorenew" style={{ color: 'var(--iconButtonColor)' }} />}
              />
            }
          />

          <InputSelect
            name="instance"
            label={t('admin:components.bot.instance')}
            value={state.instance.value}
            menu={instancesMenu}
            onChange={handleInputChange}
            endControl={
              <IconButton
                onClick={instanceQuery.refetch}
                icon={<Icon type="Autorenew" style={{ color: 'var(--iconButtonColor)' }} />}
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            disableElevation
            type="submit"
            onClick={() => {
              state.set({ name: '', description: '', instance: '', location: '' })
              formErrors.set({ name: '', description: '', location: '' })
              onClose()
            }}
            className={styles.outlinedButton}
          >
            {t('admin:components.common.cancel')}
          </Button>
          <Button
            variant="contained"
            disableElevation
            type="submit"
            className={styles.gradientButton}
            onClick={handleUpdate}
          >
            <Icon type="Save" style={{ marginRight: '10px' }} /> {t('admin:components.common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default UpdateBot
