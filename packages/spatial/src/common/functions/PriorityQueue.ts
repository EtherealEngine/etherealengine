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

import { Immutable } from '@etherealengine/common/src/Immutability'

import { insertionSort } from '@etherealengine/common/src/utils/insertionSort'
import { Entity } from '@etherealengine/ecs/src/Entity'
import { entityExists } from '@etherealengine/ecs/src/EntityFunctions'
import { Query } from '@etherealengine/ecs/src/QueryFunctions'
import { DistanceFromCameraComponent, FrustumCullCameraComponent } from '../../transform/components/DistanceComponents'

export const createPriorityQueue = (args: { accumulationBudget: number }) => {
  const accumulatingPriorities = new Map<
    Entity,
    {
      normalizedPriority: number
      accumulatedPriority: number
    }
  >()

  const priorityEntities = new Set<Entity>()

  let totalAccumulation = 0

  const queue = {
    accumulatingPriorities: accumulatingPriorities as Immutable<typeof accumulatingPriorities>,
    removeEntity: (entity: Entity) => {
      accumulatingPriorities.delete(entity)
    },
    addPriority: (entity: Entity, priority: number) => {
      if (!accumulatingPriorities.has(entity))
        accumulatingPriorities.set(entity, { normalizedPriority: 0, accumulatedPriority: 0 })
      const item = accumulatingPriorities.get(entity)!
      item.accumulatedPriority += priority
      totalAccumulation += priority
    },
    update: () => {
      priorityEntities.clear()
      for (const [entity, item] of accumulatingPriorities) {
        item.normalizedPriority += (item.accumulatedPriority * queue.accumulationBudget) / totalAccumulation
        item.accumulatedPriority = 0
        const exists = entityExists(entity)
        if (item.normalizedPriority >= 1 || !exists) {
          if (exists) priorityEntities.add(entity)
          queue.removeEntity(entity)
        }
      }
      totalAccumulation = 0
    },
    priorityEntities: priorityEntities as ReadonlySet<Entity>,
    accumulationBudget: args.accumulationBudget,
    reset: () => {
      totalAccumulation = 0
      accumulatingPriorities.clear()
      priorityEntities.clear()
    }
  }

  return queue
}

const minimumFrustumCullDistanceSqr = 5 * 5 // 5 units

const filterFrustumCulledEntities = (entity: Entity) =>
  !(
    DistanceFromCameraComponent.squaredDistance[entity] > minimumFrustumCullDistanceSqr &&
    FrustumCullCameraComponent.isCulled[entity]
  )

export const createSortAndApplyPriorityQueue = (query: Query, comparisonFunction) => {
  let sortAccumulator = 0

  return (
    priorityQueue: ReturnType<typeof createPriorityQueue>,
    sortedTransformEntities: Entity[],
    deltaSeconds: number
  ) => {
    let needsSorting = false
    sortAccumulator += deltaSeconds
    if (sortAccumulator > 1) {
      needsSorting = true
      sortAccumulator = 0
    }

    for (const entity of query.enter()) {
      sortedTransformEntities.push(entity)
      needsSorting = true
    }

    for (const entity of query.exit()) {
      const idx = sortedTransformEntities.indexOf(entity)
      idx > -1 && sortedTransformEntities.splice(idx, 1)
      needsSorting = true
      priorityQueue.removeEntity(entity)
    }

    if (needsSorting && sortedTransformEntities.length > 1) {
      insertionSort(sortedTransformEntities, comparisonFunction)
    }

    const filteredSortedTransformEntities: Array<Entity> = []
    for (let i = 0; i < sortedTransformEntities.length; i++) {
      if (filterFrustumCulledEntities(sortedTransformEntities[i]))
        filteredSortedTransformEntities.push(sortedTransformEntities[i])
    }

    for (let i = 0; i < filteredSortedTransformEntities.length; i++) {
      const entity = filteredSortedTransformEntities[i]
      const accumulation = Math.min(Math.exp(1 / (i + 1)) / 3, 1)
      priorityQueue.addPriority(entity, accumulation * accumulation)
    }

    priorityQueue.update()
  }
}
