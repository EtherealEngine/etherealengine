import { describe, expect, it } from '@jest/globals'
import { shallow } from 'enzyme'
import React from 'react'

import Tabs from './index'
import { Primary as story } from './index.stories'

describe('Tabs', () => {
  it('- should render', () => {
    const wrapper = shallow(<Tabs {...story?.args} />)
    expect(wrapper).toMatchSnapshot()
  })
})
