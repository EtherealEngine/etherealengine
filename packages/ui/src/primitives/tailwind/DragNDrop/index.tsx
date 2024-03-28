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
import { ItemTypes } from '@etherealengine/editor/src/constants/AssetTypes'
import React from 'react'
import { DndProvider, DropTargetMonitor, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { twMerge } from 'tailwind-merge'

export interface DragNDropProps extends React.HTMLAttributes<HTMLDivElement> {
  acceptInput?: boolean
  className?: string
  children?: React.ReactNode
  externalChildren?: React.ReactNode // outside label element
  acceptedDropTypes: string[]
  onDropEvent: (files: File[]) => void
}

const DragNDrop = ({
  className,
  children,
  externalChildren,
  acceptedDropTypes,
  onDropEvent,
  ...props
}: DragNDropProps) => {
  const twClassName = twMerge(
    'bg-secondary flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-4',
    className
  )
  const [_, drop] = useDrop(
    () => ({
      accept: ItemTypes.File,
      multiple: false,
      canDrop: () => !!props.acceptInput,
      drop(item: { files: any[] }) {
        if (item.files.length !== 1) return
        const extn = item.files[0].name.split('.').pop()
        if (acceptedDropTypes.includes(extn)) {
          onDropEvent(item.files)
        }
      },
      collect: (monitor: DropTargetMonitor) => {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop()
        }
      }
    }),
    [props]
  )
  return (
    <div className={twClassName} {...props} ref={drop}>
      <label className="flex h-full w-full cursor-pointer items-center justify-center">
        {children}
        {props.acceptInput && (
          <input
            onChange={(event) => {
              event.preventDefault()
              if (event.target.files) {
                onDropEvent(Array.from(event.target.files))
              }
            }}
            type="file"
            className="hidden"
          />
        )}
      </label>
      {externalChildren}
    </div>
  )
}

const DragNDropWrapper = (props: DragNDropProps) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <DragNDrop {...props} />
    </DndProvider>
  )
}

export default DragNDropWrapper
