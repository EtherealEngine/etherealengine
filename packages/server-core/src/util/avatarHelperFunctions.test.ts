import app from '../../../server/src/app'
import { getAvatarFromStaticResources } from './avatarHelperFunctions'
import assert from 'assert'

describe(('avatarHelperFunctions'), () => {
  describe('getAvatarFromStaticResources', () => {
    it('should get single avatar and thumbnail', async () => {
      const avatar = await getAvatarFromStaticResources(app, 'Allison')
      assert.equal(avatar.length, 1)
      assert(avatar[0].avatarURL)
      assert(avatar[0].thumbnailURL)
    })
    it('should get single avatar and thumbnail', async () => {
      const result = await getAvatarFromStaticResources(app)
      assert.equal(result.length, 7)
      for(const avatar of result) {
        assert(avatar.avatarURL)
        assert(avatar.thumbnailURL)
      }
    })
  })
})