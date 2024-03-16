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

interface BufferMetaData {
  start: number
  end: number
  fetchTime: number
  pending: boolean
}

class BufferData {
  public _data: BufferMetaData[] = []
  public _maxGap = 0

  constructor(data: any[] = [], maxGap = 0) {
    this._data = data
    this._maxGap = maxGap
  }

  lower_bound(startValue: number) {
    let start = 0
    let end = this._data.length - 1

    let result = this._data.length

    while (start <= end) {
      const pivot = Math.floor((start + end) / 2)
      if (this._data[pivot].start <= startValue) {
        result = pivot
        start = pivot + 1
      } else {
        end = pivot - 1
      }
    }
    return result
  }

  upper_bound(endValue: number) {
    let start = 0
    let end = this._data.length - 1

    let result = this._data.length

    while (start <= end) {
      const pivot = Math.floor((start + end) / 2)
      if (this._data[pivot].end > endValue) {
        result = pivot
        end = pivot - 1
      } else {
        start = pivot + 1
      }
    }
    return result
  }

  updateEnd(insertIndex: number) {
    let index = insertIndex + 1
    while (index < this._data.length && this._data[insertIndex].end + this._maxGap >= this._data[index].start) {
      this._data[insertIndex].end = Math.max(this._data[insertIndex].end, this._data[index].end)
      this._data[insertIndex].fetchTime = this._data[insertIndex].fetchTime + this._data[index].fetchTime
      this._data[insertIndex].pending = this._data[insertIndex].pending || this._data[index].pending
      index++
    }
    this._data.splice(insertIndex + 1, index - insertIndex - 1)
  }

  addData(newStart: number, newEnd: number, fetchTime: number, pending: boolean) {
    const position = this.lower_bound(newStart)

    if (position === this._data.length) {
      this._data.unshift({ start: newStart, end: newEnd, fetchTime, pending })
      this.updateEnd(0)
    } else {
      if (this._data[position].start === newStart) {
        if (this._data[position].end >= newEnd) {
          // do nothing
        } else {
          this._data[position].end = newEnd
          this._data[position].fetchTime = this._data[position].fetchTime + fetchTime
          this._data[position].pending = this._data[position].pending || pending
          this.updateEnd(position)
        }
      } else {
        if (this._data[position].end > newStart) {
          if (this._data[position].end >= newEnd) {
            // do nothing
          } else {
            this._data[position].end = newEnd
            this._data[position].fetchTime = this._data[position].fetchTime + fetchTime
            this._data[position].pending = this._data[position].pending || pending
            this.updateEnd(position)
          }
        } else if (this._data[position].end === newStart || newStart - this._data[position].end <= this._maxGap) {
          this._data[position].end = Math.max(this._data[position].end, newEnd)
          this._data[position].fetchTime = this._data[position].fetchTime + fetchTime
          this._data[position].pending = this._data[position].pending || pending
          this.updateEnd(position)
        } else {
          this._data.splice(position + 1, 0, { start: newStart, end: newEnd, fetchTime, pending })
          this.updateEnd(position + 1)
        }
      }
    }
  }

  removeData(indices: number[] = []) {
    const newData = this._data.filter((_, index) => !indices.includes(index))
    this._data = newData
  }
}
