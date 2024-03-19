/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { ProjectType, projectPath } from '@etherealengine/common/src/schema.type.module'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { loadConfigForProject } from './loadConfigForProject'

export const loadWebappInjection = async () => {
  const projects = (await Engine.instance.api
    .service(projectPath)
    .find({ query: { paginate: false, skipProjectPermissions: true } })) as any as ProjectType[]
  return (
    await Promise.all(
      projects.map(async (project) => {
        try {
          const projectConfig = (await loadConfigForProject(project.name))!
          if (typeof projectConfig.webappInjection !== 'function') return null!
          return (await projectConfig.webappInjection()).default
        } catch (e) {
          console.error(`Failed to import webapp load event for project ${project.name} with reason ${e}`)
          return null!
        }
      })
    )
  ).filter(($) => !!$)
}
