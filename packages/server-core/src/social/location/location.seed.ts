import { locationSettingsSeed } from '../location-settings/location-settings.seed'
import { Location } from '@xrengine/common/src/interfaces/Location'

export const locationSeed = {
  randomize: false,
  path: 'location',
  templates: [
    // @ts-ignore
    {
      id: '98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d61',
      name: 'Test',
      slugifiedName: 'test',
      maxUsersPerInstance: 30,
      sceneId: 'default-project/default',
      location_settings: locationSettingsSeed.templates.find(
        (template) => template.locationId === '98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d61'
      ),
      isLobby: false
    } as Location,
    {
      id: '98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d62',
      name: 'Game-CTF',
      slugifiedName: 'game-ctf',
      maxUsersPerInstance: 30,
      sceneId: 'default-project/default',
      location_settings: locationSettingsSeed.templates.find(
        (template) => template.locationId === '98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d62'
      ),
      isLobby: false
    } as Location,
    {
      id: '98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d63',
      name: 'Game-Tournament',
      slugifiedName: 'game-tournament',
      maxUsersPerInstance: 30,
      sceneId: 'default-project/default',
      location_settings: locationSettingsSeed.templates.find(
        (template) => template.locationId === '98cbcc30-fd2d-11ea-bc7c-cd4cac9a8d63'
      ),
      isLobby: false
    } as Location
  ]
}
