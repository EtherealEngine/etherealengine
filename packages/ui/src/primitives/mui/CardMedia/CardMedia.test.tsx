import { describe, expect, it } from '@jest/globals'
import { shallow } from 'enzyme'
import React from 'react'

import CardMedia from './index'
import { Primary as story } from './index.stories'

describe('CardMedia', () => {
  it('- should render', () => {
    const wrapper = shallow(<CardMedia {...story?.args} />)
    expect(wrapper).toMatchSnapshot()
  })
})
