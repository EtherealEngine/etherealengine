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

import { v4 as uuidv4 } from 'uuid'
import { EntityJsonType, SceneJsonType } from '../types/SceneTypes'

// puts the scene settings from the the root entity into a sub entity
export const migrateSceneSettings = (json: SceneJsonType) => {
  if (!json.root) return
  const rootEntity = json.entities[json.root]
  if (!rootEntity) return

  if (!json.entities[json.root].components.length) return
  const newEntity = {
    name: 'Settings',
    components: JSON.parse(JSON.stringify(rootEntity.components)),
    parent: json.root,
    index: 0
  } as EntityJsonType

  // remove all root entity components
  json.entities[json.root].components = []

  // increment all indexes as our new entity will be at the start
  for (const entity of Object.values(json.entities)) {
    if (typeof entity.index === 'number') entity.index = entity.index + 1
  }

  // force reordering so our new entity can be at the start
  json.entities = {
    [json.root]: json.entities[json.root],
    [uuidv4()]: newEntity,
    ...json.entities
  }
}
