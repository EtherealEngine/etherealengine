import React, { useState, useEffect } from 'react'
import { useStyles } from './styles'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Collapse from '@mui/material/Collapse'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Switch from '@mui/material/Switch'
import { Grid, Paper, Button, Typography } from '@mui/material'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import { Icon } from '@iconify/react'
import { useServerSettingState } from '../../services/Setting/ServerSettingService'
import { ServerSettingService } from '../../services/Setting/ServerSettingService'
import { useAuthState } from '../../../user/services/AuthService'

interface serverProps {
  fetchServerSettings?: any
}

const Server = (props: serverProps) => {
  const classes = useStyles()
  const [open, setOpen] = useState(false)
  const [openPaginate, setOpenPginate] = useState(false)
  const serverSettingState = useServerSettingState()
  const [serverSetting] = serverSettingState?.server?.value || []
  const id = serverSetting?.id
  const [gaTrackingId, setGaTrackingId] = useState(serverSetting?.gaTrackingId)

  useEffect(() => {
    if (serverSetting) {
      setGaTrackingId(serverSetting?.gaTrackingId)
    }
  }, [serverSettingState?.updateNeeded?.value])

  const [enabled, setEnabled] = useState({
    checkedA: true,
    checkedB: true
  })
  const [dryRun, setDryRun] = useState({
    checkedA: true,
    checkedB: true
  })
  const [local, setLocal] = useState({
    checkedA: true,
    checkedB: true
  })

  const authState = useAuthState()
  const user = authState.user
  const handleClick = () => {
    setOpen(!open)
  }
  const handleClickPaginate = () => {
    setOpenPginate(!openPaginate)
  }

  const handleEnable = (event) => {
    setEnabled({ ...enabled, [event.target.name]: event.target.checked })
  }

  const handleDryRun = (event) => {
    setDryRun({ ...dryRun, [event.target.name]: event.target.checked })
  }

  const handleLocal = (event) => {
    setLocal({ ...local, [event.target.name]: event.target.checked })
  }

  const handleSave = (event) => {
    event.preventDefault()
    ServerSettingService.pathServerSetting({ gaTrackingId: gaTrackingId }, id)
  }

  const handleCancel = () => {
    setGaTrackingId(serverSetting?.gaTrackingId)
  }

  useEffect(() => {
    if (user?.id?.value != null && serverSettingState?.updateNeeded?.value === true) {
      ServerSettingService.fetchServerSettings()
    }
  }, [authState?.user?.id?.value, serverSettingState?.updateNeeded?.value])

  return (
    <form onSubmit={handleSave}>
      <Typography component="h1" className={classes.settingsHeading}>
        SERVER
      </Typography>
      <Grid container spacing={3} key={serverSetting?.id || ''}>
        <Grid item xs={12} sm={6}>
          <label>Enabled</label>
          <Paper component="div" className={classes.createInput}>
            <Switch
              disabled
              checked={enabled.checkedB}
              onChange={handleEnable}
              color="primary"
              name="checkedB"
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
          </Paper>
          <br />
          <label>Mode</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="mode"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.serverMode || 'test'}
            />
          </Paper>
          <label> Host Name</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="hostname"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.hostName || 'test'}
            />
          </Paper>
          <label>Port</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="port"
              className={classes.input}
              value={serverSetting?.port || ''}
              disabled
              style={{ color: '#fff' }}
            />
          </Paper>
          <label> Client Host</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="clienthost"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.clientHost || ''}
            />
          </Paper>
          <label>Root Directory</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="rootDir"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.rootDirectory || ''}
            />
          </Paper>
          <label>Public Directory</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="publicDir"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.publicDirectory || ''}
            />
          </Paper>
          <label>Node Modules Directory</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="nodeModule"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.nodeModulesDirectory || ''}
            />
          </Paper>{' '}
          <label>Local StorageProvider </label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="localStorageProvider"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.localStorageProvider || ''}
            />
          </Paper>
          <label> Perform Dry Run</label>
          <Paper component="div" className={classes.createInput}>
            <Switch
              disabled
              checked={dryRun.checkedB}
              onChange={handleDryRun}
              color="primary"
              name="checkedB"
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <label>Storage Provider </label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="StorageProvider"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.storageProvider || ''}
            />
          </Paper>
          <label>Google Analytics Tracking ID </label>
          <Paper component="div" className={classes.createInput}>
            <IconButton size="large">
              <Icon icon="emojione:key" />
            </IconButton>
            <InputBase
              name="googleTrackingid"
              className={classes.input}
              style={{ color: '#fff' }}
              value={gaTrackingId || ''}
              onChange={(e) => setGaTrackingId(e.target.value)}
            />
          </Paper>
          <ListItem button onClick={handleClick}>
            <ListItemText primary="Hub" />
            {open ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem button className={classes.nested}>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="hub"
                    className={classes.input}
                    style={{ color: '#fff' }}
                    disabled
                    value={serverSetting?.hub?.endpoint || ''}
                  />
                </Paper>
              </ListItem>
            </List>
          </Collapse>
          <ListItem button onClick={handleClickPaginate}>
            <ListItemText primary="Paginate" />
            {openPaginate ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={openPaginate} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem button className={classes.nested}>
                <ListItemText primary="Default:10" />
                <ListItemText primary={`Max: ${serverSetting?.paginate || ''}`} />
              </ListItem>
            </List>
          </Collapse>
          <label>URL</label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="url"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.url || ''}
            />
          </Paper>
          <label> CertPath </label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="certPath"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.certPath || ''}
            />
          </Paper>
          <label> KeyPath </label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="keyPath"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.keyPath || ''}
            />
          </Paper>
          <label> Local </label>
          <Paper component="div" className={classes.createInput}>
            <Switch
              disabled
              checked={local.checkedB}
              onChange={handleLocal}
              color="primary"
              name="checkedB"
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
          </Paper>
          <label> Release Name </label>
          <Paper component="div" className={classes.createInput}>
            <InputBase
              name="releaseName"
              className={classes.input}
              disabled
              style={{ color: '#fff' }}
              value={serverSetting?.releaseName || ''}
            />
          </Paper>
        </Grid>
      </Grid>
      <Button variant="outlined" style={{ color: '#fff' }} onClick={handleCancel}>
        Cancel
      </Button>
      &nbsp; &nbsp;
      <Button variant="contained" type="submit">
        Save
      </Button>
    </form>
  )
}

export default Server
