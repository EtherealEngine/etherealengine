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

import React, { ReactNode } from 'react'
import { GoChevronLeft, GoChevronRight } from 'react-icons/go'
import { HiFastForward, HiRewind } from 'react-icons/hi'
import { twMerge } from 'tailwind-merge'

export interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  className?: string
  children?: ReactNode
}

const TableHeaderCell = ({ className, children, ...props }: TableCellProps) => {
  const twClassName = twMerge(
    'text-neutral-600 dark:text-white',
    'p-6',
    'border border-neutral-300 dark:border-[0.5px] dark:border-[#2B2C30]',
    className
  )
  return (
    <th className={twClassName} {...props}>
      {children}
    </th>
  )
}

const TableHeadRow = ({
  theadClassName,
  className,
  children
}: {
  theadClassName?: string
  className?: string
  children: JSX.Element | JSX.Element[]
}) => {
  const twClassName = twMerge('text-left uppercase', 'bg-neutral-100 dark:bg-[#212226]', className)
  return (
    <thead className={theadClassName}>
      <tr className={twClassName}>{children}</tr>
    </thead>
  )
}

const TableCell = ({ className, children, ...props }: TableCellProps) => {
  const twClassName = twMerge(
    'p-6',
    'border border-neutral-300 dark:border-[0.5px] dark:border-[#2B2C30]',
    'text-left text-neutral-600 dark:text-white',
    className
  )
  return (
    <td className={twClassName} {...props}>
      {children}
    </td>
  )
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string
  children?: ReactNode
}
const TableRow = ({ className, children, ...props }: TableRowProps) => {
  const twClassName = twMerge('even:bg-theme-surfaceMain odd:bg-gray-100 odd:dark:bg-[#212226]')
  return (
    <tr className={twClassName} {...props}>
      {children}
    </tr>
  )
}

export interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
  children?: ReactNode
}

const TableBody = ({ className, children, ...props }: TableSectionProps) => {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string
  children?: ReactNode
}

const Table = ({ className, children }: TableProps) => {
  const twClassName = twMerge('w-full border-collapse rounded-md text-sm', className)
  return <table className={twClassName}>{children}</table>
}

/**`page` has to be in 1-based indexing */
const TablePagination = ({
  className,
  steps = 3,
  totalPages,
  currentPage,
  onPageChange
}: {
  className?: string
  totalPages: number
  currentPage: number
  steps?: number
  onPageChange: (newPage: number) => void
}) => {
  return (
    <nav className="flex-column flex flex-wrap items-center justify-between pt-4 md:flex-row">
      <ul className="inline-flex h-8 -space-x-px text-sm rtl:space-x-reverse">
        <li>
          <button
            onClick={() => onPageChange(0)}
            className="bg-theme-surfaceMain hover:bg-gray-10 flex h-8 items-center justify-center rounded-s-lg border border-gray-300 px-3 leading-tight text-gray-500 dark:border-gray-700 dark:text-white"
          >
            <HiRewind />
          </button>
        </li>
        <li>
          <button
            className="bg-theme-surfaceMain flex h-8 items-center justify-center border border-gray-300 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700  dark:border-gray-700 dark:text-white dark:hover:text-white"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            <GoChevronLeft />
          </button>
        </li>
        {[...Array(Math.min(totalPages, steps)).keys()].map((page) => (
          <li>
            <button
              onClick={() => onPageChange(page + 1)}
              className={`bg-theme-surfaceMain flex h-8 items-center justify-center border border-gray-300 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700  dark:border-gray-700 dark:text-white dark:hover:text-white ${
                currentPage === page + 1 ? 'bg-blue-50 dark:bg-gray-500' : ''
              }`}
            >
              {page + 1}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="bg-theme-surfaceMain flex h-8 items-center justify-center border border-gray-300 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700  dark:border-gray-700 dark:text-white dark:hover:text-white"
          >
            <GoChevronRight />
          </button>
        </li>
        <li>
          <button
            onClick={() => onPageChange(totalPages)}
            className="bg-theme-surfaceMain flex h-8 items-center justify-center rounded-e-lg border border-gray-300 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700  dark:border-gray-700 dark:text-white dark:hover:text-white"
          >
            <HiFastForward />
          </button>
        </li>
      </ul>
      {/* <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
        Showing <span className="font-semibold text-gray-900 dark:text-white">1-10</span> of{' '}
        <span className="font-semibold text-gray-900 dark:text-white">1000</span>
      </span> */}
    </nav>
  )
}

export default Table
export { TableHeaderCell, TableCell, TableRow, TableHeadRow, TableBody, TablePagination, Table }
