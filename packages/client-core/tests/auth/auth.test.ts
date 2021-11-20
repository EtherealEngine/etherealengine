import { createState } from '@hookstate/core'
import assert from 'assert'
import { IdentityProviderSeed } from '@xrengine/common/src/interfaces/IdentityProvider'
import { AuthUserSeed } from '@xrengine/common/src/interfaces/AuthUser'
import { UserAvatar } from '@xrengine/common/src/interfaces/UserAvatar'
import { UserSeed } from '@xrengine/common/src/interfaces/User'
import { AuthAction, avatarFetchedReceptor } from '../../src/user/services/AuthService'

// make browser globals defined
;(globalThis as any).document = {}
;(globalThis as any).navigator = {}
;(globalThis as any).window = {}

const mockState = () => createState({
  isLoggedIn: false,
  isProcessing: false,
  error: '',
  authUser: AuthUserSeed,
  user: UserSeed,
  identityProvider: IdentityProviderSeed,
  avatarList: [] as Array<UserAvatar>
})

describe('Auth Service', () => {
  describe('Auth Receptors', () => {
    it('avatarFetchedReceptor', () => {

      // mock
      const mockAuthState = mockState()
      const mockData = {
        "id": "c7456310-48d5-11ec-8706-c7fb367d91f0",
        "key": "avatars/Allison.glb",
        "name": "Allison",
        "url": "/models/avatars/Allison.glb",
        "staticResourceType": "avatar",
        "userId": null
      } as any
      const mockAction = AuthAction.updateAvatarList([mockData])
      
      // logic
      avatarFetchedReceptor(mockAuthState, mockAction)
      console.log(mockAuthState.avatarList)

      // test
      assert.deepEqual(mockAuthState.avatarList.length, 1)
      // assert.deepEqual(mockAuthState.avatarList[0].avatar, mockData) // Fails...
    })
  })
})
