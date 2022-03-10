import { Id, Params } from '@feathersjs/feathers'
import { SequelizeServiceOptions, Service } from 'feathers-sequelize'

import { Application } from '../../../declarations'

export class ProjectSetting extends Service {
  app: Application

  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  async find(params?: Params): Promise<any> {
    const id = params?.projectId || ''
    const key = params?.key || ''
    const result = await this.app.service('project').find({ id: id })

    const settingsValue = JSON.parse(result.settings)

    if (key) {
      let keyValue = ''

      for (let setting of settingsValue) {
        if (setting.key === key) {
          keyValue = setting.value
        }
      }

      return keyValue
    }

    return settingsValue
  }

  async patch(id: Id, params?: Params): Promise<any> {
    const data = params?.data || ''

    const result = await this.app.service('project').patch(id, { settings: JSON.stringify(data) })

    return result
  }
}
