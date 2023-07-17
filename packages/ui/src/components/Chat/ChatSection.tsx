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

import React, { useEffect, useRef, useState } from 'react'

import { useUserAvatarThumbnail } from '@etherealengine/client-core/src/user/functions/useUserAvatarThumbnail'
import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'

import NotificationIcon from './assets/attach-file2.svg'
import BoxSearch from './assets/bxbxsearchalt2.svg'
import AddSquare from './assets/fluentaddsquare24filled.svg'
import SettingIcon from './assets/setting.svg'
// import { FriendsList } from './FriendsList'
// import { GroupsList } from './GroupsList'
// import { WorldsList } from './WorldsList'
import { ChannelsList } from './ChannelsList'
import { Create } from './Create'

const ChatTypes = ['Channels'] as const

/**
 * Chat
 */
export const ChatSection = () => {
  const userName = useHookstate(getMutableState(AuthState).user.name).value
  const userThumbnail = useUserAvatarThumbnail(Engine.instance.userId)
  const currentChatType = useHookstate<(typeof ChatTypes)[number]>('Channels')

  const [checked, setChecked] = useState<boolean>(false)

  const handleToggle = () => {
    setChecked(!checked)
  }

  const [isToggleOn, setIsToggleOn] = useState<boolean>(false)

  const switchToggle = () => {
    setIsToggleOn(!isToggleOn)
  }

  const [isModalOpen, setIsModalOpen] = useState<number | null>(null)
  const openModal = (modalId: number) => {
    setIsModalOpen(modalId)
  }

  const closeModal = () => {
    setIsModalOpen(null)
  }

  const modalRef = useRef<HTMLDivElement | null>(null)
  const handleOutsideClick = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      closeModal()
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    } else {
      document.removeEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isModalOpen])

  return (
    <div className="w-[320px] h-[100vh] [background:linear-gradient(180deg,_#e3e5e8,_#f2f3f5_6.7%,_#f2f3f5_94.1%,_#e3e5e8)]">
      <div className="w-full h-[90px] flex flex-wrap gap-[92px] justify-center">
        <div className="mt-6">
          <b className="text-3xl">Chats</b>
        </div>
        <div className="flex justify-center gap-2">
          <button className="">
            <img className="w-6 h-6 overflow-hidden" alt="" src={NotificationIcon} />
          </button>
          <button className="">
            <img className="w-6 h-6 overflow-hidden" alt="" src={BoxSearch} />
          </button>
          <button onClick={() => openModal(1)}>
            <img className="w-6 h-6 overflow-hidden" alt="" src={AddSquare} />
            {isModalOpen === 1 && (
              <div
                ref={modalRef}
                className="fixed w-full h-[100vh] inset-0 flex bg-black  items-center justify-center bg-opacity-50"
                style={{ zIndex: '1' }}
              >
                <Create />
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="box-border w-[320px] border-t-[1px] border-solid border-[#D1D3D7]" />
      {/* <div className="w-full flex flex-wrap justify-start ml-8 mt-4 my-4 gap-[9px]">
        {ChatTypes.map((item, index) => {
          return (
            <button
              key={index}
              className={`cursor-pointer rounded-[20px] border-dashed box-border border-[1px] p-0 border-[#A0A0B2] w-[76px] h-6 ${currentChatType.value === item ? 'bg-[#3F3960] text-white' : 'text-[#A0A0B2]'
                }`}
              onClick={() => currentChatType.set(item)}
            >
              <div className={`[text-align-last:center] rounded-xl text-sm font-segoe-ui text-left`}>{item}</div>
            </button>
          )
        })}
      </div> */}
      <div className="box-border w-[320px] border-t-[1px] border-solid border-[#D1D3D7]" />

      <ChannelsList />
      {/* {currentChatType.value === 'Groups' && <GroupsList />} */}
      {/* {currentChatType.value === 'Friends' && <FriendsList />}
      {currentChatType.value === 'Worlds' && <WorldsList />} */}
      <div className="absolute bottom-0 w-[320px] h-[70px] gap-4 flex flex-wrap justify-center bg-[#ECECEC]">
        <img className="rounded-[38px] mt-3 w-11 h-11 object-cover" alt="" src={userThumbnail} />
        <div className="mt-3">
          <p className="font-bold text-[#3F3960]">{userName}</p>
          <div className="flex flex-wrap gap-1">
            <div className={`${isToggleOn ? 'bg-[#57C290]' : 'bg-[#b3b5b9]'} rounded-[50%] mt-[4.2px] w-2.5 h-2.5`} />
            <p className="h-4 text-xs text-[#787589]">Active now</p>
          </div>
        </div>
        <label className="cursor-pointer mt-[24px]">
          <div className="relative">
            <input
              type="checkbox"
              className="hidden"
              checked={checked}
              onChange={handleToggle}
              onClick={switchToggle}
            />
            <div
              className={`toggle__line w-10 h-5  rounded-full shadow-inner ${checked ? 'bg-[#3F3960]' : 'bg-gray-400'}`}
            ></div>
            <div
              className={`toggle__dot absolute w-4 h-4 bg-white rounded-full shadow inset-y-[2px] inset-x-[2px] ${
                checked ? 'translate-x-5' : ''
              }`}
            ></div>
          </div>
        </label>
        <button className="">
          <img className="w-6 h-6 overflow-hidden" alt="" src={SettingIcon} />
        </button>
      </div>
    </div>
  )
}
