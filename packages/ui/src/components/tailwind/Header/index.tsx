import { EllipsisHorizontalIcon, UserCircleIcon } from '@heroicons/react/20/solid'
import React from 'react'

import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'

// import ThemeSwitcher from '@etherealengine/ui/src/components/tailwind/ThemeSwitcher'

const Header = () => {
  const authState = useHookstate(getMutableState(AuthState))
  const { user } = authState
  const avatarDetails = user?.avatar?.value
  return (
    <nav className="w-full navbar">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl">Ethereal Capture</a>
      </div>
      <div className="navbar-end">
        {/* <label htmlFor="capture-drawer" className="btn btn-square btn-ghost drawer-button">
          <EllipsisHorizontalIcon className="w-6 h-6" />
        </label>
        <ThemeSwitcher /> */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost rounded-btn">
            <span className="mr-1">{user?.name?.value}</span>
            <div className="avatar">
              <div className="w-8 rounded-full">
                {avatarDetails.thumbnailResource?.url ? (
                  <img src={avatarDetails.thumbnailResource?.url} className="w-auto h-8" />
                ) : (
                  <UserCircleIcon className="w-8 h-8" />
                )}
              </div>
            </div>
          </label>
          <ul tabIndex={0} className="menu dropdown-content p-2 shadow bg-base-100 rounded-box w-52 mt-4">
            <li>
              <a href="/" target="_blank">
                Sign in
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

Header.displayName = 'Header'

Header.defaultProps = {}

export default Header
