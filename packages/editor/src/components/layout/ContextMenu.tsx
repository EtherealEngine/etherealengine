import React from 'react'
import { createGlobalStyle } from 'styled-components'

import { Menu, PopoverPosition } from '@mui/material'

export const ContextMenuStyles = createGlobalStyle<any>`
  .react-contextmenu {
    background-color: var(--dropdownMenuBackground);
    background-clip: padding-box;
    border-radius: 4px;
    margin: 2px 0 0;
    min-width: 140px;
    outline: none;
    opacity: 0;
    padding: 4px 0;
    pointer-events: none;
    text-align: left;
    box-shadow: var(--shadow30);
  }

  .react-contextmenu-wrapper {
    height: calc(100% - 40px);
    width:100%;
  }

  .react-contextmenu.react-contextmenu--visible {
    opacity: 1;
    pointer-events: auto;
    z-index: 9999;
  }

  .react-contextmenu-item {
    background: 0 0;
    border: 0;
    cursor: pointer;
    line-height: 24px;
    padding: 4px 8px;
    text-align: inherit;
    white-space: nowrap;
    display: flex;
    flex: 1;
    justify-content: space-between;
    color: var(--textColor);
  }

  .react-contextmenu-item.react-contextmenu-item--active,
  .react-contextmenu-item.react-contextmenu-item--selected {
    color: var(--textColor);
    background-color: var(--dropdownMenuHoverBackground);
    border-color: transparent;
    text-decoration: none;
  }

  .react-contextmenu-item.react-contextmenu-item--disabled,
  .react-contextmenu-item.react-contextmenu-item--disabled:hover {
    background-color: transparent;
    border-color: rgba(0,0,0,.15);
    color: var(--textColor);
  }

  .react-contextmenu-item--divider {
    border-bottom: 1px solid var(--border);
    cursor: inherit;
    margin: 4px 0;
    height: 1px;
    padding: 0;
  }

  .react-contextmenu-item.react-contextmenu-submenu {
    padding: 0;
  }

  .react-contextmenu-item.react-contextmenu-submenu > .react-contextmenu-item::after {
    display: inline-block;
    font-size: 12px;
    content: "▸";
    vertical-align: middle;
  }
`

type ContextMenuProps = {
  open: boolean
  anchorEl: null | HTMLElement
  anchorPosition: undefined | PopoverPosition
  rootStyle?: React.CSSProperties | undefined
  onClose: () => void
}

export const ContextMenu = ({
  children,
  open,
  anchorEl,
  anchorPosition,
  rootStyle,
  onClose
}: React.PropsWithChildren<ContextMenuProps>) => {
  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      PaperProps={{ style: rootStyle }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {children}
    </Menu>
  )
}
