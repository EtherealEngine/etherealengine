import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { addActionReceptor, removeActionReceptor } from '@xrengine/hyperflux'

import { List } from '@mui/icons-material'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import { AdminBotsCommandServiceReceptor } from '../../services/BotsCommand'
import { AdminBotServiceReceptor } from '../../services/BotsService'
import styles from '../../styles/admin.module.scss'
import CreateBot from './CreateBot'
import DisplayBots from './DisplayBots'

const Bots = () => {
  const { t } = useTranslation()

  useEffect(() => {
    addActionReceptor(AdminBotsCommandServiceReceptor)
    addActionReceptor(AdminBotServiceReceptor)
    return () => {
      removeActionReceptor(AdminBotsCommandServiceReceptor)
      removeActionReceptor(AdminBotServiceReceptor)
    }
  }, [])

  return (
    <div>
      <Grid container={true} spacing={4}>
        <Grid item xs={12} md={6} sm={12}>
          <CreateBot />
        </Grid>
        <Grid item xs={12} md={6} sm={12}>
          <Card className={styles.botRoot}>
            <Paper className={styles.botHeader}>
              <Typography className={styles.botTitle}>
                <List className={styles.pTop5} />
                <span className={styles.mLeft10}> {t('admin:components.bot.xrEngineBots')} </span>
              </Typography>
            </Paper>
            <DisplayBots />
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default Bots
