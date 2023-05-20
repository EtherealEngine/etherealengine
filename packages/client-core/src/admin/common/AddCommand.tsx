import React from 'react'
import { useTranslation } from 'react-i18next'

import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { BotCommands } from '@etherealengine/common/src/interfaces/AdminBot'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import List from '@etherealengine/ui/src/primitives/mui/List'
import ListItem from '@etherealengine/ui/src/primitives/mui/ListItem'
import ListItemSecondaryAction from '@etherealengine/ui/src/primitives/mui/ListItemSecondaryAction'
import ListItemText from '@etherealengine/ui/src/primitives/mui/ListItemText'

import styles from '../styles/admin.module.scss'

interface Props {
  command: BotCommands
  handleChangeCommand: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void
  addCommandData: (command: BotCommands) => void
  commandData: BotCommands[]
  removeCommand: (id: string) => void
}

const AddCommand = ({ command, handleChangeCommand, addCommandData, commandData, removeCommand }: Props) => {
  const { t } = useTranslation()
  return {
    /*<div>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <InputText
            name="name"
            label={t('admin:components.bot.command')}
            placeholder={t('admin:components.bot.enterCommand')}
            value={command.name}
            onChange={handleChangeCommand}
          />
        </Grid>
        <Grid item xs={8}>
          <InputText
            name="description"
            label={t('admin:components.bot.description')}
            placeholder={t('admin:components.bot.enterDescription')}
            value={command.description ?? ''}
            onChange={handleChangeCommand}
          />
        </Grid>
      </Grid>

      <Button variant="contained" className={styles.openModalBtn} onClick={() => addCommandData(command)}>
        {t('admin:components.bot.addCommand')}
      </Button>
      <div className={commandData.length > 0 ? styles.alterContainer : styles.createAlterContainer}>
        {commandData.map((el, i) => {
          return (
            <List dense={true} key={i}>
              <ListItem>
                <ListItemText primary={`${i + 1}. /${el.name} --> ${el.description} `} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    title="delete"
                    size="large"
                    onClick={() => {
                      el.id && removeCommand(el.id)
                    }}
                    icon={<Icon type="Delete" style={{ color: 'var(--iconButtonColor)' }} />}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          )
        })}
      </div>
      </div>*/
  }
}

export default AddCommand
