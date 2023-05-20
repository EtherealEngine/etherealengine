import { describe, expect, it } from '@jest/globals'
import { shallow } from 'enzyme'
import React from 'react'

import Popover from './index'
import { Primary as story } from './index.stories'

describe('Popover', () => {
  it('- should render', () => {
    const wrapper = shallow(<Popover {...story?.args} />)
    expect(wrapper).toMatchSnapshot()
  })
})
