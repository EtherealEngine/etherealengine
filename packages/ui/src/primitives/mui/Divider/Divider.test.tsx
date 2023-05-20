import { describe, expect, it } from '@jest/globals'
import { shallow } from 'enzyme'
import React from 'react'

import Divider from './index'
import { Primary as story } from './index.stories'

describe('Divider', () => {
  it('- should render', () => {
    const wrapper = shallow(<Divider {...story?.args} />)
    expect(wrapper).toMatchSnapshot()
  })
})
