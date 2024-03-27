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

import { Object3DUtils } from '@etherealengine/common/src/utils/Object3DUtils'
import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import { Entity } from '@etherealengine/ecs'
import * as THREE from 'three'
import { Euler, Matrix4, Object3D, Quaternion, Scene, SkinnedMesh, Vector2, Vector3, Vector4 } from 'three'

//@ts-ignore
Vector3.prototype.toJSON = function () {
  return { x: this.x, y: this.y, z: this.z }
}
//@ts-ignore
Vector2.prototype.toJSON = function () {
  return { x: this.x, y: this.y }
}

//@ts-ignore
Quaternion.prototype.toJSON = function () {
  return { x: this._x, y: this._y, z: this._z, w: this._w }
}

// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
const opmu = 1.90110745351730037
const u = new Float32Array(8)
const v = new Float32Array(8)
const bT = new Float32Array(8)
const bD = new Float32Array(8)

for (let i = 0; i < 7; ++i) {
  const s = i + 1.0
  const t = 2.0 * s + 1.0
  u[i] = 1.0 / (s * t)
  v[i] = s / t
}

u[7] = opmu / (8.0 * 17.0)
v[7] = (opmu * 8.0) / 17.0

/**
 * Computes the spherical linear interpolation or extrapolation at t using the provided quaternions.
 * This implementation is faster than {@link Quaternion#slerp}, but is only accurate up to 10<sup>-6</sup>.
 *
 * @param {Quaternion} target The value corresponding to t at 1.0.
 * @param {number} t The point along t at which to interpolate.
 * @returns {Quaternion} Returns the quaternion being
 */

const fastSlerp = function (target: Quaternion, t: number) {
  let x = this.x * target.x + this.y * target.y + this.z * target.z + this.w * target.w

  let sign
  if (x >= 0) {
    sign = 1.0
  } else {
    sign = -1.0
    x = -x
  }

  const xm1 = x - 1.0
  const d = 1.0 - t
  const sqrT = t * t
  const sqrD = d * d

  for (let i = 7; i >= 0; --i) {
    bT[i] = (u[i] * sqrT - v[i]) * xm1
    bD[i] = (u[i] * sqrD - v[i]) * xm1
  }

  const cT =
    sign *
    t *
    (1.0 +
      bT[0] *
        (1.0 + bT[1] * (1.0 + bT[2] * (1.0 + bT[3] * (1.0 + bT[4] * (1.0 + bT[5] * (1.0 + bT[6] * (1.0 + bT[7]))))))))
  const cD =
    d *
    (1.0 +
      bD[0] *
        (1.0 + bD[1] * (1.0 + bD[2] * (1.0 + bD[3] * (1.0 + bD[4] * (1.0 + bD[5] * (1.0 + bD[6] * (1.0 + bD[7]))))))))

  this.x = target.x * cT + this.x * cD
  this.y = target.y * cT + this.y * cD
  this.z = target.z * cT + this.z * cD
  this.w = target.w * cT + this.w * cD

  return this
}

Quaternion.prototype.fastSlerp = fastSlerp

//@ts-ignore
Euler.prototype.toJSON = function () {
  return { x: this._x, y: this._y, z: this._z, order: this._order }
}

declare module 'three/src/core/Object3D' {
  export interface Object3D {
    matrixWorldAutoUpdate: boolean
    entity: Entity
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    add(...object: Object3D[]): this
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    parent: Object3D | null
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    children: Object3D[]
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    removeFromParent(): this
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    remove(...object: Object3D[]): this
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    clear(): this
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    attach(object: Object3D): this
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    traverse(callback: (object: Object3D) => void): void
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    traverseVisible(callback: (object: Object3D) => void): void
    /** @deprecated use ECS hierarchy instead [#9308](https://github.com/EtherealEngine/etherealengine/issues/9308) */
    traverseAncestors(callback: (object: Object3D) => void): void
  }
}

declare module 'three/src/math/Quaternion' {
  export interface Quaternion {
    fastSlerp: typeof fastSlerp
  }
}

Scene.DEFAULT_MATRIX_AUTO_UPDATE = false

/**
 * Since we have complete control over matrix updates, we know that at any given point
 *  in execution time if the matrix will be up to date or a frame late, and we can simply
 *  grab the data we need from the world matrix
 */
Object3D.prototype.getWorldPosition = function (target) {
  return Object3DUtils.getWorldPosition(this, target)
}

Object3D.prototype.getWorldQuaternion = function (target) {
  return Object3DUtils.getWorldQuaternion(this, target)
}

Object3D.prototype.getWorldScale = function (target) {
  return Object3DUtils.getWorldScale(this, target)
}

Object3D.prototype.getWorldDirection = function (target) {
  const e = this.matrixWorld.elements
  return target.set(e[8], e[9], e[10]).normalize()
}

const _basePosition = /*@__PURE__*/ new Vector3()

const _skinIndex = /*@__PURE__*/ new Vector4()
const _skinWeight = /*@__PURE__*/ new Vector4()

const _vector3 = /*@__PURE__*/ new Vector3()
const _matrix4 = /*@__PURE__*/ new Matrix4()

SkinnedMesh.prototype.applyBoneTransform = function (index, vector) {
  const skeleton = this.skeleton
  const geometry = this.geometry

  _skinIndex.fromBufferAttribute(geometry.attributes.skinIndex, index)
  _skinWeight.fromBufferAttribute(geometry.attributes.skinWeight, index)

  _basePosition.copy(vector).applyMatrix4(this.bindMatrix)

  vector.set(0, 0, 0)

  for (let i = 0; i < 4; i++) {
    const weight = _skinWeight.getComponent(i)

    if (weight !== 0) {
      const boneIndex = _skinIndex.getComponent(i)

      /** this is the line added */
      if (!skeleton.bones[boneIndex]) continue

      _matrix4.multiplyMatrices(skeleton.bones[boneIndex].matrixWorld, skeleton.boneInverses[boneIndex])

      vector.addScaledVector(_vector3.copy(_basePosition).applyMatrix4(_matrix4), weight)
    }
  }

  return vector.applyMatrix4(this.bindMatrixInverse)
}

globalThis.THREE = { ...THREE } as any

if (!isClient) {
  const { Blob } = require('buffer')
  const fetch = require('node-fetch')

  globalThis.fetch = fetch
  globalThis.Request = fetch.Request
  globalThis.Response = fetch.Response
  globalThis.Headers = fetch.Headers
  globalThis.self = globalThis as Window & typeof globalThis

  // this will be added in node 19
  if (!globalThis.URL.createObjectURL) globalThis.URL.createObjectURL = (blob) => null!
  if (!globalThis.Blob) globalThis.Blob = Blob

  const _localStorage = {}
  if (!globalThis.localStorage)
    globalThis.localStorage = {
      setItem: (key, val) => {
        _localStorage[key] = val
      },
      getItem: (key) => {
        return _localStorage[key] ?? null
      }
    } as Storage

  // patches for headless-gl - currently unused

  //@ts-ignore
  THREE.TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {}

  // patch navigator
  if (!globalThis.navigator)
    (globalThis as any).navigator = {
      product: 'NativeScript', // patch axios so it doesnt complain,
      userAgent: 'node'
    }
  /*
  
  // todo: move this out of module scope
  function addEventListener(event, func, bind_) {}
  
  // patch window prop for three
  if (!globalThis.window) (globalThis as any).window = {}
  Object.assign((globalThis as any).window, {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener,
    URL
  })
  
  class Image {}
  
  // patch three ImageLoader
  if (!globalThis.document) (globalThis as any).document = {}
  Object.assign((globalThis as any).document, {
    createElement: (type, ...args) => {
      switch (type) {
        case 'div': // patch for sinon
        default:
          return
      }
    },
    URL,
    createElementNS: (ns, type) => {
      if (type === 'img') {
        const img = new Image() as any
        img.addEventListener = (type, handler) => {
          img['on' + type] = handler.bind(img)
        }
        img.removeEventListener = (type) => {
          img['on' + type] = null
        }
        return img
      }
    }
  })
  */
}
