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
import { v4 as uuidv4 } from 'uuid'

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { BotCommandData } from '@etherealengine/common/src/schema.type.module'
import capitalizeFirstLetter from '@etherealengine/common/src/utils/capitalizeFirstLetter'
import { NO_PROXY, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Card from '@etherealengine/ui/src/primitives/mui/Card'
import CardContent from '@etherealengine/ui/src/primitives/mui/CardContent'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import Paper from '@etherealengine/ui/src/primitives/mui/Paper'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import {
  BotData,
  InstanceID,
  InstanceType,
  LocationID,
  botPath,
  instancePath,
  locationPath
} from '@etherealengine/common/src/schema.type.module'
import { useFind, useMutation } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import { NotificationService } from '../../../common/services/NotificationService'
import { AuthState } from '../../../user/services/AuthService'
import AddCommand from '../../common/AddCommand'
import { validateForm } from '../../common/validation/formValidation'
import styles from '../../styles/admin.module.scss'

const CreateBot = () => {
  const { t } = useTranslation()
  const command = useHookstate<BotCommandData>({
    id: '',
    name: '',
    description: ''
  })
  const commandData = useHookstate<BotCommandData[]>([])

  const formErrors = useHookstate({
    name: '',
    description: '',
    location: ''
  })
  const currentInstance = useHookstate<InstanceType[]>([])
  const state = useHookstate({
    name: '',
    description: '',
    instance: '' as InstanceID,
    location: ''
  })
  const user = useHookstate(getMutableState(AuthState).user)

  const instanceQuery = useFind(instancePath)
  const instanceData = instanceQuery.data

  const locationQuery = useFind(locationPath, { query: { action: 'admin' } })
  const locationData = locationQuery.data

  const createBotData = useMutation(botPath).create

  const handleChangeCommand = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target
    command.merge({ id: uuidv4(), [name]: value })
  }

  const addCommandData = (addCommand: BotCommandData) => {
    if (addCommand.name) {
      const found = commandData.get(NO_PROXY).find((el) => el.name === addCommand.name)
      if (found) {
        NotificationService.dispatchNotify(t('admin:components.bot.uniqueCommand'), { variant: 'error' })
      } else {
        commandData.merge([JSON.parse(JSON.stringify(addCommand))])
        command.set({ id: '', name: '', description: '' })
      }
    } else {
      NotificationService.dispatchNotify(t('admin:components.bot.commandRequired'), { variant: 'error' })
    }
  }

  const data: InstanceType[] = instanceData.map((element) => {
    return element
  })

  useEffect(() => {
    const instanceFilter = data.filter((el) => el.locationId === state.location.value)
    if (instanceFilter.length > 0) {
      state.merge({ instance: '' as InstanceID })
      currentInstance.set(instanceFilter)
    } else {
      currentInstance.set([])
    }
  }, [state.location.value, instanceData])

  const handleSubmit = () => {
    const data: BotData = {
      name: state.name.value,
      instanceId: state.instance.value || ('' as InstanceID),
      userId: user.id.value,
      botCommands: commandData.get(NO_PROXY),
      description: state.description.value,
      locationId: state.location.value as LocationID
    }

    formErrors.merge({
      name: state.name.value ? '' : t('admin:components.bot.nameCantEmpty'),
      description: state.description.value ? '' : t('admin:components.bot.descriptionCantEmpty'),
      location: state.location.value ? '' : t('admin:components.bot.locationCantEmpty')
    })

    if (validateForm(state.value, formErrors.value)) {
      createBotData(data)
      state.set({ name: '', description: '', instance: '' as InstanceID, location: '' })
      commandData.set([])
      currentInstance.set([])
    } else {
      NotificationService.dispatchNotify(t('admin:components.common.fillRequiredFields'), { variant: 'error' })
    }
  }

  const removeCommand = (id: string) => {
    const data = commandData.get(NO_PROXY).filter((el) => el.id !== id)
    commandData.set(data)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    formErrors.merge({ [name]: value.length < 2 ? `${capitalizeFirstLetter(name)} is required` : '' })
    state.merge({ [name]: value })
  }

  const locationMenu: InputMenuItem[] = locationData.map((el) => {
    return {
      value: el.id,
      label: el.name
    }
  })

  const instanceMenu: InputMenuItem[] = currentInstance.get(NO_PROXY).map((el) => {
    return {
      value: el.id,
      label: el.ipAddress
    }
  })

  return (
    <Card className={styles.botRootLeft}>
      <Paper className={styles.botHeader} style={{ display: 'flex' }}>
        <div className={styles.botTitle}>
          <Typography className={styles.smFont}>
            <Icon type="Face" />
            {t('admin:components.bot.createNewBot')}
          </Typography>
        </div>

        <Button variant="contained" disableElevation type="submit" className={styles.botSaveBtn} onClick={handleSubmit}>
          <Icon type="Save" className={styles.saveBtnIcon} /> {t('social:save')}
        </Button>
      </Paper>
      <CardContent>
        <Typography className={styles.secondaryHeading} component="h1">
          {t('admin:components.bot.addMoreBots')}
        </Typography>
        <form style={{ marginTop: '20px' }}>
          <InputText
            name="name"
            label={t('admin:components.bot.name')}
            onChange={handleInputChange}
            value={state.name.value}
            error={formErrors.name.value}
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
            menu={locationMenu}
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
            error={formErrors.location.value}
            menu={instanceMenu}
            onChange={handleInputChange}
            endControl={
              <IconButton
                onClick={instanceQuery.refetch}
                icon={<Icon type="Autorenew" style={{ color: 'var(--iconButtonColor)' }} />}
              />
            }
          />

          <AddCommand
            command={command.value}
            handleChangeCommand={handleChangeCommand}
            addCommandData={addCommandData}
            commandData={commandData.get(NO_PROXY)}
            removeCommand={removeCommand}
          />
        </form>
      </CardContent>
    </Card>
  )
}

export default CreateBot
