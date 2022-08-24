import { useHookstate } from '@hookstate/core'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { UserInterface } from '@xrengine/common/src/interfaces/User'
import { WorldState } from '@xrengine/engine/src/networking/interfaces/WorldState'
import { getState } from '@xrengine/hyperflux'

import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import MessageIcon from '@mui/icons-material/Message'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { FriendService, useFriendState } from '../../../../social/services/FriendService'
import { useAuthState } from '../../../services/AuthService'
import { UserService, useUserState } from '../../../services/UserService'
import styles from '../index.module.scss'
import { getAvatarURLForUser, Views } from '../util'

interface Props {
  changeActiveMenu: Function
}

const FriendsMenu = ({ changeActiveMenu }: Props): JSX.Element => {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = React.useState('friends')

  const friendState = useFriendState()
  const userState = useUserState()
  const selfUser = useAuthState().user
  const userId = selfUser.id.value
  const userAvatarDetails = useHookstate(getState(WorldState).userAvatarDetails)

  FriendService.useAPIListeners()

  useEffect(() => {
    FriendService.getUserRelationship(userId)
    UserService.getLayerUsers(true)
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  const handleProfile = (user: UserInterface) => {
    changeActiveMenu(Views.AvatarContext, { user })
  }

  const displayList: Array<UserInterface> = []

  if (selectedTab === 'friends') {
    displayList.push(...friendState.relationships.requested.value)
    displayList.push(...friendState.relationships.friend.value)
  } else if (selectedTab === 'blocked') {
    displayList.push(...friendState.relationships.blocking.value)
  } else if (selectedTab === 'find') {
    const nearbyUsers = userState.layerUsers.value.filter(
      (layerUser) =>
        layerUser.id !== userId &&
        !friendState.relationships.friend.value.find((item) => item.id === layerUser.id) &&
        !friendState.relationships.requested.value.find((item) => item.id === layerUser.id) &&
        !friendState.relationships.blocked.value.find((item) => item.id === layerUser.id) &&
        !friendState.relationships.blocking.value.find((item) => item.id === layerUser.id)
    )
    displayList.push(...nearbyUsers)
  }

  return (
    <div className={styles.menuPanel}>
      <div className={styles.friendsPanel}>
        <Tabs className={styles.tabsPanel} value={selectedTab} onChange={handleTabChange} variant="fullWidth">
          <Tab value="find" label="Find" />
          <Tab value="friends" label="Friends" />
          <Tab value="blocked" label="Blocked" />
        </Tabs>

        <div className={styles.friendsList}>
          {displayList.map((value) => (
            <div key={value.id} className={styles.friendItem}>
              <Avatar alt={value.name} src={getAvatarURLForUser(userAvatarDetails, value.id)} />

              <span className={styles.friendName}>{value.name}</span>

              {value.relationType === 'friend' && (
                <IconButton className={styles.filledBtn} title={t('user:friends.message')}>
                  <MessageIcon />
                </IconButton>
              )}

              {value.relationType === 'requested' && (
                <>
                  <Chip className={styles.chip} label={t('user:friends.pending')} size="small" variant="outlined" />

                  <IconButton className={styles.filledBtn} title={t('user:friends.accept')}>
                    <CheckIcon />
                  </IconButton>

                  <IconButton className={styles.filledBtn} title={t('user:friends.decline')}>
                    <CloseIcon />
                  </IconButton>
                </>
              )}

              {value.relationType === 'blocking' && (
                <IconButton className={styles.filledBtn} title={t('user:friends.unblock')}>
                  <HowToRegIcon />
                </IconButton>
              )}

              <IconButton
                className={styles.filledBtn}
                title={t('user:friends.profile')}
                onClick={() => handleProfile(value)}
              >
                <AccountCircleIcon />
              </IconButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FriendsMenu
