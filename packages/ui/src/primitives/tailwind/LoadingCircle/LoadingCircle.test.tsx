import { describe, expect, it } from '@jest/globals'
import { shallow } from 'enzyme'
import React from 'react'

import LoadingCircle from './index'
import { Primary as story } from './index.stories'

describe('LoadingCircle', () => {
  it('- should render', () => {
    const wrapper = shallow(<LoadingCircle {...story?.args} />)
    expect(wrapper).toMatchSnapshot()
  })
})
