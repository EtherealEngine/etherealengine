import { Material, Mesh } from 'three'

import { AssetLoader } from '../../assets/classes/AssetLoader'
import { Entity } from '../../ecs/classes/Entity'
import { World } from '../../ecs/classes/World'
import { defineQuery, getAllComponentsOfType, getComponent } from '../../ecs/functions/ComponentFunctions'
import { assignMaterial, MaterialParms } from '../../renderer/materials/MaterialParms'
import UpdateableObject3D from '../classes/UpdateableObject3D'
import { ImageComponent } from '../components/ImageComponent'
import { MaterialOverrideComponent, MaterialOverrideComponentType } from '../components/MaterialOverrideComponent'
import { ModelComponent } from '../components/ModelComponent'
import { Object3DComponent, Object3DWithEntity } from '../components/Object3DComponent'
import { updateImage } from '../functions/loaders/ImageFunctions'

export type MatRend = {
  mesh: Mesh
  material: Material | Material[]
}

export type OverrideEntry = {
  defaults: MatRend[]
  matParm: MaterialParms
}

type EntityEntry = Map<MaterialOverrideComponentType, OverrideEntry>

/**
 * System for managing custom materials. Keeps a table that maps every applied material override
 * component to a list of mesh-material tuples. These tuples store the default materials of any mesh that
 * has had an override applied to it. If/when the override is disabled, the default materials are re-applied
 * @param world
 * @returns
 */
export default async function MaterialOverrideSystem(world: World) {
  const overrideQuery = defineQuery([MaterialOverrideComponent])

  const overrideTable: Map<Entity, EntityEntry> = new Map()

  /**
   * Attempts to apply a material override, then registers the default materials in the override table
   * @param override
   */
  async function register(override: MaterialOverrideComponentType) {
    const target = override.targetEntity
    if (!overrideTable.has(target)) overrideTable.set(target, new Map())
    const tableEntry = overrideTable.get(target)!
    if (tableEntry.has(override)) {
      remove(override)
    }
    const [defaults, matParm] = await assignMaterial(override)
    if (defaults.length > 0) {
      tableEntry.set(override, { matParm, defaults })
    }
  }

  /**
   * Removes a material override from the override table, and restores default mesh materials
   * @param override
   */
  function remove(override: MaterialOverrideComponentType) {
    const entEntry = overrideTable.get(override.targetEntity)!
    const tableEntry = entEntry.get(override)
    tableEntry?.defaults.forEach((matRend) => {
      matRend.mesh.material = matRend.material
    })
    entEntry.delete(override)
  }

  return async () => {
    await Promise.all(
      overrideQuery.enter().map(async (entity) => {
        const override = getComponent(entity, MaterialOverrideComponent)
        return register(override)
      })
    )

    await Promise.all(
      overrideQuery.exit().map(async (entity) => {
        const override = getComponent(entity, MaterialOverrideComponent, true)
        return remove(override)
      })
    )

    //Performs update functions for each override that is currently active in the scene
    await Promise.all(
      overrideQuery().map(async (entity) => {
        const override = getComponent(entity, MaterialOverrideComponent)
        const entityEntry = overrideTable.get(override.targetEntity)!
        for (const overrideEntry of entityEntry.values()) {
          overrideEntry.matParm.update(world.fixedDeltaSeconds / 4)
        }
      })
    )
  }
}
