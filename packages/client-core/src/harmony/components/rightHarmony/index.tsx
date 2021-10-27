import React, { useState, useRef, useEffect } from 'react'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import IconButton from '@mui/material/IconButton'
import Call from '@mui/icons-material/Call'
import MoreHoriz from '@mui/icons-material/MoreHoriz'
import { useStyle, useStyles } from './style'
import InviteHarmony from '../inviteHarmony'
import Person from '@mui/icons-material/Person'
import ListItemText from '@mui/material/ListItemText'
import { useDispatch } from '../../../store'
import { ChatService } from '../../../social/state/ChatService'
import { useChatState } from '../../../social/state/ChatService'
import { useAuthState } from '../../../user/state/AuthService'
import { useUserState } from '../../../user/state/UserService'
import { ChatAction } from '../../../social/state/ChatService'

import CreateMessage from './CreateMessage'
import MessageList from './MessageList'

export default function RightHarmony() {
  const classex = useStyle()
  const classes = useStyles()
  const dispatch = useDispatch()
  const userState = useUserState()
  const [openInvite, setOpenInvite] = React.useState(false)
  const messageRef = React.useRef()
  const messageEl = messageRef.current
  const selfUser = useAuthState().user
  const chatState = useChatState()
  const targetObject = chatState.targetObject
  const targetObjectType = chatState.targetObjectType
  const channelState = chatState.channels
  const channels = channelState.channels.value
  const channelEntries = Object.values(channels).filter((channel) => !!channel)!
  const targetChannelId = chatState.targetChannelId.value
  const activeChannel = channels[targetChannelId]
  const channelRef = useRef(channels)
  const openInviteModel = (open: boolean) => {
    setOpenInvite(open)
  }

  useEffect(() => {
    if (channelState.updateNeeded.value === true) {
      ChatService.getChannels()
    }
  }, [channelState.updateNeeded.value])

  useEffect(() => {
    channelRef.current = channels
    channelEntries.forEach((channel) => {
      if (chatState.updateMessageScroll.value === true) {
        dispatch(ChatAction.setUpdateMessageScroll(false))
        if (
          channel?.id === targetChannelId &&
          messageEl != null &&
          (messageEl as any).scrollHeight -
            (messageEl as any).scrollTop -
            (messageEl as any).firstElementChild?.offsetHeight <=
            (messageEl as any).clientHeight + 20
        ) {
          ;(messageEl as any).scrollTop = (messageEl as any).scrollHeight
        }
      }
      if (channel?.updateNeeded != null && channel?.updateNeeded === true) {
        ChatService.getChannelMessages(channel.id)
      }
    })
  }, [channels])

  return (
    <div className={classes.rightRoot}>
      <div className={classes.title}>
        {activeChannel?.instance && (
          <ListItemAvatar>
            <Person />
          </ListItemAvatar>
        )}
        {activeChannel?.instance && (
          <ListItemText
            className={classes.listText}
            primary={activeChannel?.instance?.instanceUsers[0].name}
            secondary={<React.Fragment>{'online'}</React.Fragment>}
          />
        )}
        <div style={{ marginRight: '1.5rem' }}>
          <IconButton size="large">
            <Call className={classes.whiteIcon} />
          </IconButton>
          <IconButton onClick={() => openInviteModel(true)} size="large">
            <MoreHoriz className={classes.whiteIcon} />
          </IconButton>
        </div>
      </div>
      {activeChannel?.messages?.length > 0 && (
        <MessageList
          targetObjectType={targetObjectType}
          targetObject={targetObject}
          activeChannel={activeChannel}
          selfUser={selfUser}
          targetChannelId={targetChannelId}
        />
      )}
      {!(activeChannel?.messages?.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', height: '70%' }}>
          <div className={classes.firstMessagePlaceholder}>
            {targetObjectType.value === 'group' ? 'Create a group to start a chat within  ' : 'Start a chat with  '}
            {targetObjectType.value === 'user' || targetObjectType.value === 'group'
              ? targetObjectType.value
              : targetObjectType.value === 'instance'
              ? 'your current layer'
              : 'your current party'}
          </div>
        </div>
      )}
      <div style={{ position: 'fixed', bottom: '0' }}>
        <CreateMessage />
      </div>

      <InviteHarmony open={openInvite} handleClose={openInviteModel} />
    </div>
  )
}
