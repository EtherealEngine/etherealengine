import React from 'react'
import List from '@material-ui/core/List'
import Divider from '@material-ui/core/Divider'
import ListItem from '@material-ui/core/ListItem'

import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import { Link, withRouter } from 'react-router-dom'
import { useStylesForDashboard } from './styles'
import ListSubheader from '@material-ui/core/ListSubheader'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import Collapse from '@material-ui/core/Collapse'
import { useAuthState } from '../../state/AuthState'
import { SidebarItems, SocialSidebarItems } from './SidebarItems'

import { useTranslation } from 'react-i18next'

interface Props {
  authState?: any
  location: any
}

const SideMenuItem = (props: Props) => {
  const { location } = props
  const { pathname } = location
  const scopes = useAuthState().user?.scopes?.value || []
  const { t } = useTranslation()

  let allowedRoutes = {
    routes: true,
    location: false,
    user: false,
    bot: false,
    scene: false,
    party: false,
    contentPacks: false,
    groups: false,
    instance: false,
    invite: false,
    globalAvatars: false,
    projects: false
  }

  scopes.forEach((scope) => {
    if (Object.keys(allowedRoutes).includes(scope.type.split(':')[0])) {
      if (scope.type.split(':')[1] === 'read') {
        allowedRoutes = {
          ...allowedRoutes,
          [scope.type.split(':')[0]]: true
        }
      }
    }
  })

  const classes = useStylesForDashboard()
  const [openSetting, setOpenSetting] = React.useState(false)
  const [openScene, setOpenScene] = React.useState(false)
  const [openUser, setOpenUser] = React.useState(false)
  const [openLocation, setOpenLocation] = React.useState(false)

  return (
    <>
      <Divider />
      <List>
        {SidebarItems(
          allowedRoutes,
          openLocation,
          openUser,
          openScene,
          openSetting,
          setOpenLocation,
          setOpenUser,
          setOpenScene,
          setOpenSetting
        ).map((sidebarItem, index) => {
          return sidebarItem.title ? (
            sidebarItem.items.filter(Boolean).length > 0 ? (
              <>
                <Link to={sidebarItem.items[0].path} className={classes.textLink}>
                  <ListItem style={{ color: 'white' }} button onClick={() => sidebarItem.click()}>
                    <ListItemIcon>{sidebarItem.items[0].icon}</ListItemIcon>
                    <ListItemText primary={sidebarItem.title} />
                    {sidebarItem.open ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                </Link>
                <Collapse key={index} in={sidebarItem.open} timeout="auto" unmountOnExit>
                  {sidebarItem.items.filter(Boolean).map((item, key) => {
                    return (
                      <Link key={key} to={item.path} className={classes.textLink}>
                        <ListItem
                          classes={{ selected: classes.selected }}
                          style={{ color: 'white' }}
                          selected={item.path === pathname}
                          button
                        >
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText primary={t(item.name)} />
                        </ListItem>
                      </Link>
                    )
                  })}
                </Collapse>
              </>
            ) : (
              <></>
            )
          ) : (
            <Link key={index} to={sidebarItem.items[0].path} className={classes.textLink}>
              <ListItem
                classes={{ selected: classes.selected }}
                style={{ color: 'white' }}
                selected={sidebarItem.items[0].path === pathname}
                button
              >
                <ListItemIcon>{sidebarItem.items[0].icon}</ListItemIcon>
                <ListItemText primary={t(sidebarItem.items[0].name)} />
              </ListItem>
            </Link>
          )
        })}
        {/* {Add the below to SidebarItems.tsx file when you need to enable them} */}
        {/* <Link to="/admin/sessions" className={classes.textLink}>
          <ListItem style={{ color: 'white' }} button>
            <ListItemIcon>
              <DragIndicator style={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary={t('user:dashboard.sessions')} />
          </ListItem>
        </Link> */}
        {/* <Link to="/admin/chats" className={classes.textLink}>
          <ListItem style={{ color: 'white' }} button>
            <ListItemIcon>
              <Forum style={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary={t('user:dashboard.chats')} />
          </ListItem>
        </Link> */}
      </List>
      <Divider style={{ background: '#C0C0C0', marginTop: '2rem' }} />
      <List>
        {SocialSidebarItems().map((item) => {
          return (
            <>
              <ListSubheader inset style={{ color: '#C0C0C0' }}>
                {item.title}
              </ListSubheader>
              <List>
                {item.items.filter(Boolean).map((socialItem, key) => {
                  return (
                    <Link key={key} style={{ textDecoration: 'none' }} to={socialItem.path}>
                      <ListItem
                        style={{ color: 'white' }}
                        classes={{ selected: classes.selected }}
                        selected={socialItem.path === pathname}
                        button
                      >
                        <ListItemIcon>{socialItem.icon}</ListItemIcon>
                        <ListItemText primary={t(socialItem.name)} />
                      </ListItem>
                    </Link>
                  )
                })}
              </List>
            </>
          )
        })}
      </List>
    </>
  )
}

export default withRouter(SideMenuItem)
