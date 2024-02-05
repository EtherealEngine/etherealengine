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

import { UserCircleIcon } from '@heroicons/react/20/solid'
import React from 'react'

import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { State, getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '../../../primitives/tailwind/Button'

// import ThemeSwitcher from '@etherealengine/ui/src/components/tailwind/ThemeSwitcher'

const Header = (props: { mode: State<'playback' | 'capture'> }) => {
  const authState = useHookstate(getMutableState(AuthState))
  const { user } = authState
  const avatarDetails = user?.avatar?.value
  return (
    <nav className="relative w-full navbar">
      <label tabIndex={0} className="absolute top-0 right-0">
        <span className="mr-1">{user?.name?.value}</span>
        <div className="avatar">
          <div className="w-auto h-[60px] rounded-full">
            {avatarDetails?.thumbnailResource?.url ? (
              <img
                src={avatarDetails.thumbnailResource?.url}
                crossOrigin="anonymous"
                className="w-auto h-[60px] rounded-full"
              />
            ) : (
              <UserCircleIcon className="w-auto h-[120px] rounded-full" />
            )}
          </div>
        </div>
      </label>
      <div className="flex-1">
        <a className="normal-case text-xl">Ethereal Capture</a>
      </div>
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <Button
            className="pointer-events-auto w-[200px] h-[30px] bg-[#292D3E] rounded-full shadow-md text-center font=[lato] font-bold text-sm m-2"
            title={'capture/playback'}
            onClick={() => props.mode.set(props.mode.value === 'playback' ? 'capture' : 'playback')}
          >
            <a className="normal-case text-l">
              {props.mode.value === 'playback' ? 'Switch to capture mode' : 'Switch to playback mode'}
            </a>
          </Button>
        </div>
      </div>
    </nav>
  )
}

Header.displayName = 'Header'

Header.defaultProps = {
  mode: { value: 'capture', set: () => {} } as any as State<'playback' | 'capture'>
}

export default Header
