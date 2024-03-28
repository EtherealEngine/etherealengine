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

// https://stackoverflow.com/a/11150727
export const getDateTimeSql = async () => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export const toDateTimeSql = (date: Date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

// https://stackoverflow.com/a/11150727
export const fromDateTimeSql = (date: string) => {
  let dateObj: Date
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }
  return (
    dateObj.getFullYear() +
    '-' +
    ('00' + (dateObj.getMonth() + 1)).slice(-2) +
    '-' +
    ('00' + dateObj.getDate()).slice(-2) +
    'T' +
    ('00' + dateObj.getHours()).slice(-2) +
    ':' +
    ('00' + dateObj.getMinutes()).slice(-2) +
    ':' +
    ('00' + dateObj.getSeconds()).slice(-2) +
    '.000Z'
  )
}

export const convertDateTimeSqlToLocal = (dateSql: string) => {
  const date = new Date(dateSql)

  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const timeAgo = (date: Date) => {
  const now = Date.now()

  const difference = now - date.getTime()

  const seconds = Math.floor(difference / 1000) % 60
  const minutes = Math.floor(difference / (1000 * 60)) % 60
  const hours = Math.floor(difference / (1000 * 60 * 60)) % 24
  const days = Math.floor(difference / (1000 * 60 * 60 * 24))

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
  if (seconds > 0) {
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }

  return ''
}
