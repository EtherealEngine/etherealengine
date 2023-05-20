import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { BotCommands, CreateBotAsAdmin } from '@etherealengine/common/src/interfaces/AdminBot'
import { Instance } from '@etherealengine/common/src/interfaces/Instance'
import capitalizeFirstLetter from '@etherealengine/common/src/utils/capitalizeFirstLetter'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Card from '@etherealengine/ui/src/primitives/mui/Card'
import CardContent from '@etherealengine/ui/src/primitives/mui/CardContent'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import Paper from '@etherealengine/ui/src/primitives/mui/Paper'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { NotificationService } from '../../../common/services/NotificationService'
import { AuthState } from '../../../user/services/AuthService'
import AddCommand from '../../common/AddCommand'
import { validateForm } from '../../common/validation/formValidation'
import { AdminBotService } from '../../services/BotsService'
import { AdminInstanceService, AdminInstanceState } from '../../services/InstanceService'
import { AdminLocationService, AdminLocationState } from '../../services/LocationService'
import styles from '../../styles/admin.module.scss'

const CreateBot = () => {
  const command = useHookstate<BotCommands>({
    id: '',
    name: '',
    description: ''
  })
  const commandData = useHookstate<BotCommands[]>([])

  const formErrors = useHookstate({
    name: '',
    description: '',
    location: ''
  })
  const currentInstance = useHookstate<Instance[]>([])
  const state = useHookstate({
    name: '',
    description: '',
    instance: '',
    location: ''
  })
  const adminInstanceState = useHookstate(getMutableState(AdminInstanceState))
  const user = useHookstate(getMutableState(AuthState).user)
  const instanceData = adminInstanceState.instances
  const adminLocationState = useHookstate(getMutableState(AdminLocationState))
  const locationData = adminLocationState.locations
  const { t } = useTranslation()

  useEffect(() => {
    if (user?.id.value && adminInstanceState.updateNeeded.value) {
      AdminInstanceService.fetchAdminInstances()
    }
  }, [user?.id?.value, adminInstanceState.updateNeeded.value])

  useEffect(() => {
    if (user?.id.value && adminLocationState.updateNeeded.value) {
      AdminLocationService.fetchAdminLocations()
    }
  }, [user?.id?.value, adminLocationState.updateNeeded.value])

  /*
  const handleChangeCommand = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target
    command.merge({ id: uuidv4(), [name]: value })
  }

  const addCommandData = (addCommand) => {
    if (addCommand.name) {
      const found = commandData.get({ noproxy: true }).find((el) => el.name === addCommand.name)
      if (found) {
        NotificationService.dispatchNotify(t('admin:components.bot.uniqueCommand'), { variant: 'error' })
      } else {
        commandData.merge([addCommand])
        command.set({ id: '', name: '', description: '' })
      }
    } else {
      NotificationService.dispatchNotify(t('admin:components.bot.commandRequired'), { variant: 'error' })
    }
  }*/

  const data: Instance[] = instanceData.get({ noproxy: true }).map((element) => {
    return element
  })

  useEffect(() => {
    const instanceFilter = data.filter((el) => el.locationId === state.location.value)
    if (instanceFilter.length > 0) {
      state.merge({ instance: '' })
      currentInstance.set(instanceFilter)
    } else {
      currentInstance.set([])
    }
  }, [state.location.value, adminInstanceState.instances.value.length])

  const handleSubmit = () => {
    const data: CreateBotAsAdmin = {
      name: state.name.value,
      instanceId: state.instance.value || null,
      userId: user.id.value,
      command: commandData.get({ noproxy: true }),
      description: state.description.value,
      locationId: state.location.value
    }

    formErrors.merge({
      name: state.name.value ? '' : t('admin:components.bot.nameCantEmpty'),
      description: state.description.value ? '' : t('admin:components.bot.descriptionCantEmpty'),
      location: state.location.value ? '' : t('admin:components.bot.locationCantEmpty')
    })

    if (validateForm(state.value, formErrors.value)) {
      AdminBotService.createBotAsAdmin(data)
      state.set({ name: '', description: '', instance: '', location: '' })
      commandData.set([])
      currentInstance.set([])
    } else {
      NotificationService.dispatchNotify(t('admin:components.common.fillRequiredFields'), { variant: 'error' })
    }
  }

  const fetchAdminInstances = () => {
    AdminInstanceService.fetchAdminInstances()
  }

  const fetchAdminLocations = () => {
    AdminLocationService.fetchAdminLocations()
  }

  /*const removeCommand = (id: string) => {
    const data = commandData.get({ noproxy: true }).filter((el) => el.id !== id)
    commandData.set(data)
  }*/

  const handleInputChange = (e) => {
    const { name, value } = e.target

    formErrors.merge({ [name]: value.length < 2 ? `${capitalizeFirstLetter(name)} is required` : '' })
    state.merge({ [name]: value })
  }

  const locationMenu: InputMenuItem[] = locationData.get({ noproxy: true }).map((el) => {
    return {
      value: el.id,
      label: el.name
    }
  })

  const instanceMenu: InputMenuItem[] = currentInstance.get({ noproxy: true }).map((el) => {
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
                onClick={fetchAdminLocations}
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
                onClick={fetchAdminInstances}
                icon={<Icon type="Autorenew" style={{ color: 'var(--iconButtonColor)' }} />}
              />
            }
          />

          {/*<AddCommand
            command={command.value}
            handleChangeCommand={handleChangeCommand}
            addCommandData={addCommandData}
            commandData={commandData.get({ noproxy: true })}
            removeCommand={removeCommand}
          />*/}
        </form>
      </CardContent>
    </Card>
  )
}

export default CreateBot
