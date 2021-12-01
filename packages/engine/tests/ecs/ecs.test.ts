import assert from 'assert'
import { createEngine, Engine, useEngine } from '../../src/ecs/classes/Engine'
import { System } from '../../src/ecs/classes/System'
import { createWorld, World } from '../../src/ecs/classes/World'
import { addComponent, createMappedComponent, defineQuery, getComponent, removeComponent } from '../../src/ecs/functions/ComponentFunctions'
import { registerSystem, SystemModulePromise } from '../../src/ecs/functions/SystemFunctions'
import { SystemUpdateType } from '../../src/ecs/functions/SystemUpdateType'
import { createEntity,removeEntity } from '../../src/ecs/functions/EntityFunctions'
import { useWorld } from '../../src/ecs/functions/SystemHooks'
import { Entity } from '../../src/ecs/classes/Entity'
import * as bitecs from 'bitecs'

const mockDelta = 1/60
let mockElapsedTime = 0

const externalState: number[] = []

type MockComponentData = {
  mockValue: number
}

const MockComponent = createMappedComponent<MockComponentData>('MockComponent')

const MockSystemModulePromise = async () => {
  return {
    default: MockSystemInitialiser
  }
}

async function MockSystemInitialiser(world: World, args: {}): Promise<System> {
  const mockQuery = defineQuery([MockComponent])
  return () => {
    console.log('run')
    for(const entity of mockQuery.enter()) {
      const component = getComponent(entity, MockComponent)
      console.log('Mock query enter', entity, component)
      externalState.push(component.mockValue)
      console.log('externalState', externalState)
    }

    for(const entity of mockQuery.exit()) {
      const component = getComponent(entity, MockComponent, true)
      console.log('Mock query exit', entity, component)
      externalState.splice(externalState.indexOf(component.mockValue))
      console.log('externalState', externalState)
    }
  }
}

let mockValue
let newMockValue

/**
 * This is designed as an integration test, not a unit test.
 */
describe('ECS', () => {
  
  after(() => {
    Engine.instance = null!
  })

  const createNewEngineAndWorld = () => {
    createEngine()
    const world = createWorld()
    useEngine().currentWorld = world
    useEngine().defaultWorld = world
  }

  describe('individual tests', () => {

    it('should create ECS world', () => {
      createNewEngineAndWorld()
      const world = useWorld()
      assert.strictEqual(useEngine().worlds.length, 1)
      assert.strictEqual(world.entities.length, 1)
      assert.strictEqual(world.entities[0], useEngine().currentWorld!.worldEntity)
    })

    it('should add entity', async () => {
      createNewEngineAndWorld()
      const entity = createEntity()
      const world = useWorld()
      
      assert.strictEqual(world.entities.length, 2)
      assert.strictEqual(world.entities[0], world.worldEntity)
      assert.strictEqual(world.entities[1], entity)
    })
  })

  describe('should progress through all ecs states', () => {
    it('should add systems', async () => {
      createNewEngineAndWorld()
      registerSystem(SystemUpdateType.UPDATE, MockSystemModulePromise())
      const world = useWorld()
      await world.initSystems()
      assert.strictEqual(world.freeSystems.length, 1)
    })

    it('should add component', async () => {
      const world = useWorld()
      const entity = createEntity()
      mockValue = Math.random()
      addComponent(entity, MockComponent, { mockValue })
      world.execute(mockDelta, mockElapsedTime += mockDelta)
      const component = getComponent(entity, MockComponent)
      assert(component)
      assert.strictEqual(component.mockValue, mockValue)
    })

    it('should query component', async () => {
      const world = useWorld()
      const entity = world.entities[1]
      const component = getComponent(entity, MockComponent)
      assert.strictEqual(component.mockValue, externalState[0])
    })

    it('should remove and clean up component', async () => {
      const world = useWorld()
      const entity = world.entities[1]
      removeComponent(entity, MockComponent)
      world.execute(mockDelta, mockElapsedTime += mockDelta)
      assert.deepStrictEqual(externalState, [])
    })

    // currently broken

    // it('should re-add component', async () => {
    //   const world = useWorld()
    //   const entity = world.entities[1]
    //   newMockValue = Math.random()
    //   console.log(bitecs.hasComponent(useEngine().currentWorld!, MockComponent, entity))
    //   addComponent(entity, MockComponent, { mockValue: newMockValue })
    //   console.log(bitecs.hasComponent(useEngine().currentWorld!, MockComponent, entity))
    //   world.execute(mockDelta, mockElapsedTime += mockDelta)
    //   const component = getComponent(entity, MockComponent)
    //   world.execute(mockDelta, mockElapsedTime += mockDelta)
    //   assert(component)
    //   assert.strictEqual(component.mockValue, newMockValue)
    //   assert.strictEqual(newMockValue, externalState[0])
    // })

    it('should remove and clean up entity', async () => {
      const world = useWorld()
      const entity = world.entities[1]
      // assert.deepStrictEqual(externalState, [newMockValue])
      removeEntity(entity)
      assert.ok(!getComponent(entity, MockComponent))
      assert.ok(getComponent(entity, MockComponent, true))
      world.execute(mockDelta, mockElapsedTime += mockDelta)
      assert.deepStrictEqual(externalState, [])
    })
  })
})