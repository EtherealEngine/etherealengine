import React from 'react'

import Component from './index'

const argTypes = {}

const decorators = [
  (Story) => {
    return (
      <div style={{ height: '100vh', pointerEvents: 'auto' }}>
        <Story />
      </div>
    )
  }
]

export default {
  title: 'Components/Tailwind/ThemeSwitcher',
  component: Component,
  parameters: {
    componentSubtitle: 'ThemeSwitcher',
    jest: 'ThemeSwitcher.test.tsx',
    design: {
      type: 'figma',
      url: ''
    }
  },
  decorators,
  argTypes
}

export const Primary = { args: Component.defaultProps }
