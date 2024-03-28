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

import { UserType } from '@etherealengine/common/src/schema.type.module'
import React from 'react'
import { MdEmail } from 'react-icons/md'
import {
  RiDiscordFill,
  RiFacebookBoxFill,
  RiGithubFill,
  RiGoogleFill,
  RiMessage2Line,
  RiTwitterFill
} from 'react-icons/ri'

export default function AccountIdentifiers({ user }: { user: UserType }) {
  const discordIp = user.identityProviders.find((ip) => ip.type === 'discord')
  const googleIp = user.identityProviders.find((ip) => ip.type === 'google')
  const facebookIp = user.identityProviders.find((ip) => ip.type === 'facebook')
  const twitterIp = user.identityProviders.find((ip) => ip.type === 'twitter')
  const linkedinIp = user.identityProviders.find((ip) => ip.type === 'linkedin')
  const githubIp = user.identityProviders.find((ip) => ip.type === 'github')
  const emailIp = user.identityProviders.find((ip) => ip.type === 'email')
  const smsIp = user.identityProviders.find((ip) => ip.type === 'sms')

  return (
    <div className="flex items-center gap-2">
      {discordIp ? <RiDiscordFill className="h-6 w-6" /> : null}
      {googleIp ? <RiGoogleFill className="h-6 w-6" /> : null}
      {facebookIp ? <RiFacebookBoxFill className="h-6 w-6" /> : null}
      {twitterIp ? <RiTwitterFill className="h-6 w-6" /> : null}
      {linkedinIp ? <RiTwitterFill className="h-6 w-6" /> : null}
      {githubIp ? <RiGithubFill className="h-6 w-6" /> : null}
      {smsIp ? <RiMessage2Line className="h-6 w-6" /> : null}
      {emailIp ? <MdEmail className="h-6 w-6" /> : null}
    </div>
  )
}
