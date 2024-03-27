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

import assert from 'assert'

import { Engine, destroyEngine } from '@etherealengine/ecs/src/Engine'

import { UserID, identityProviderPath, locationPath } from '@etherealengine/common/src/schema.type.module'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import { getState } from '@etherealengine/hyperflux'
import { Application } from '@etherealengine/server-core/declarations'
import appRootPath from 'app-root-path'
import { ChildProcess } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import { StartTestFileServer } from '../../server-core/src/createFileServer'
import { onConnection } from '../src/channels'
import { start } from '../src/start'

describe('InstanceLoad', () => {
  before(async () => {
    const child: ChildProcess = require('child_process').spawn('npm', ['run', 'dev-agones'], {
      cwd: appRootPath.path,
      stdio: 'inherit',
      detached: true
    })

    process.on('exit', async () => {
      process.kill(-child.pid!, 'SIGINT')
    })

    const app = await start()
    await app.setup()
    StartTestFileServer()
  })

  it('should load location', async () => {
    const app = Engine.instance.api as Application
    const loadLocation = onConnection(app)

    const type = 'guest'
    const token = uuidv4()

    const createdIdentityProvider = await app.service(identityProviderPath).create({
      type,
      token,
      userId: '' as UserID
    })

    const skyStationScene = await app.service(locationPath).find({
      query: {
        slugifiedName: 'sky-station'
      }
    })

    const query = {
      provider: 'test',
      headers: {},
      socketQuery: {
        token: createdIdentityProvider.accessToken,
        locationId: skyStationScene.data[0].id,
        instanceID: '',
        channelId: '',
        roomCode: '',
        address: '',
        port: 0,
        EIO: '',
        transport: '',
        t: ''
      },
      instanceId: '',
      channelId: undefined
    } as any

    await loadLocation(query)

    assert.equal(getState(SceneState).sceneLoaded, true)
  })

  after(() => {
    return destroyEngine()
  })
})
