import { describe, expect, it } from '@jest/globals'
import { shallow } from 'enzyme'
import React from 'react'

import CardActionArea from './index'
import { Primary as story } from './index.stories'

describe('CardActionArea', () => {
  it('- should render', () => {
    const wrapper = shallow(<CardActionArea {...story?.args} />)
    expect(wrapper).toMatchSnapshot()
  })
})
