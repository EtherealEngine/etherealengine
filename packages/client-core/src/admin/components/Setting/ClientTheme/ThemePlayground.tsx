import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import MenuIcon from '@mui/icons-material/Menu'
import SettingIcon from '@mui/icons-material/Settings'
import {
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material'

import DrawerView from '../../../common/DrawerView'
import { InputMenuItem } from '../../../common/InputSelect'
import styles from '../../../styles/settings.module.scss'

/*
  Don't replace basic components from ThemePlayground with custom made or any library components
  since basic components are here styled according to the temporary selected theme for playground,
  not the main theme used everywhere in app.
*/

const ThemePlayground = () => {
  const [dock, setDock] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [drawerValue, setDrawerValue] = useState(false)
  const [selectValue, setSelectValue] = useState('')
  const [anchorEl, setAnchorEl] = useState<any>(null)

  const { t } = useTranslation()

  const openMenu = (e) => {
    setAnchorEl(e.target)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  const columns = [
    { id: 'name', label: 'Name', minWidth: 65, align: 'left' },
    {
      id: 'isGuest',
      label: 'Status',
      minWidth: 65,
      align: 'right'
    },
    {
      id: 'location',
      label: 'Location',
      minWidth: 65,
      align: 'right'
    },
    {
      id: 'inviteCode',
      label: 'Invite code',
      minWidth: 65,
      align: 'right'
    },
    {
      id: 'instanceId',
      label: 'Instance',
      minWidth: 65,
      align: 'right'
    },
    {
      id: 'action',
      label: 'Action',
      minWidth: 65,
      align: 'right'
    }
  ]

  const rows = [
    {
      name: 'Josh',
      isGuest: false,
      location: 'test',
      inviteCode: 'NULL',
      instanceId: 'koqwndpkqwndpkqwndpqkwndm',
      action: (
        <>
          <a href="#" className="actionStyle" onClick={() => {}}>
            <span className="spanWhite">View</span>
          </a>
          <a href="#" className="actionStyle" onClick={() => {}}>
            <span className="spanDange">Delete</span>
          </a>
        </>
      )
    },
    {
      name: 'Liam',
      isGuest: false,
      location: 'apartment',
      inviteCode: 'NULL',
      instanceId: 'alksdnvoakewndawepdnpqwdew',
      action: (
        <>
          <a href="#" className="actionStyle" onClick={() => {}}>
            <span className="spanWhite">View</span>
          </a>
          <a href="#" className="actionStyle" onClick={() => {}}>
            <span className="spanDange">Delete</span>
          </a>
        </>
      )
    },
    {
      name: 'Gheric',
      isGuest: false,
      location: 'test',
      inviteCode: 'NULL',
      instanceId: 'qkpwejdpqwdmpqlcmnpqwmndqow',
      action: (
        <>
          <a href="#" className="actionStyle" onClick={() => {}}>
            <span className="spanWhite">View</span>
          </a>
          <a href="#" className="actionStyle" onClick={() => {}}>
            <span className="spanDange">Delete</span>
          </a>
        </>
      )
    }
  ]

  const selectMenu: InputMenuItem[] = ['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((el) => {
    return {
      value: el,
      label: el
    }
  })

  return (
    <>
      <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.themePlayground')}</Typography>
      <Box className="themeDemoArea">
        <nav className="navbar">
          <div className="logoSection">Ethereal Engine</div>
        </nav>
        <div className="mainSection">
          <div className="sidebar">
            <List className="sidebarList">
              {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6'].map((item, index) => (
                <ListItem
                  key={index}
                  className={index === 1 ? 'sidebarSelectedItem' : ''}
                  selected={index === 1}
                  button
                >
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </div>
          <div className="contentArea">
            <div className="hiddenWidth"></div>
            <Box className="tableBox">
              <TableContainer className="tableContainer">
                <Table stickyHeader aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      {columns.map((headCell) => (
                        <TableCell
                          key={headCell.id}
                          align="right"
                          padding="normal"
                          className="tableCellHeader"
                          style={{ minWidth: headCell.minWidth }}
                        >
                          {headCell.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => {
                      return (
                        <TableRow hover role="checkbox" tabIndex={-1} key={`${index}${row.name}`}>
                          {columns.map((column, index) => {
                            const value = row[column.id]
                            return (
                              <TableCell key={index} align="right" className="tableCellBody">
                                {value}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[12]}
                component="div"
                count={rows.length}
                rowsPerPage={100}
                page={0}
                onPageChange={() => {}}
                onRowsPerPageChange={() => {}}
                className="tableFooter"
              />
            </Box>
            <Box className="panel">
              <div className="textHeading">Heading</div>
              <Box className="panelCardContainer">
                <Box className="panelCard">
                  <img className="panelCardImage" />
                  <div className="textSubheading">
                    <label className="text">Subheading</label>
                    <IconButton className="panelCardIcon">
                      <SettingIcon />
                    </IconButton>
                  </div>
                  <div className="textDescription">This is my description</div>
                </Box>
                <Box className="panelCard">
                  <img className="panelCardImage" />
                  <div className="textSubheading">
                    <label className="text">Subheading</label>
                    <IconButton className="panelCardIcon">
                      <SettingIcon />
                    </IconButton>
                  </div>
                  <div className="textDescription">This is my description</div>
                </Box>
                <Box className="panelCard">
                  <img className="panelCardImage" />
                  <div className="textSubheading">
                    <label className="text">Subheading</label>
                    <IconButton className="panelCardIcon">
                      <SettingIcon />
                    </IconButton>
                  </div>
                  <div className="textDescription">This is my description</div>
                </Box>
                <Box className="panelCard">
                  <img className="panelCardImage" />
                  <div className="textSubheading">
                    <label className="text">Subheading</label>
                    <IconButton className="panelCardIcon">
                      <SettingIcon />
                    </IconButton>
                  </div>
                  <div className="textDescription">This is my description</div>
                </Box>
              </Box>
            </Box>
            <Box className="panel">
              <div className="textHeading">Buttons</div>
              <div className="buttonContainer">
                <div className="iconButtonContainer">
                  <label className="textSubheading">Unselected Button:</label>
                  <IconButton className="iconButton">
                    <SettingIcon />
                  </IconButton>
                  <label className="textSubheading">Selected Button:</label>
                  <IconButton className="iconButtonSelected">
                    <SettingIcon />
                  </IconButton>
                </div>
                <label className="textSubheading">Outlined Button:</label>
                <Button variant="outlined" className="outlinedButton">
                  Cancel
                </Button>
                <label className="textSubheading">Filled Button:</label>
                <Button variant="contained" className="filledButton">
                  Submit
                </Button>
                <label className="textSubheading">Gradient Button:</label>
                <Button variant="contained" className="gradientButton">
                  Save
                </Button>
              </div>
              <Divider variant="inset" component="div" className={styles.colorGridDivider} />
              <div className="textHeading">Dropdown</div>
              <div className="buttonContainer">
                <label className="textSubheading">Menu Icon Dropdown:</label>
                <IconButton className="iconButton" onClick={openMenu}>
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={closeMenu}
                  classes={{ paper: 'selectPaper' }}
                >
                  {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((el, index) => (
                    <MenuItem value={el} key={index} onClick={closeMenu} classes={{ root: 'option' }}>
                      {el}
                    </MenuItem>
                  ))}
                </Menu>
                <label className="textSubheading">Select Dropdown:</label>
                <Select
                  displayEmpty
                  value={selectValue}
                  className="select"
                  MenuProps={{ classes: { paper: 'selectPaper' } }}
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  <MenuItem value="" key={-1} disabled classes={{ root: 'option', selected: 'optionSelected' }}>
                    Select Option
                  </MenuItem>
                  {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((el, index) => (
                    <MenuItem value={el} key={index} classes={{ root: 'option', selected: 'optionSelected' }}>
                      {el}
                    </MenuItem>
                  ))}
                </Select>
              </div>
              <Divider variant="inset" component="div" className={styles.colorGridDivider} />
              <div className="textHeading">Input</div>
              <InputBase className="input" placeholder={t('admin:components.setting.placeholderText')} />
              <Divider variant="inset" component="div" className={styles.colorGridDivider} />
              <div className="textHeading">Drawer</div>
              <Button variant="contained" className="filledButton" onClick={() => setDrawerValue(true)}>
                Open Drawer
              </Button>
              <DrawerView
                open={drawerValue}
                classes={{ paper: 'drawer' }}
                onClose={() => setDrawerValue(false)}
              ></DrawerView>
              <div className="textHeading">Popup</div>
              <Button variant="contained" className="filledButton" onClick={() => setDialog(true)}>
                Open Popup
              </Button>
              <Dialog
                open={dialog}
                className="popupMainBackground"
                PaperProps={{ className: 'drawerPaper' }}
                onClose={() => setDialog(false)}
              ></Dialog>
              <div className="textHeading">Editor Dock</div>
              <Button variant="contained" className="filledButton" onClick={() => setDock(true)}>
                Open Dock
              </Button>
              <div
                className="dockClickAway"
                style={{ display: dock ? 'block' : 'none' }}
                onClick={() => setDock(false)}
              ></div>
              <div className="dockBackground" style={{ display: dock ? 'block' : 'none' }}></div>
            </Box>
          </div>
        </div>
      </Box>
    </>
  )
}

export default ThemePlayground
