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

export const defaultThemeSettings = {
  light: {
    textColor: '#585858',
    navbarBackground: '#e7e7e7',
    sidebarBackground: '#e1e1e1',
    sidebarSelectedBackground: '#ACACAC',
    mainBackground: '#FFFFFF',
    panelBackground: '#c0c0c0',
    panelCards: '#DADAE2',
    panelCardHoverOutline: '#555555',
    panelCardIcon: '#4D4D4D',
    textHeading: '#696969',
    textSubheading: '#797979',
    textDescription: '#898989',
    iconButtonColor: '#585858',
    iconButtonHoverColor: '#c9c9c9',
    iconButtonBackground: '#e1e1e1',
    iconButtonSelectedBackground: '#a3a3a3',
    buttonOutlined: '#969696',
    buttonFilled: '#969696',
    buttonGradientStart: '#d1d1d1',
    buttonGradientEnd: '#969696',
    buttonTextColor: '#585858',
    scrollbarThumbXAxisStart: '#d1d1d1',
    scrollbarThumbXAxisEnd: '#969696',
    scrollbarThumbYAxisStart: '#d1d1d1',
    scrollbarThumbYAxisEnd: '#969696',
    scrollbarCorner: 'rgba(255, 255, 255, 0)',
    inputOutline: '#B4B4B4',
    inputBackground: '#D4D4D4',
    primaryHighlight: 'rgb(81, 81, 255)',
    dropdownMenuBackground: '#c0c0c0',
    dropdownMenuHoverBackground: '#B8B8B8',
    dropdownMenuSelectedBackground: '#ACACAC',
    drawerBackground: '#c6c6c6',
    popupBackground: '#c6c6c6',
    tableHeaderBackground: '#c0c0c0',
    tableCellBackground: '#e1e1e1',
    tableFooterBackground: '#c0c0c0',
    dockBackground: '#bdbdbda6'
  },
  dark: {
    textColor: '#FFF',
    navbarBackground: 'rgba(78,78,78,1)',
    sidebarBackground: 'rgba(80,80,80,1)',
    sidebarSelectedBackground: 'rgba(156,156,156,1)',
    mainBackground: 'rgba(53,53,53,1)',
    panelBackground: 'rgba(73,73,73,1)',
    panelCards: 'rgba(178,178,178,1)',
    panelCardHoverOutline: 'rgba(180,180,180,1)',
    panelCardIcon: 'rgba(39,39,39,1)',
    textHeading: '#FFF',
    textSubheading: '#FFF',
    textDescription: '#FFF',
    iconButtonColor: '#FFF',
    iconButtonHoverColor: 'rgba(148,148,148,1)',
    iconButtonBackground: 'rgba(163,163,163,1)',
    iconButtonSelectedBackground: 'rgba(146,146,146,1)',
    buttonOutlined: 'rgba(93,93,93,1)',
    buttonFilled: 'rgba(97,97,97,1)',
    buttonGradientStart: 'rgba(127,127,127,1)',
    buttonGradientEnd: 'rgba(95,95,95,1)',
    buttonTextColor: '#FFF',
    scrollbarThumbXAxisStart: 'rgba(124,124,124,1)',
    scrollbarThumbXAxisEnd: 'rgba(82,82,82,1)',
    scrollbarThumbYAxisStart: 'rgba(141,141,141,1)',
    scrollbarThumbYAxisEnd: 'rgba(97,97,97,1)',
    scrollbarCorner: 'rgba(255, 255, 255, 0)',
    inputOutline: '#FFF',
    inputBackground: 'rgba(80,80,80,1)',
    primaryHighlight: 'rgb(81, 81, 255)',
    dropdownMenuBackground: 'rgba(61,61,61,1)',
    dropdownMenuHoverBackground: 'rgba(88,88,88,1)',
    dropdownMenuSelectedBackground: 'rgba(95,95,95,1)',
    drawerBackground: 'rgba(66,66,66,1)',
    popupBackground: 'rgba(120,120,120,1)',
    tableHeaderBackground: 'rgba(76,76,76,1)',
    tableCellBackground: 'rgba(104,104,104,1)',
    tableFooterBackground: 'rgba(71,71,71,1)',
    dockBackground: 'rgba(53,53,53,0.93)'
  },
  vaporwave: {
    textColor: '#FFF',
    navbarBackground: 'rgb(31 27 72 / 85%)',
    sidebarBackground: 'rgb(31 27 72 / 100%)',
    sidebarSelectedBackground: '#5f5ff1',
    mainBackground: '#02022d',
    panelBackground: '#1f1b48',
    panelCards: '#3c3c6f',
    panelCardHoverOutline: '#9898ff',
    panelCardIcon: '#1f1b48',
    textHeading: '#FFF',
    textSubheading: '#FFF',
    textDescription: '#FFF',
    iconButtonColor: '#FFF',
    iconButtonHoverColor: '#7171f0',
    iconButtonBackground: '#9898ff',
    iconButtonSelectedBackground: '#4d4df2',
    buttonOutlined: '#3c3c6f',
    buttonFilled: '#3c3c6f',
    buttonGradientStart: '#5236ff',
    buttonGradientEnd: '#c20560',
    buttonTextColor: '#FFF',
    scrollbarThumbXAxisStart: '#5236ff',
    scrollbarThumbXAxisEnd: '#c20560',
    scrollbarThumbYAxisStart: '#5236ff',
    scrollbarThumbYAxisEnd: '#c20560',
    scrollbarCorner: 'rgba(255, 255, 255, 0)',
    inputOutline: '#FFF',
    inputBackground: '#3c3c6f',
    primaryHighlight: 'rgb(81, 81, 255)',
    dropdownMenuBackground: '#1f1b48',
    dropdownMenuHoverBackground: '#2A2567',
    dropdownMenuSelectedBackground: '#5f5ff1',
    drawerBackground: '#1f1b48',
    popupBackground: '#2C2C5F',
    tableHeaderBackground: '#1f1b48',
    tableCellBackground: '#3c3c6f',
    tableFooterBackground: '#1f1b48',
    dockBackground: 'rgb(73 66 152 / 85%)'
  }
}

export const defaultThemeModes = {
  client: 'light',
  studio: 'dark',
  admin: 'vaporwave'
} as Record<string, string>

/**
 * Defaults to light theme
 * @param themeModes
 * @returns
 */
export const getCurrentTheme = (themeModes: Record<string, string> | undefined): string => {
  const currentThemeModes = themeModes || defaultThemeModes
  const { pathname } = window.location

  if (pathname.startsWith('/admin')) {
    if (currentThemeModes['admin']) return currentThemeModes['admin']
  } else if (pathname.startsWith('/studio')) {
    const theme = currentThemeModes['studio'] ?? currentThemeModes['editor']
    if (theme) return theme
  }

  return currentThemeModes['client']
}
