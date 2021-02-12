import { AssetLoader } from '@xr3ngine/engine/src/assets/components/AssetLoader';
import { Behavior } from '@xr3ngine/engine/src/common/interfaces/Behavior';
import { Entity } from '@xr3ngine/engine/src/ecs/classes/Entity';
import { Network } from "../../../networking/classes/Network";
import { NetworkObject } from '@xr3ngine/engine/src/networking/components/NetworkObject';
import { initializeNetworkObject } from '@xr3ngine/engine/src/networking/functions/initializeNetworkObject';
import { addColliderWithoutEntity } from '@xr3ngine/engine/src/physics/behaviors/addColliderWithoutEntity';
import { ColliderComponent } from '@xr3ngine/engine/src/physics/components/ColliderComponent';
import { RigidBody } from '@xr3ngine/engine/src/physics/components/RigidBody';
import { parseCarModel } from '@xr3ngine/engine/src/physics/behaviors/parseCarModel';
import { PhysicsSystem } from '@xr3ngine/engine/src/physics/systems/PhysicsSystem';
import { PrefabType } from "@xr3ngine/engine/src/templates/networking/DefaultNetworkSchema";
import { TransformComponent } from "@xr3ngine/engine/src/transform/components/TransformComponent";
import { isServer } from '@xr3ngine/engine/src/common/functions/isServer';
import { addComponent, getComponent, removeEntity } from "@xr3ngine/engine/src/ecs/functions/EntityFunctions";
import { Interactable } from "@xr3ngine/engine/src/interaction/components/Interactable";
import { onInteractionHover } from "@xr3ngine/engine/src/templates/interactive/functions/commonInteractive";
import { getInCar } from "@xr3ngine/engine/src/templates/car/behaviors/getInCarBehavior";
import { getInCarPossible } from "@xr3ngine/engine/src/templates/car/behaviors/getInCarPossible";
import { Input } from "@xr3ngine/engine/src/input/components/Input";
import { VehicleInputSchema } from "@xr3ngine/engine/src/templates/car/VehicleInputSchema";

function plusParametersFromEditorToMesh( entity, mesh ) {
  const transform = getComponent(entity, TransformComponent);
  mesh.position.set(
    transform.position.x + mesh.position.x,
    transform.position.y + mesh.position.y,
    transform.position.z + mesh.position.z
  );
  mesh.scale.set(
    transform.scale.x * mesh.scale.x,
    transform.scale.y * mesh.scale.y,
    transform.scale.z * mesh.scale.z
  );
}


function addColliderComponent( entity, mesh ) {
  addComponent(entity, ColliderComponent, {
    type: mesh.userData.type,
    scale: mesh.scale,
    position: mesh.position,
    quaternion: mesh.quaternion,
    mesh: mesh.userData.type == "trimesh" ? mesh : null,
    mass: mesh.userData.mass ? mesh.userData.mass : 1
  });
}

// createStaticColliders

function createStaticCollider( mesh ) {
  if(mesh.type == 'Group') {
    for (let i = 0; i < mesh.children.length; i++) {
      addColliderWithoutEntity(mesh.userData.type, mesh.position, mesh.children[i].quaternion, mesh.children[i].scale, mesh.children[i]);
    }
  } else if (mesh.type == 'Mesh') {
    addColliderWithoutEntity(mesh.userData.type, mesh.position, mesh.quaternion, mesh.scale, mesh);
  }
}

// createDynamicColliders

function createDynamicColliderClient(entity, mesh) {
  if (!PhysicsSystem.serverOnlyRigidBodyCollides)
    addColliderComponent(entity, mesh);
  addComponent(entity, NetworkObject, { ownerId: 'server', networkId: Network.getNetworkId() });
  addComponent(entity, RigidBody);
}

function createDynamicColliderServer(entity, mesh) {
   const networkObject = initializeNetworkObject('server', Network.getNetworkId(), PrefabType.worldObject);
   const uniqueId = getComponent(entity, AssetLoader).entityIdFromScenaLoader.entityId;
   removeEntity(entity)
   // creating components like in client
   addColliderComponent(networkObject.entity, mesh);
   addComponent(networkObject.entity, RigidBody);
   // Add the network object to our list of network objects
   Network.instance.networkObjects[networkObject.networkId] = {
       ownerId: 'server',
       prefabType: PrefabType.worldObject, // All network objects need to be a registered prefab
       component: networkObject,
       uniqueId: uniqueId
   };
   Network.instance.createObjects.push({
       networkId: networkObject.networkId,
       ownerId: 'server',
       prefabType: PrefabType.worldObject,
       uniqueId: uniqueId,
       x: 0,
       y: 0,
       z: 0,
       qX: 0,
       qY: 0,
       qZ: 0,
       qW: 0
   });
}

// Car functions

function createVehicleOnClient(entity, mesh) {
  addComponent(entity, NetworkObject, { ownerId: 'server', networkId: Network.getNetworkId() });
  addComponent(entity, Input, { schema: VehicleInputSchema }),
  addComponent(entity, Interactable, {
      interactionParts: ['door_front_left', 'door_front_right'],
      onInteraction: getInCar,
      onInteractionCheck: getInCarPossible,
      onInteractionFocused: onInteractionHover,
      data:{
        interactionText: 'get in car'
      },
    });
  parseCarModel(entity, mesh);
}

function createVehicleOnServer(entity, mesh) {
  const networkObject = initializeNetworkObject('server', Network.getNetworkId(), PrefabType.worldObject);
  const uniqueId = getComponent(entity, AssetLoader).entityIdFromScenaLoader.entityId;
  removeEntity(entity)
  // add components
  addComponent(networkObject.entity, Input, { schema: VehicleInputSchema }),
  addComponent(networkObject.entity, Interactable, {
      interactionParts: ['door_front_left', 'door_front_right'],
      onInteraction: getInCar,
      onInteractionCheck: getInCarPossible
    });
  // creating components like in client
  parseCarModel(networkObject.entity, mesh)
  // Add the network object to our list of network objects
  Network.instance.networkObjects[networkObject.networkId] = {
      ownerId: 'server',
      prefabType: PrefabType.worldObject, // All network objects need to be a registered prefab
      component: networkObject,
      uniqueId: uniqueId
  };
  Network.instance.createObjects.push({
      networkId: networkObject.networkId,
      ownerId: 'server',
      prefabType: PrefabType.worldObject,
      uniqueId: uniqueId,
      x: 0,
      y: 0,
      z: 0,
      qX: 0,
      qY: 0,
      qZ: 0,
      qW: 0
  });
}

// parse Function

export const addWorldColliders: Behavior = (entity: Entity, args: any ) => {

  const asset = args.asset;
  const deleteArr = [];

  function parseColliders( mesh ) {
    // have user data physics its our case
    if (mesh.userData.data === 'physics' || mesh.userData.data === 'dynamic' || mesh.userData.data === 'vehicle') {
      // add position from editor to mesh
      plusParametersFromEditorToMesh(entity, mesh);
      // its for delete mesh from view scene
      mesh.userData.data === 'vehicle' ? '' : deleteArr.push(mesh);
      // parse types of colliders
      switch (mesh.userData.data) {
        case 'physics':
          createStaticCollider(mesh);
          break;
        case 'dynamic':
          isServer ? createDynamicColliderServer(entity, mesh) : createDynamicColliderClient(entity, mesh);
          break;
        case 'vehicle':
          isServer ? createVehicleOnServer(entity, mesh) : createVehicleOnClient(entity, mesh);
          break;
        default:
          createStaticCollider(mesh);
          break;
      }
    }
  }

  // its for diferent files with models
  if (asset.scene) {
   asset.scene.traverse( parseColliders );
  } else {
   asset.traverse( parseColliders );
  }

  // its for delete mesh from view scene
  for (let i = 0; i < deleteArr.length; i++) {
   deleteArr[i].parent.remove(deleteArr[i]);
  }

  return entity;
};
