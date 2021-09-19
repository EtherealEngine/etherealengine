import { World } from '@xrengine/engine/src/ecs/classes/World'
import { Mesh, Object3D, Quaternion, Vector3 } from 'three'
import { createEntity } from '../../src/ecs/functions/EntityFunctions'
import { addComponent, getComponent } from '../../src/ecs/functions/ComponentFunctions'
import { TransformComponent } from '../../src/transform/components/TransformComponent'
import { MapComponent } from '../../src/map/MapComponent'
import { Entity } from '../../src/ecs/classes/Entity'
import { Object3DComponent } from '../../src/scene/components/Object3DComponent'
import { FollowCameraComponent } from '../../src/camera/components/FollowCameraComponent'
import { createWorld } from '../../src/ecs/functions/EngineFunctions'
import { System } from 'bitecs'
import createSUT from '../../src/map/MapUpdateSystem'
import createStore from '../../src/map/functions/createStore'
import startAvailableTasks from '../../src/map/functions/startAvailableTasks'
import { createProductionPhases } from '../../src/map/functions/createProductionPhases'
import createFeatureLabel from '../../src/map/functions/createFeatureLabel'
import MapFeatureLabelComponent from '../../src/map/MapFeatureLabelComponent'
import { lineString } from '@turf/helpers'

jest.mock('../../src/map/functions/startAvailableTasks')
jest.mock('../../src/map/functions/createProductionPhases')
jest.mock('../../src/map/functions/createFeatureLabel', () => {
  const { Object3D } = jest.requireActual('three')
  return () => ({
    mesh: new Object3D(),
    centerPoint: [12, 13],
    boundingCircleRadius: 2
  })
})

describe('MapUpdateSystem', () => {
  const triggerRefreshRadius = 20 // meters
  const minimumSceneRadius = triggerRefreshRadius * 2
  const mapScale = 0.5
  const mapArgs = {}
  const mapCenter = [0, 0]
  let world: World,
    execute: System,
    viewerEntity: Entity,
    mapEntity: Entity,
    store: ReturnType<typeof createStore>,
    subScene: Object3D

  beforeEach(async () => {
    world = createWorld()
    viewerEntity = createEntity(world)
    mapEntity = createEntity(world)
    execute = await createSUT(world)
    store = createStore(mapCenter, mapArgs, triggerRefreshRadius, minimumSceneRadius)
    subScene = new Object3D()

    addComponent(
      viewerEntity,
      TransformComponent,
      {
        position: new Vector3(),
        rotation: new Quaternion(),
        scale: new Vector3().setScalar(1)
      },
      world
    )
    addComponent(viewerEntity, FollowCameraComponent, null, world)

    addComponent(mapEntity, MapComponent, store, world)
    addComponent(mapEntity, Object3DComponent, { value: subScene }, world)
    addComponent(
      mapEntity,
      TransformComponent,
      {
        position: new Vector3(),
        rotation: new Quaternion(),
        scale: new Vector3().setScalar(mapScale)
      },
      world
    )
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does nothing while player moves within refresh boundary', () => {
    const viewerTransform = getComponent(viewerEntity, TransformComponent, false, world)

    execute(world)
    viewerTransform.position.set((triggerRefreshRadius / 2) * mapScale, 0, 0)
    execute(world)

    expect(startAvailableTasks).not.toHaveBeenCalled()
  })

  it('start a new production run when player crosses the boundary', async () => {
    const viewerTransform = getComponent(viewerEntity, TransformComponent, false, world)

    execute(world)
    viewerTransform.position.set(triggerRefreshRadius * mapScale, 0, 0)
    execute(world)

    expect(createProductionPhases).toHaveBeenCalledTimes(1)
    expect(startAvailableTasks).toHaveBeenCalledTimes(1)

    viewerTransform.position.set(triggerRefreshRadius * 1.5 * mapScale, 0, 0)
    execute(world)

    expect(createProductionPhases).toHaveBeenCalledTimes(1)
    expect(startAvailableTasks).toHaveBeenCalledTimes(1)

    viewerTransform.position.set(triggerRefreshRadius * 2 * mapScale, 0, 0)
    execute(world)

    expect(createProductionPhases).toHaveBeenCalledTimes(2)
    expect(startAvailableTasks).toHaveBeenCalledTimes(2)
  })

  it('adds and positions labels in the scene (if close enough)', () => {
    const feature = lineString([
      [0, 0],
      [1, 0],
      [2, 1],
      [4, 2]
    ])
    feature.properties.name = "don't panic"
    const label = createFeatureLabel(feature)
    const labelEntity = createEntity(world)
    addComponent(labelEntity, MapFeatureLabelComponent, { value: label }, world)

    store.labelCache.set(['road', 0, 0, '0'], labelEntity)

    execute(world)

    expect(subScene.children.includes(label.mesh)).toBe(true)
    expect(label.mesh.parent).toBe(subScene)
    expect(label.mesh.position.toArray()).toEqual([label.centerPoint[0], 0, label.centerPoint[1]])
  })
})
