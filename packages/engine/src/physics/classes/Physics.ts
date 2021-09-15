import { loadPhysX } from '../physx/loadPhysX'
import {
  PhysXConfig,
  BodyType,
  RigidBody,
  ShapeOptions,
  SceneQuery,
  CollisionEvents,
  ControllerEvents,
  SceneQueryType,
  CapsuleControllerConfig,
  BoxControllerConfig
} from '../types/PhysicsTypes'
import { putIntoPhysXHeap } from '../functions/physxHelpers'
import { Quaternion, Vector3 } from 'three'
import { RaycastComponent } from '../components/RaycastComponent'
import { ComponentType } from '../../ecs/functions/ComponentFunctions'

const defaultMask = 0

let nextAvailableBodyIndex = 0
let nextAvailableShapeID = 0
let nextAvailableRaycastID = 0
let nextAvailableObstacleID = 0

const quat1 = new Quaternion()
const quat2 = new Quaternion()
const xVec = new Vector3(1, 0, 0)
const yVec = new Vector3(0, 1, 0)
const halfPI = Math.PI / 2

export class Physics {
  physxVersion: number
  defaultErrorCallback: PhysX.PxDefaultErrorCallback
  allocator: PhysX.PxDefaultAllocator
  foundation: PhysX.PxFoundation
  cookingParamas: PhysX.PxCookingParams
  cooking: PhysX.PxCooking
  physics: PhysX.PxPhysics
  sceneDesc: PhysX.PxSceneDesc
  scene: PhysX.PxScene
  controllerManager: PhysX.PxControllerManager
  obstacleContext: PhysX.PxObstacleContext
  defaultCCTQueryCallback: PhysX.PxQueryFilterCallback

  stepTime: number = 1000 / 60
  substeps: number = 1
  collisionEventQueue = []

  bodies: Map<number, PhysX.PxRigidActor> = new Map<number, PhysX.PxRigidActor>()
  shapes: Map<number, PhysX.PxShape> = new Map<number, PhysX.PxShape>()
  shapeIDByPointer: Map<number, number> = new Map<number, number>()
  controllerIDByPointer: Map<number, number> = new Map<number, number>()
  bodyIDByShapeID: Map<number, number> = new Map<number, number>()
  controllers: Map<number, PhysX.PxController> = new Map<number, PhysX.PxController>()
  raycasts: Map<number, SceneQuery> = new Map<number, SceneQuery>()
  obstacles: Map<number, number> = new Map<number, number>()

  dispose() {}

  onEvent(ev) {
    this.collisionEventQueue.push(ev)
  }

  getOriginalShapeObject(shape: PhysX.PxShape) {
    return this.shapes.get(this.shapeIDByPointer.get(shape.$$.ptr))
  }

  async createScene(config: PhysXConfig = {}) {
    await loadPhysX()

    this.physxVersion = PhysX.PX_PHYSICS_VERSION
    this.defaultErrorCallback = new PhysX.PxDefaultErrorCallback()
    this.allocator = new PhysX.PxDefaultAllocator()
    const tolerance = new PhysX.PxTolerancesScale()
    tolerance.length = config.lengthScale ?? 1
    this.foundation = PhysX.PxCreateFoundation(this.physxVersion, this.allocator, this.defaultErrorCallback)
    this.cookingParamas = new PhysX.PxCookingParams(tolerance)
    this.cooking = PhysX.PxCreateCooking(this.physxVersion, this.foundation, this.cookingParamas)
    this.physics = PhysX.PxCreatePhysics(this.physxVersion, this.foundation, tolerance, false, null)

    const triggerCallback = {
      onContactBegin: (
        shapeA: PhysX.PxShape,
        shapeB: PhysX.PxShape,
        contactPoints: PhysX.PxVec3Vector,
        contactNormals: PhysX.PxVec3Vector,
        impulses: PhysX.PxRealVector
      ) => {
        const contacts = []
        for (let i = 0; i < contactPoints.size(); i++) {
          if (impulses.get(i) > 0) {
            contacts.push({
              point: contactPoints.get(i),
              normal: contactNormals.get(i),
              impulse: impulses.get(i)
            })
          }
        }
        this.collisionEventQueue.push({
          type: CollisionEvents.COLLISION_START,
          // we have to get our original object ref
          shapeA: this.getOriginalShapeObject(shapeA),
          shapeB: this.getOriginalShapeObject(shapeB),
          contacts
        })
      },
      onContactEnd: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
        this.collisionEventQueue.push({
          type: CollisionEvents.COLLISION_END,
          shapeA: this.getOriginalShapeObject(shapeA),
          shapeB: this.getOriginalShapeObject(shapeB)
        })
      },
      onContactPersist: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
        this.collisionEventQueue.push({
          type: CollisionEvents.COLLISION_PERSIST,
          shapeA: this.getOriginalShapeObject(shapeA),
          shapeB: this.getOriginalShapeObject(shapeB)
        })
      },
      onTriggerBegin: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
        // console.log('onTriggerBegin', shapeA, shapeB)
        this.collisionEventQueue.push({
          type: CollisionEvents.TRIGGER_START,
          shapeA: this.getOriginalShapeObject(shapeA),
          shapeB: this.getOriginalShapeObject(shapeB)
        })
      },
      // onTriggerPersist: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
      //   this.collisionEventQueue.push({
      //     event: CollisionEvents.TRIGGER_PERSIST,
      // bodyA,
      // bodyB,
      // shapeA,
      // shapeB,
      //   });
      // },
      onTriggerEnd: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
        // console.log('onTriggerEnd', shapeA, shapeB)
        this.collisionEventQueue.push({
          event: CollisionEvents.TRIGGER_END,
          shapeA: this.getOriginalShapeObject(shapeA),
          shapeB: this.getOriginalShapeObject(shapeB)
        })
      }
    }

    this.sceneDesc = PhysX.getDefaultSceneDesc(
      tolerance,
      0,
      PhysX.PxSimulationEventCallback.implement(triggerCallback as any)
    )

    this.scene = this.physics.createScene(this.sceneDesc)
    this.scene.setBounceThresholdVelocity(config.bounceThresholdVelocity ?? 0.001)

    this.controllerManager = PhysX.PxCreateControllerManager(this.scene, false)
    this.obstacleContext = this.controllerManager.createObstacleContext()

    this.defaultCCTQueryCallback = PhysX.getDefaultCCTQueryFilter()

    // TODO: expose functions here as an API
    // PhysX.PxQueryFilterCallback.implement({
    //   preFilter: (filterData, shape, actor) => {
    //     if (!(filterData.word0 & shape.getQueryFilterData().word1) && !(shape.getQueryFilterData().word0 & filterData.word1))
    //     {
    //       return PhysX.PxQueryHitType.eNONE;
    //     }
    //     return PhysX.PxQueryHitType.eBLOCK;
    //   },
    //   postFilter: (filterData, hit) => {
    //     // console.log('postFilter', filterData, hit);
    //     return PhysX.PxQueryHitType.eBLOCK;
    //   }
    // });

    if (config.gravity) {
      this.scene.setGravity(config.gravity)
    }
  }

  addBody(config: RigidBody) {
    const { transform, shapes, type } = config
    const id = this._getNextAvailableBodyID()

    const rigidBody =
      type === BodyType.STATIC
        ? this.physics.createRigidStatic(transform)
        : (this.physics.createRigidDynamic(transform) as PhysX.PxRigidStatic | PhysX.PxRigidDynamic)

    ;(rigidBody as any)._type = type
    ;(rigidBody as any)._id = id
    ;(rigidBody as any)._shapes = shapes

    for (const shape of shapes as PhysX.PxShape[]) {
      rigidBody.attachShape(shape)
      this.bodyIDByShapeID.set((shape as any)._id, id)
    }

    this.bodies.set(id, rigidBody)
    this.scene.addActor(rigidBody, null)

    if (!isStaticBody(rigidBody)) {
      if (typeof config.useCCD !== 'undefined') {
        ;(rigidBody as PhysX.PxRigidDynamic).setRigidBodyFlag(PhysX.PxRigidBodyFlag.eENABLE_CCD, config.useCCD)
      }
      if (typeof config.type !== 'undefined') {
        const transform = rigidBody.getGlobalPose()
        if (config.type === BodyType.KINEMATIC) {
          ;(rigidBody as PhysX.PxRigidDynamic).setRigidBodyFlag(PhysX.PxRigidBodyFlag.eKINEMATIC, true)
          ;(rigidBody as any)._type = BodyType.KINEMATIC
        } else {
          ;(rigidBody as PhysX.PxRigidDynamic).setRigidBodyFlag(PhysX.PxRigidBodyFlag.eKINEMATIC, false)
          ;(rigidBody as any)._type = BodyType.DYNAMIC
        }
        rigidBody.setGlobalPose(transform, true)
      }
      if (config.mass) {
        ;(rigidBody as PhysX.PxRigidDynamic).setMass(config.mass)
      }
      if (config.linearDamping) {
        ;(rigidBody as PhysX.PxRigidDynamic).setLinearDamping(config.linearDamping)
      }
      if (config.angularDamping) {
        ;(rigidBody as PhysX.PxRigidDynamic).setAngularDamping(config.angularDamping)
      }
    }
    ;(rigidBody as any).userData = config.userData
    return rigidBody
  }

  createMaterial(staticFriction: number = 0, dynamicFriction: number = 0, restitution: number = 0) {
    return this.physics.createMaterial(staticFriction, dynamicFriction, restitution)
  }

  createShape(
    geometry: PhysX.PxGeometry,
    material = this.createMaterial(),
    translation = new Vector3(),
    rotation = new Quaternion(),
    options: ShapeOptions = {}
  ): PhysX.PxShape {
    if (!geometry) return

    const id = this._getNextAvailableShapeID()

    const flags = new PhysX.PxShapeFlags(
      PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
        (options?.isTrigger ? PhysX.PxShapeFlag.eTRIGGER_SHAPE.value : PhysX.PxShapeFlag.eSIMULATION_SHAPE.value)
    )

    const newTransform = {
      translation: new Vector3().copy(translation),
      rotation: new Quaternion().copy(rotation)
    }

    const shape = this.physics.createShape(geometry, material, false, flags)
    // // rotate 90 degrees on Z axis as PhysX capsule extend along X axis not the Y axis
    // if (shapetype === SHAPES.Capsule) {
    //   quat1.setFromAxisAngle(zVec, halfPI)
    //   quat2.copy(rotation)
    //   quat2.multiply(quat1)
    //   newTransform.rotation.copy(quat2)
    // }
    // // rotate -90 degrees on Y axis as PhysX plane is X+ normaled
    const geometryType = getGeometryType(shape)
    if (geometryType === PhysX.PxGeometryType.ePLANE.value) {
      quat1.setFromAxisAngle(yVec, -halfPI)
      quat2.copy(rotation)
      quat2.multiply(quat1)
      newTransform.rotation.copy(quat2)
    }
    shape.setLocalPose(newTransform as any)

    let collisionLayer = options.collisionLayer ?? defaultMask
    let collisionMask = options.collisionMask ?? defaultMask

    ;(shape as any)._collisionLayer = collisionLayer
    ;(shape as any)._collisionMask = collisionMask

    shape.setSimulationFilterData(new PhysX.PxFilterData(collisionLayer, collisionMask, 0, 0))
    shape.setQueryFilterData(new PhysX.PxFilterData(collisionLayer, collisionMask, 0, 0))
    ;(shape as any)._id = id

    this.shapeIDByPointer.set(shape.$$.ptr, id)
    this.shapes.set(id, shape)

    if (typeof options.contactOffset !== 'undefined') {
      shape.setContactOffset(options.contactOffset)
    }
    if (typeof options.restOffset !== 'undefined') {
      shape.setRestOffset(options.restOffset)
    }

    ;(shape as any)._debugNeedsUpdate = true
    return shape
  }

  createTrimesh(scale: Vector3, vertices: ArrayLike<number>, indices: ArrayLike<number>): PhysX.PxTriangleMeshGeometry {
    const verticesPtr = putIntoPhysXHeap(PhysX.HEAPF32, vertices)
    const indicesPtr = putIntoPhysXHeap(PhysX.HEAPF32, indices)
    const trimesh = this.cooking.createTriMesh(
      verticesPtr,
      vertices.length / 3,
      indicesPtr,
      indices.length / 3,
      false,
      this.physics
    )

    if (trimesh === null) return

    const meshScale = new PhysX.PxMeshScale(scale, new Quaternion())
    const geometry = new PhysX.PxTriangleMeshGeometry(trimesh, meshScale, new PhysX.PxMeshGeometryFlags(0))

    PhysX._free(verticesPtr)
    PhysX._free(indicesPtr)

    return geometry
  }

  createConvexMesh(scale: Vector3, vertices: ArrayLike<number>): PhysX.PxConvexMeshGeometry {
    const verticesPtr = putIntoPhysXHeap(PhysX.HEAPF32, vertices)

    const convexMesh = this.cooking.createConvexMesh(verticesPtr, vertices.length / 3, this.physics)

    const meshScale = new PhysX.PxMeshScale(scale, new Quaternion())
    const geometry = new PhysX.PxConvexMeshGeometry(convexMesh, meshScale, new PhysX.PxConvexMeshGeometryFlags(0))

    PhysX._free(verticesPtr)

    return geometry
  }

  removeBody(body) {
    const id = (body as any)._id
    const shapes = body.getShapes()
    const shapesArray = ((shapes as PhysX.PxShape[]).length ? shapes : [shapes]) as PhysX.PxShape[]
    shapesArray.forEach((shape) => {
      const shapeID = this.shapeIDByPointer.get(shape.$$.ptr)
      this.shapes.delete(shapeID)
      this.shapeIDByPointer.delete(shape.$$.ptr)
      // TODO: properly clean up shape
    })

    if (!body) return
    try {
      this.scene.removeActor(body, false)
      this.bodies.delete(id)
      return true
    } catch (e) {
      console.log(e, id, body)
    }
  }

  createController(config: CapsuleControllerConfig | BoxControllerConfig) {
    const id = this._getNextAvailableBodyID()
    const controllerDesc = config.isCapsule ? new PhysX.PxCapsuleControllerDesc() : new PhysX.PxBoxControllerDesc()
    controllerDesc.setMaterial(config.material)
    controllerDesc.position = { x: config.position?.x ?? 0, y: config.position?.y ?? 0, z: config.position?.z ?? 0 }
    if (config.isCapsule) {
      ;(controllerDesc as PhysX.PxCapsuleControllerDesc).height = (config as CapsuleControllerConfig).height
      ;(controllerDesc as PhysX.PxCapsuleControllerDesc).radius = (config as CapsuleControllerConfig).radius
      ;(controllerDesc as PhysX.PxCapsuleControllerDesc).climbingMode =
        (config as CapsuleControllerConfig).climbingMode ?? PhysX.PxCapsuleClimbingMode.eEASY
    } else {
      ;(controllerDesc as PhysX.PxBoxControllerDesc).halfForwardExtent = (
        config as BoxControllerConfig
      ).halfForwardExtent
      ;(controllerDesc as PhysX.PxBoxControllerDesc).halfHeight = (config as BoxControllerConfig).halfHeight
      ;(controllerDesc as PhysX.PxBoxControllerDesc).halfSideExtent = (config as BoxControllerConfig).halfSideExtent
    }
    controllerDesc.stepOffset = config.stepOffset ?? 0.1
    controllerDesc.maxJumpHeight = config.maxJumpHeight ?? 0.1
    controllerDesc.contactOffset = config.contactOffset ?? 0.01
    controllerDesc.invisibleWallHeight = config.invisibleWallHeight ?? 0
    controllerDesc.slopeLimit = config.slopeLimit ?? Math.cos((45 * Math.PI) / 180)
    controllerDesc.setReportCallback(
      PhysX.PxUserControllerHitReport.implement({
        onShapeHit: (event: PhysX.PxControllerShapeHit) => {
          const shape = event.getShape()
          const shapeID = this.shapeIDByPointer.get(shape.$$.ptr)
          const bodyID = this.bodyIDByShapeID.get(shapeID)
          const position = event.getWorldPos()
          const normal = event.getWorldNormal()
          const length = event.getLength()
          this.collisionEventQueue.push({
            type: ControllerEvents.CONTROLLER_SHAPE_HIT,
            controller,
            bodyID,
            shapeID,
            position,
            normal,
            length
          })
        },
        onControllerHit: (event: PhysX.PxControllersHit) => {
          const other = event.getOther()
          const bodyID = this.controllerIDByPointer.get(other.$$.ptr)
          const shapeID = this.shapeIDByPointer.get((other.getActor().getShapes() as PhysX.PxShape).$$.ptr)
          const position = event.getWorldPos()
          const normal = event.getWorldNormal()
          const length = event.getLength()
          this.collisionEventQueue.push({
            type: ControllerEvents.CONTROLLER_CONTROLLER_HIT,
            controller,
            bodyID,
            shapeID,
            position,
            normal,
            length
          })
        },
        onObstacleHit: (event: PhysX.PxControllerObstacleHit) => {
          const obstacleID = event.getUserData()
          // TODO
          // const data = getFromPhysXHeap(PhysX.HEAPU32, ptr, 1);
          const position = event.getWorldPos()
          const normal = event.getWorldNormal()
          const length = event.getLength()
          this.collisionEventQueue.push({
            type: ControllerEvents.CONTROLLER_OBSTACLE_HIT,
            controller,
            obstacleID,
            position,
            normal,
            length
          })
        }
      })
    )
    if (!controllerDesc.isValid()) {
      console.warn('[WARN] Controller Description invalid!')
    }
    const controller = config.isCapsule
      ? this.controllerManager.createCapsuleController(controllerDesc)
      : this.controllerManager.createBoxController(controllerDesc)
    this.controllers.set(id, controller)
    this.controllerIDByPointer.set(controller.$$.ptr, id)
    const actor = controller.getActor()
    this.bodies.set(id, actor)
    const shapes = actor.getShapes() as PhysX.PxShape
    const shapeid = this._getNextAvailableShapeID()
    ;(actor as any)._shapes = [shapes]
    this.shapeIDByPointer.set(shapes.$$.ptr, id)
    this.shapes.set(shapeid, shapes)
    ;(shapes as any)._id = shapeid
    ;(actor as any)._type = BodyType.CONTROLLER
    ;(actor as any)._debugNeedsUpdate = true
    ;(controller as any)._id = id
    return controller
  }

  // @todo:

  // updateController = (controller: PhysX.PxController) => {
  //   if (typeof config.position !== 'undefined') {
  //     const currentPos = controller.getPosition()
  //     controller.setPosition({
  //       x: config.position.x ?? currentPos.x,
  //       y: config.position.y ?? currentPos.y,
  //       z: config.position.z ?? currentPos.z
  //     })
  //   }
  //   if (typeof config.height !== 'undefined') {
  //     ; (controller as PhysX.PxCapsuleController).setHeight(config.height)
  //   }
  //   if (typeof config.resize !== 'undefined') {
  //     ; (controller as PhysX.PxController).resize(config.resize)
  //   }
  //   if (typeof config.radius !== 'undefined') {
  //     ; (controller as PhysX.PxCapsuleController).setRadius(config.radius)
  //   }
  //   if (typeof config.climbingMode !== 'undefined') {
  //     ; (controller as PhysX.PxCapsuleController).setClimbingMode(config.climbingMode)
  //   }
  //   if (typeof config.halfForwardExtent !== 'undefined') {
  //     ; (controller as PhysX.PxBoxController).setHalfForwardExtent(config.halfForwardExtent)
  //   }
  //   if (typeof config.halfHeight !== 'undefined') {
  //     ; (controller as PhysX.PxBoxController).setHalfHeight(config.halfHeight)
  //   }
  //   if (typeof config.halfSideExtent !== 'undefined') {
  //     ; (controller as PhysX.PxBoxController).setHalfSideExtent(config.halfSideExtent)
  //   }
  //   if (typeof config.collisionLayer !== 'undefined') {
  //     ; (controller as any)._filterData.word0 = config.collisionLayer
  //   }
  //   if (typeof config.collisionMask !== 'undefined') {
  //     ; (controller as any)._filterData.word1 = config.collisionMask
  //   }
  //   return config
  // }

  removeController(controller: PhysX.PxController) {
    const id = (controller as any)._id
    const actor = controller.getActor()
    const shapes = actor.getShapes() as PhysX.PxShape
    this.controllerIDByPointer.delete(controller.$$.ptr)
    this.shapeIDByPointer.delete(shapes.$$.ptr)
    this.controllers.delete(id)
    this.bodies.delete(id)
    controller.release()
    // todo
  }

  addObstacle({ id, isCapsule, position, rotation, halfExtents, halfHeight, radius }) {
    const obstacle = new (isCapsule ? PhysX.PxCapsuleObstacle : PhysX.PxBoxObstacle)()
    // todo: allow for more than a single int in memory for userData
    obstacle.setUserData(putIntoPhysXHeap(PhysX.HEAPU32, [id]))
    obstacle.setPosition(position)
    obstacle.setRotation(rotation)
    halfExtents && (obstacle as PhysX.PxBoxObstacle).setHalfExtents(halfExtents)
    halfHeight && (obstacle as PhysX.PxCapsuleObstacle).setHalfHeight(halfHeight)
    radius && (obstacle as PhysX.PxCapsuleObstacle).setRadius(radius)
    const handle = this.obstacleContext.addObstacle(obstacle)
    this.obstacles.set(id, handle)
  }

  removeObstacle(id: number) {
    const handle = this.obstacles.get(id)
    this.obstacleContext.removeObstacle(handle)
    this.obstacles.delete(id)
  }

  getRigidbodyShapes(body: PhysX.PxRigidActor) {
    const shapes = body.getShapes()
    return ((shapes as PhysX.PxShape[]).length ? shapes : [shapes]) as PhysX.PxShape[]
  }

  doRaycast(raycastQuery: ComponentType<typeof RaycastComponent>) {
    raycastQuery.hits = []
    if (raycastQuery.type === SceneQueryType.Closest) {
      const buffer = new PhysX.PxRaycastHit()
      // todo - implement query filter bindings
      // const queryCallback = PhysX.PxQueryFilterCallback.implement({
      //   preFilter: (filterData, shape, actor) => { return PhysX.PxQueryHitType.eBLOCK },
      //   postFilter: (filterData, hit) => { return PhysX.PxQueryHitType.eBLOCK  }
      // });
      const hasHit = this.scene.raycastSingle(
        raycastQuery.origin,
        raycastQuery.direction,
        raycastQuery.maxDistance,
        raycastQuery.flags,
        buffer,
        raycastQuery.filterData
      )
      if (hasHit) {
        const shape = buffer.getShape()
        if (shape) {
          raycastQuery.hits.push({
            distance: buffer.distance,
            normal: buffer.normal,
            position: buffer.position,
            _bodyID: this.bodyIDByShapeID.get(this.shapeIDByPointer.get(shape.$$.ptr))
          })
        }
      }
    }
    // const buffer: PhysX.PxRaycastBuffer = PhysX.allocateRaycastHitBuffers(raycastQuery.maxHits);
    // const hasHit = this.scene.raycast(raycastQuery.origin, raycastQuery.direction, raycastQuery.maxDistance, buffer);
    // if (hasHit) {

    // if(raycastQuery.flags) {
    //   for (let index = 0; index < buffer.getNbTouches(); index++) {

    //   }
    // } else {
    //   for (let index = 0; index < buffer.getNbAnyHits(); index++) {
    //     const touch = buffer.getAnyHit(index);
    //     const shape = this.shapeIDByPointer.get(touch.getShape().$$.ptr);
    //     hits.push({
    //       shape,
    //     });
    //   }
    // }
    // }
  }
  private _getNextAvailableBodyID() {
    // todo, make this smart
    return nextAvailableBodyIndex++
  }

  private _getNextAvailableShapeID() {
    // todo, make this smart
    return nextAvailableShapeID++
  }

  private _getNextAvailableRaycastID() {
    // todo, make this smart
    return nextAvailableRaycastID++
  }

  private _getNextAvailableObstacleID() {
    // todo, make this smart
    return nextAvailableObstacleID++
  }
}

// TODO double check this
export const isTriggerShape = (shape: PhysX.PxShape) => {
  return shape.getFlags().isSet(PhysX.PxShapeFlag.eTRIGGER_SHAPE)
}

// TODO double check this
export const getGeometryType = (shape: PhysX.PxShape) => {
  return (shape.getGeometry().getType() as any).value
}

export const isKinematicBody = (body: PhysX.PxRigidActor) => {
  return (body as any)._type === BodyType.KINEMATIC
}

export const isControllerBody = (body: PhysX.PxRigidActor) => {
  return (body as any)._type === BodyType.CONTROLLER
}

export const isDynamicBody = (body: PhysX.PxRigidActor) => {
  return (body as any)._type === BodyType.DYNAMIC
}

export const isStaticBody = (body: PhysX.PxRigidActor) => {
  return (body as any)._type === BodyType.STATIC
}
