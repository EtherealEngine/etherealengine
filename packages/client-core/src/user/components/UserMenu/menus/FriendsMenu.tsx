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

import { useHookstate } from '@hookstate/core'
import { cloneDeep } from 'lodash'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Avatar from '@etherealengine/client-core/src/common/components/Avatar'
import Menu from '@etherealengine/client-core/src/common/components/Menu'
import Tabs from '@etherealengine/client-core/src/common/components/Tabs'
import Text from '@etherealengine/client-core/src/common/components/Text'
import commonStyles from '@etherealengine/client-core/src/common/components/common.module.scss'
import { ChannelID, ChannelType, UserID, UserName, channelPath } from '@etherealengine/common/src/schema.type.module'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { NO_PROXY, getMutableState } from '@etherealengine/hyperflux'
import { useFind } from '@etherealengine/spatial/src/common/functions/FeathersHooks'
import { NetworkState } from '@etherealengine/spatial/src/networking/NetworkState'
import { WorldState } from '@etherealengine/spatial/src/networking/interfaces/WorldState'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Chip from '@etherealengine/ui/src/primitives/mui/Chip'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import { SocialMenus } from '../../../../networking/NetworkInstanceProvisioning'
import { ChannelService, ChannelState } from '../../../../social/services/ChannelService'
import { FriendService, FriendState } from '../../../../social/services/FriendService'
import { AvatarMenus } from '../../../../systems/AvatarUISystem'
import { AvatarUIContextMenuService } from '../../../../systems/ui/UserMenuView'
import { UserMenus } from '../../../UserUISystem'
import { useUserAvatarThumbnail } from '../../../functions/useUserAvatarThumbnail'
import { AuthState } from '../../../services/AuthService'
import { PopupMenuServices } from '../PopupMenuService'
import styles from '../index.module.scss'

type TabsType = 'friends' | 'blocked' | 'find' | 'messages'

interface Props {
  defaultSelectedTab?: TabsType
}

interface DisplayedUserInterface {
  id: UserID
  name: UserName
  relationType?: 'friend' | 'requested' | 'blocking' | 'pending' | 'blocked'
}

const getChannelName = (channel: ChannelType) => {
  return (
    channel.name ||
    channel.channelUsers
      .filter((channelUser) => channelUser.user?.id !== Engine.instance.userID)
      .map((channelUser) => channelUser.user?.name)
      .filter(Boolean)
      .join(', ')
  )
}

/**
 * @todo
 * - rename this messages menu
 *
 * rather than populate this with friends,
 * */
const FriendsMenu = ({ defaultSelectedTab }: Props): JSX.Element => {
  const { t } = useTranslation()
  const selectedTab = useHookstate(defaultSelectedTab ? defaultSelectedTab : 'friends')

  const channels = useFind(channelPath)

  const worldState = useHookstate(getMutableState(WorldState))
  const friendState = useHookstate(getMutableState(FriendState))
  const selfUser = useHookstate(getMutableState(AuthState).user)
  const userId = selfUser.id.value
  const userNames = worldState.userNames.get(NO_PROXY)

  const privateChannels = channels.data.filter((channel) => !channel.instanceId)

  const channelState = useHookstate(getMutableState(ChannelState))

  const startMediaCall = (channelID: ChannelID) => {
    const inChannelCall = channelState.targetChannelId.value === channelID
    ChannelService.joinChannelInstance(inChannelCall ? ('' as ChannelID) : channelID)
  }

  useEffect(() => {
    FriendService.getUserRelationship(userId)
  }, [])

  const handleTabChange = (newValue: TabsType) => {
    selectedTab.set(newValue)
  }

  const handleProfile = (user: DisplayedUserInterface) => {
    AvatarUIContextMenuService.setId(user.id as UserID)
    PopupMenuServices.showPopupMenu(AvatarMenus.AvatarContext, {
      onBack: () => PopupMenuServices.showPopupMenu(SocialMenus.Friends, { defaultSelectedTab: selectedTab.value })
    })
  }

  const handleOpenChat = (id: string) => {
    if (selectedTab.value === 'messages') {
      PopupMenuServices.showPopupMenu(SocialMenus.Messages, { channelID: id as ChannelID })
    } else {
      const channelWithFriend = privateChannels.find(
        (channel) =>
          channel.channelUsers.length === 2 && channel.channelUsers.find((channelUser) => channelUser.userId === id)
      )
      if (channelWithFriend) {
        PopupMenuServices.showPopupMenu(SocialMenus.Messages, { channelID: channelWithFriend.id })
      } else {
        ChannelService.createChannel([id as UserID]).then((channel) => {
          if (channel) PopupMenuServices.showPopupMenu(SocialMenus.Messages, { channelID: channel.id })
        })
      }
    }
  }

  const displayList: Array<DisplayedUserInterface> = []
  const pendingList: Array<DisplayedUserInterface> = friendState.relationships.value
    .filter((item) => item.userRelationshipType === 'pending')
    .map((item) => ({ id: item.relatedUserId, name: item.relatedUser.name, relationType: 'pending' as const }))
  const friendList: Array<DisplayedUserInterface> = friendState.relationships.value
    .filter((item) => item.userRelationshipType === 'friend')
    .map((item) => ({ id: item.relatedUserId, name: item.relatedUser.name, relationType: 'friend' as const }))

  if (selectedTab.value === 'friends') {
    displayList.push(...pendingList)
    displayList.push(...friendList)
  } else if (selectedTab.value === 'messages') {
    displayList.push(
      ...privateChannels.map((channel) => ({
        id: channel.id.toString() as UserID,
        name: getChannelName(channel) as UserName,
        relationType: 'friend' as const
      }))
    )
  } else if (selectedTab.value === 'blocked') {
    const blockingList: Array<DisplayedUserInterface> = friendState.relationships.value
      .filter((item) => item.userRelationshipType === 'blocking')
      .map((item) => ({ id: item.relatedUserId, name: item.relatedUser.name, relationType: 'blocking' as const }))
    displayList.push(...blockingList)
  } else if (selectedTab.value === 'find') {
    const layerPeers = NetworkState.worldNetwork
      ? Object.values(NetworkState.worldNetwork.peers).filter(
          (peer) =>
            peer.peerID !== NetworkState.worldNetwork.hostPeerID &&
            peer.userId !== userId &&
            !friendState.relationships.value.find(
              (item) => item.relatedUserId === peer.userId && item.userRelationshipType === 'friend'
            ) &&
            !friendState.relationships.value.find(
              (item) => item.relatedUserId === peer.userId && item.userRelationshipType === 'pending'
            ) &&
            !friendState.relationships.value.find(
              (item) => item.relatedUserId === peer.userId && item.userRelationshipType === 'blocked'
            ) &&
            !friendState.relationships.value.find(
              (item) => item.relatedUserId === peer.userId && item.userRelationshipType === 'blocking'
            )
        )
      : []
    displayList.push(
      ...cloneDeep(layerPeers).map((peer) => {
        return { id: peer.userId, name: userNames[peer.userId] }
      })
    )

    displayList.forEach((peer) => {
      if (
        friendState.relationships.value.find(
          (item) => item.relatedUserId === peer.id && item.userRelationshipType === 'requested'
        )
      )
        peer.relationType = 'requested'
    })
  }

  const settingTabs = [
    { value: 'find', label: t('user:friends.find') },
    { value: 'friends', label: t('user:friends.friends') },
    { value: 'messages', label: t('user:friends.messages') },
    { value: 'blocked', label: t('user:friends.blocked') }
  ]

  const Friend = (props: { user: DisplayedUserInterface }) => {
    const { user } = props
    const thumbnail = useUserAvatarThumbnail(user.id as UserID)
    return (
      <Box key={user.id} display="flex" alignItems="center" m={2} gap={1.5}>
        <Avatar alt={user.name} imageSrc={thumbnail} size={50} />

        <Text flex={1}>{user.name}</Text>

        {user.relationType === 'friend' && (
          <IconButton
            icon={<Icon type="Message" sx={{ height: 30, width: 30 }} />}
            title={t('user:friends.message')}
            onClick={() => handleOpenChat(user.id)}
          />
        )}

        {user.relationType === 'pending' && (
          <>
            <Chip className={commonStyles.chip} label={t('user:friends.pending')} size="small" variant="outlined" />

            <IconButton
              icon={<Icon type="Check" sx={{ height: 30, width: 30 }} />}
              title={t('user:friends.accept')}
              onClick={() => FriendService.acceptFriend(userId, user.id)}
            />

            <IconButton
              icon={<Icon type="Close" sx={{ height: 30, width: 30 }} />}
              title={t('user:friends.decline')}
              onClick={() => FriendService.declineFriend(userId, user.id)}
            />
          </>
        )}

        {user.relationType === 'requested' && (
          <Chip className={commonStyles.chip} label={t('user:friends.requested')} size="small" variant="outlined" />
        )}

        {user.relationType === 'blocking' && (
          <IconButton
            icon={<Icon type="HowToReg" sx={{ height: 30, width: 30 }} />}
            title={t('user:friends.unblock')}
            onClick={() => FriendService.unblockUser(userId, user.id)}
          />
        )}

        {selectedTab.value === 'messages' ? (
          <IconButton
            icon={
              <Icon
                type={channelState.targetChannelId.value === user.id.toString() ? 'CallEnd' : 'Call'}
                sx={{ height: 30, width: 30 }}
              />
            }
            title={t('user:friends.call')}
            onClick={() => startMediaCall(user.id.toString() as ChannelID)}
          />
        ) : (
          <IconButton
            icon={<Icon type="AccountCircle" sx={{ height: 30, width: 30 }} />}
            title={t('user:friends.profile')}
            onClick={() => handleProfile(user)}
          />
        )}
      </Box>
    )
  }

  return (
    <Menu
      open
      header={<Tabs value={selectedTab.value} items={settingTabs} onChange={handleTabChange} />}
      onBack={() => PopupMenuServices.showPopupMenu(UserMenus.Profile)}
      onClose={() => PopupMenuServices.showPopupMenu()}
    >
      <Box className={styles.menuContent}>
        {displayList.length > 0 && displayList.map((value) => <Friend user={value} />)}
        {displayList.length === 0 && (
          <Text align="center" mt={4} variant="body2">
            {t('user:friends.noUsers')}
          </Text>
        )}
      </Box>
    </Menu>
  )
}

export default FriendsMenu
