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

export function wait(ms: number): void {
  const date = Date.now()
  let currentDate: any = null!
  do {
    currentDate = Date.now()
  } while (currentDate - date < ms)
}
export function waitS(seconds: number): void {
  wait(seconds * 1000)
}

export function isNumber(value: string | number): boolean {
  return value != null && value !== '' && !isNaN(Number(value.toString()))
}

export function combine(first, second, third) {
  const res: any[] = []

  for (let i = 0; i < first.length; i++) res.push(first[i])
  for (let i = 0; i < second.length; i++) res.push(second[i])
  for (let i = 0; i < third.length; i++) res.push(third[i])

  return res
}
export function combineArrays(arrays: [[]]) {
  const res = []

  for (let i = 0; i < arrays.length; i++) {
    for (let j = 0; j < arrays[i].length; j++) {
      res.push(arrays[i][j])
    }
  }

  return res
}

export function arraysAreEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }

  return true
}

export function pathJoin(...parts: string[]): string {
  const separator = '/'

  return parts
    .map((part, index) => {
      // If it's the first part, we only want to remove trailing slashes
      if (index === 0) {
        while (part.endsWith(separator)) {
          part = part.substring(0, part.length - 1)
        }
      }
      // If it's the last part, we only want to remove leading slashes
      else if (index === parts.length - 1) {
        if (part) {
          while (part.startsWith(separator)) {
            part = part.substring(1)
          }
        }
      }
      // For all other parts, remove leading and trailing slashes
      else {
        if (part) {
          while (part.startsWith(separator)) {
            part = part.substring(1)
          }
          while (part.endsWith(separator)) {
            part = part.substring(0, part.length - 1)
          }
        }
      }

      return part
    })
    .join(separator)
}

export function baseName(path: string): string {
  return path.split(/[\\/]/).pop()!
}

export function relativePathTo(src: string, dst: string): string {
  const normalizePath = (path: string) => {
    const trimmedPath = path.replace(/^\.\//, '').replace(/\/$/, '')
    return trimmedPath.split('/').filter(Boolean)
  }

  const srcSegments = normalizePath(src)
  const dstSegments = normalizePath(dst)
  let commonIndex = 0

  while (
    srcSegments[commonIndex] === dstSegments[commonIndex] &&
    commonIndex < Math.min(srcSegments.length, dstSegments.length)
  ) {
    commonIndex++
  }

  let relativePathArray: string[] = []
  for (let i = commonIndex; i < srcSegments.length; i++) {
    relativePathArray.push('..')
  }

  relativePathArray = relativePathArray.concat(dstSegments.slice(commonIndex))

  if (relativePathArray.length === 0) {
    return '.'
  }

  return relativePathArray.join('/')
}

/**
 * Converts a string to title case. For example, "hello world" becomes "Hello World".
 * Reference: https://stackoverflow.com/a/196991
 * @param source
 * @returns
 */
export const toCapitalCase = (source: string) => {
  return source.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}
