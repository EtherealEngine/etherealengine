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

import { Box3, BufferAttribute, BufferGeometry, InterleavedBufferAttribute } from 'three'
// @ts-ignore
import { MeshBVH } from 'three-mesh-bvh'
import Worker from 'web-worker'

import { isClient } from '../functions/getEnvironment'

export class GenerateMeshBVHWorker {
  running: boolean
  worker: Worker

  constructor() {
    this.running = false

    if (isClient) {
      // module workers currently don't work in safari and firefox
      this.worker = new Worker('/workers/generateBVHAsync.worker.js')
    } else {
      this._serverWorker()
    }
  }

  _serverWorker() {
    const path = require('path')
    const workerPath = path.resolve(__dirname, './generateBVHAsync.register.js')
    this.worker = new Worker(workerPath, { type: 'module' })
  }

  generate(geometry: BufferGeometry, options = {}) {
    if (this.running) {
      throw new Error('GenerateMeshBVHWorker: Already running job.')
    }

    const { worker } = this
    this.running = true

    return new Promise<MeshBVH>((resolve, reject) => {
      worker.onmessage = (e) => {
        this.running = false
        worker.onmessage = null
        const { serialized, position, error } = e.data

        if (error) {
          reject(new Error(error))
        } else {
          // MeshBVH uses generated index instead of default geometry index
          geometry.setIndex(new BufferAttribute(serialized.index, 1))

          const bvh = MeshBVH.deserialize(serialized, geometry)
          const boundsOptions = Object.assign(
            {
              setBoundingBox: true
            },
            options
          )

          if (boundsOptions.setBoundingBox) {
            geometry.boundingBox = bvh.getBoundingBox(new Box3())
          }

          resolve(bvh)
        }
      }

      if (!geometry.attributes.position) reject(new Error('Missing position attribute'))

      const index = geometry.index ? Uint32Array.from(geometry.index.array) : null
      const position = Float32Array.from(
        (geometry.attributes.position as BufferAttribute | InterleavedBufferAttribute).array
      )

      const transferrables = [position as ArrayLike<number>]
      if (index) {
        transferrables.push(index as ArrayLike<number>)
      }

      worker.postMessage(
        {
          index,
          position,
          options
        },
        transferrables.map((arr: any) => arr.buffer)
      )
    })
  }

  terminate() {
    this.worker.terminate()
  }
}
