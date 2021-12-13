import assert, { strictEqual } from 'assert'
import { NetworkId } from '@xrengine/common/src/interfaces/NetworkId'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { createWorld } from '../../../src/ecs/classes/World'
import { addComponent } from '../../../src/ecs/functions/ComponentFunctions'
import { createEntity } from '../../../src/ecs/functions/EntityFunctions'
import { Network } from '../../../src/networking/classes/Network'
import { NetworkObjectComponent } from '../../../src/networking/components/NetworkObjectComponent'
import IncomingNetworkSystem from '../../../src/networking/systems/IncomingNetworkSystem'
import { Vector3 } from 'three'
import { TransformComponent } from '../../../src/transform/components/TransformComponent'
import { VelocityComponent } from '../../../src/physics/components/VelocityComponent'
import { TestNetwork } from '../TestNetwork'
import { Engine } from '../../../src/ecs/classes/Engine'
import { createQuaternionProxy, createVector3Proxy } from '../../../src/common/proxies/three'
import { networkTransformsQuery, serialize } from '../../../src/networking/systems/OutgoingNetworkSystem'
import { pipe } from 'bitecs'

describe('IncomingNetworkSystem Integration Tests', async () => {
	
	let world

	beforeEach(() => {
    /* hoist */
		Network.instance = new TestNetwork()
		world = createWorld()
		Engine.currentWorld = world
	})

	it('should apply pose state to an entity from World.incomingMessageQueueUnreliable', async () => {
		/* mock */

		// make this engine user the host (world.isHosting === true)
    Engine.userId = world.hostId
		
		// mock entity to apply incoming unreliable updates to
		const entity = createEntity()
		const transform = addComponent(entity, TransformComponent, {
			position: createVector3Proxy(TransformComponent.position, entity),
			rotation: createQuaternionProxy(TransformComponent.rotation, entity),
			scale: new Vector3(),
		})
		
		transform.position.set(1,2,3)

		const velocity = addComponent(entity, VelocityComponent, {
			velocity: new Vector3()
		})
		const networkObject = addComponent(entity, NetworkObjectComponent, {
			userId: '0' as UserId,
			networkId: 0 as NetworkId,
			prefab: '',
			parameters: {},
		})

		// mock incoming server data
		// const newPosition = new Vector3(1,2,3)
		// const newRotation = new Quaternion(1,2,3,4)
		
		// const newWorldState: WorldStateInterface = {
		// 	tick: 0,
		// 	time: Date.now(),
		// 	pose: [
		// 		{
		// 			networkId: 0 as NetworkId,
		// 			position: newPosition.toArray(),
		// 			rotation: newRotation.toArray(),
		// 			linearVelocity: [],
		// 			angularVelocity: [],
		// 		}
		// 	],
		// 	controllerPose: [],
    //   handsPose: []
		// }

		console.log(networkTransformsQuery(world))
		console.log(serialize(networkTransformsQuery(world)))

		console.log(networkTransformsQuery(world))
		console.log(serialize(networkTransformsQuery(world)))

		const buffer = pipe(networkTransformsQuery, serialize)(world)
		
		// todo: Network.instance should ideally be passed into the system as a parameter dependency,
		// instead of an import dependency , but this works for now
		Network.instance.incomingMessageQueueUnreliable.add(buffer)
		Network.instance.incomingMessageQueueUnreliableIDs.add(Engine.userId)

		transform.position.set(0,0,0)
		
		/* run */
		const incomingNetworkSystem = await IncomingNetworkSystem(world)
		
		incomingNetworkSystem()
		
		/* assert */
		strictEqual(transform.position.x, 1)
		strictEqual(transform.position.y, 2)
		strictEqual(transform.position.z, 3)
		// assert(transform.position.equals(newPosition))
	})
})
