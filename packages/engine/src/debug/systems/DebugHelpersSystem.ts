import {
  ArrowHelper,
  Box3,
  Box3Helper,
  Color,
  ConeBufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector3
} from 'three'
import { AvatarComponent } from '../../avatar/components/AvatarComponent'
import { XRInputSourceComponent } from '../../avatar/components/XRInputSourceComponent'
import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import { defineQuery, getComponent } from '../../ecs/functions/ComponentFunctions'
import { BoundingBoxComponent } from '../../interaction/components/BoundingBoxComponent'
import { NavMeshComponent } from '../../navigation/component/NavMeshComponent'
import { createConvexRegionHelper } from '../../navigation/NavMeshHelper'
import { createGraphHelper } from '../../navigation/GraphHelper'
import { ColliderComponent } from '../../physics/components/ColliderComponent'
import { VelocityComponent } from '../../physics/components/VelocityComponent'
import { Object3DComponent } from '../../scene/components/Object3DComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { DebugArrowComponent } from '../DebugArrowComponent'
import { DebugRenderer } from './DebugRenderer'
import { DebugNavMeshComponent } from '../DebugNavMeshComponent'
import { System } from '../../ecs/classes/System'
import { World } from '../../ecs/classes/World'
import { isStaticBody } from '../../physics/classes/Physics'

type ComponentHelpers = 'viewVector' | 'ikExtents' | 'helperArrow' | 'velocityArrow' | 'box' | 'navmesh' | 'navpath'

const vector3 = new Vector3()
const quat = new Quaternion()

const cubeGeometry = new ConeBufferGeometry(0.05, 0.25, 4)
cubeGeometry.rotateX(-Math.PI * 0.5)

export class DebugHelpers {
  static helpersByEntity: Record<ComponentHelpers, Map<Entity, any>> = {
    viewVector: new Map(),
    ikExtents: new Map(),
    box: new Map(),
    helperArrow: new Map(),
    velocityArrow: new Map(),
    navmesh: new Map(),
    navpath: new Map()
  }

  static physicsDebugRenderer: any

  static physicsDebugEnabled = false
  static avatarDebugEnabled = false

  static toggleDebugPhysics = (enabled) => {
    DebugHelpers.physicsDebugEnabled = enabled
    DebugHelpers.physicsDebugRenderer.setEnabled(enabled)
    DebugHelpers.helpersByEntity.helperArrow.forEach((obj: Object3D) => {
      obj.visible = enabled
    })
    DebugHelpers.helpersByEntity.box.forEach((entry: Object3D[]) => {
      entry.forEach((obj) => (obj.visible = enabled))
    })
  }

  static toggleDebugAvatar = (enabled) => {
    DebugHelpers.avatarDebugEnabled = enabled
    DebugHelpers.helpersByEntity.viewVector.forEach((obj: Object3D) => {
      obj.visible = enabled
    })
    DebugHelpers.helpersByEntity.velocityArrow.forEach((obj: Object3D) => {
      obj.visible = enabled
    })
    DebugHelpers.helpersByEntity.ikExtents.forEach((entry: Object3D[]) => {
      entry.forEach((obj) => (obj.visible = enabled))
    })
  }
}

export default async function DebugHelpersSystem(world: World): Promise<System> {
  DebugHelpers.physicsDebugRenderer = DebugRenderer()

  const avatarDebugQuery = defineQuery([AvatarComponent])
  const boundingBoxQuery = defineQuery([BoundingBoxComponent])
  const colliderQuery = defineQuery([ColliderComponent])
  const arrowHelperQuery = defineQuery([DebugArrowComponent])
  const ikAvatarQuery = defineQuery([XRInputSourceComponent])
  const navmeshQuery = defineQuery([DebugNavMeshComponent, NavMeshComponent])
  // const navpathQuery = defineQuery([AutoPilotComponent])
  // const navpathAddQuery = enterQuery(navpathQuery)
  // const navpathRemoveQuery = exitQuery(navpathQuery)

  return () => {
    // ===== AVATAR ===== //

    for (const entity of avatarDebugQuery.enter()) {
      const avatar = getComponent(entity, AvatarComponent)

      // view vector
      const origin = new Vector3(0, 2, 0)
      const length = 0.5
      const hex = 0xffff00
      if (!avatar || !avatar.viewVector) {
        console.warn('avatar.viewVector is null')
        continue
      }
      // const arrowHelper = new ArrowHelper(avatar.viewVector.clone().normalize(), origin, length, hex)
      // arrowHelper.visible = DebugHelpers.avatarDebugEnabled
      // Engine.scene.add(arrowHelper)
      // DebugHelpers.helpersByEntity.viewVector.set(entity, arrowHelper)

      // velocity
      const velocityColor = 0x0000ff
      const velocityArrowHelper = new ArrowHelper(new Vector3(), new Vector3(0, 0, 0), 0.5, velocityColor)
      velocityArrowHelper.visible = DebugHelpers.avatarDebugEnabled
      Engine.scene.add(velocityArrowHelper)
      DebugHelpers.helpersByEntity.velocityArrow.set(entity, velocityArrowHelper)
    }

    for (const entity of avatarDebugQuery.exit()) {
      // view vector
      // const arrowHelper = DebugHelpers.helpersByEntity.viewVector.get(entity) as Object3D
      // Engine.scene.remove(arrowHelper)
      // DebugHelpers.helpersByEntity.viewVector.delete(entity)

      // velocity
      const velocityArrowHelper = DebugHelpers.helpersByEntity.velocityArrow.get(entity) as Object3D
      Engine.scene.remove(velocityArrowHelper)
      DebugHelpers.helpersByEntity.velocityArrow.delete(entity)
    }

    for (const entity of avatarDebugQuery()) {
      // view vector
      const avatar = getComponent(entity, AvatarComponent)
      const velocity = getComponent(entity, VelocityComponent)
      const transform = getComponent(entity, TransformComponent)
      // const arrowHelper = DebugHelpers.helpersByEntity.viewVector.get(entity) as ArrowHelper

      // if (arrowHelper != null) {
      //   arrowHelper.setDirection(vector3.copy(avatar.viewVector).setY(0).normalize())
      //   arrowHelper.position.copy(transform.position).y += avatar.avatarHalfHeight
      // }

      // velocity
      const velocityArrowHelper = DebugHelpers.helpersByEntity.velocityArrow.get(entity) as ArrowHelper
      if (velocityArrowHelper != null) {
        velocityArrowHelper.setDirection(vector3.copy(velocity.velocity).normalize())
        velocityArrowHelper.setLength(velocity.velocity.length() * 20)
        velocityArrowHelper.position.copy(transform.position).y += avatar.avatarHalfHeight
      }
    }

    for (const entity of ikAvatarQuery.enter()) {
      const debugHead = new Mesh(cubeGeometry, new MeshBasicMaterial({ color: new Color('red'), side: DoubleSide }))
      const debugLeft = new Mesh(cubeGeometry, new MeshBasicMaterial({ color: new Color('yellow') }))
      const debugRight = new Mesh(cubeGeometry, new MeshBasicMaterial({ color: new Color('blue') }))
      debugHead.visible = DebugHelpers.avatarDebugEnabled
      debugLeft.visible = DebugHelpers.avatarDebugEnabled
      debugRight.visible = DebugHelpers.avatarDebugEnabled
      Engine.scene.add(debugHead)
      Engine.scene.add(debugLeft)
      Engine.scene.add(debugRight)
      DebugHelpers.helpersByEntity.ikExtents.set(entity, [debugHead, debugLeft, debugRight])
    }

    for (const entity of ikAvatarQuery()) {
      const xrInputSourceComponent = getComponent(entity, XRInputSourceComponent)
      const [debugHead, debugLeft, debugRight] = DebugHelpers.helpersByEntity.ikExtents.get(entity) as Object3D[]
      debugHead.position.copy(xrInputSourceComponent.head.getWorldPosition(vector3))
      debugHead.quaternion.copy(xrInputSourceComponent.head.getWorldQuaternion(quat))
      debugLeft.position.copy(xrInputSourceComponent.controllerLeft.getWorldPosition(vector3))
      debugLeft.quaternion.copy(xrInputSourceComponent.controllerLeft.getWorldQuaternion(quat))
      debugRight.position.copy(xrInputSourceComponent.controllerRight.getWorldPosition(vector3))
      debugRight.quaternion.copy(xrInputSourceComponent.controllerRight.getWorldQuaternion(quat))
    }

    for (const entity of ikAvatarQuery.exit()) {
      ;(DebugHelpers.helpersByEntity.ikExtents.get(entity) as Object3D[]).forEach((obj: Object3D) => {
        obj.removeFromParent()
      })
      DebugHelpers.helpersByEntity.ikExtents.delete(entity)
    }

    // ===== COLLIDERS ===== //

    for (const entity of colliderQuery.exit()) {
      // view vector
      const arrowHelper = DebugHelpers.helpersByEntity.viewVector.get(entity) as Object3D
      Engine.scene.remove(arrowHelper)
      DebugHelpers.helpersByEntity.viewVector.delete(entity)

      // velocity
      const velocityArrowHelper = DebugHelpers.helpersByEntity.velocityArrow.get(entity) as Object3D
      Engine.scene.remove(velocityArrowHelper)
      DebugHelpers.helpersByEntity.velocityArrow.delete(entity)
    }

    for (const entity of colliderQuery.enter()) {
      const collider = getComponent(entity, ColliderComponent)
      if (isStaticBody(collider.body)) continue

      // view vector
      const origin = new Vector3(0, 2, 0)
      const length = 0.5
      const hex = 0xffff00

      const arrowHelper = new ArrowHelper(
        vector3.copy(collider.body.getGlobalPose().translation as Vector3).normalize(),
        origin,
        length,
        hex
      )
      arrowHelper.visible = DebugHelpers.avatarDebugEnabled
      Engine.scene.add(arrowHelper)
      DebugHelpers.helpersByEntity.viewVector.set(entity, arrowHelper)

      // velocity
      const velocityColor = 0x0000ff
      const velocityArrowHelper = new ArrowHelper(new Vector3(), new Vector3(0, 0, 0), 0.5, velocityColor)
      velocityArrowHelper.visible = DebugHelpers.avatarDebugEnabled
      Engine.scene.add(velocityArrowHelper)
      DebugHelpers.helpersByEntity.velocityArrow.set(entity, velocityArrowHelper)
    }

    for (const entity of colliderQuery()) {
      // view vector
      const collider = getComponent(entity, ColliderComponent)
      const transform = getComponent(entity, TransformComponent)
      const arrowHelper = DebugHelpers.helpersByEntity.viewVector.get(entity) as ArrowHelper

      if (arrowHelper != null) {
        arrowHelper.setDirection(
          new Vector3()
            .copy(collider.body.getGlobalPose().translation as Vector3)
            .setY(0)
            .normalize()
        )
        arrowHelper.position.copy(transform.position)
      }

      // velocity
      const velocityArrowHelper = DebugHelpers.helpersByEntity.velocityArrow.get(entity) as ArrowHelper
      if (velocityArrowHelper != null) {
        const vel = new Vector3().copy(collider.body.getLinearVelocity() as Vector3)
        velocityArrowHelper.setLength(vel.length() * 60)
        velocityArrowHelper.setDirection(vel.normalize())
        velocityArrowHelper.position.copy(transform.position)
      }
    }

    // ===== INTERACTABLES ===== //

    // bounding box
    for (const entity of boundingBoxQuery.enter()) {
      DebugHelpers.helpersByEntity.box.set(entity, [])
      const boundingBox = getComponent(entity, BoundingBoxComponent)
      const box3 = new Box3()
      box3.copy(boundingBox.box)
      if (boundingBox.dynamic) {
        const object3D = getComponent(entity, Object3DComponent)
        box3.applyMatrix4(object3D.value.matrixWorld)
      }
      const helper = new Box3Helper(box3)
      helper.visible = DebugHelpers.physicsDebugEnabled
      Engine.scene.add(helper)
      ;(DebugHelpers.helpersByEntity.box.get(entity) as Object3D[]).push(helper)
    }

    for (const entity of boundingBoxQuery.exit()) {
      const boxes = DebugHelpers.helpersByEntity.box.get(entity) as Object3D[]
      boxes.forEach((box) => {
        Engine.scene.remove(box)
      })
      DebugHelpers.helpersByEntity.box.delete(entity)
    }

    // ===== CUSTOM ===== //

    for (const entity of arrowHelperQuery.enter()) {
      const arrow = getComponent(entity, DebugArrowComponent)
      const arrowHelper = new ArrowHelper(new Vector3(), new Vector3(0, 0, 0), 0.5, arrow.color)
      arrowHelper.visible = DebugHelpers.physicsDebugEnabled
      Engine.scene.add(arrowHelper)
      DebugHelpers.helpersByEntity.helperArrow.set(entity, arrowHelper)
    }

    for (const entity of arrowHelperQuery.exit()) {
      const arrowHelper = DebugHelpers.helpersByEntity.helperArrow.get(entity) as Object3D
      Engine.scene.remove(arrowHelper)
      DebugHelpers.helpersByEntity.helperArrow.delete(entity)
    }

    for (const entity of arrowHelperQuery()) {
      const arrow = getComponent(entity, DebugArrowComponent)
      const arrowHelper = DebugHelpers.helpersByEntity.helperArrow.get(entity) as ArrowHelper
      if (arrowHelper != null) {
        arrowHelper.setDirection(arrow.direction.clone().normalize())
        arrowHelper.setLength(arrow.direction.length())
        arrowHelper.position.copy(arrow.position)
      }
    }

    // ===== NAVMESH Helper ===== //
    for (const entity of navmeshQuery.enter()) {
      console.log('add navmesh helper!')
      const navMesh = getComponent(entity, NavMeshComponent)?.yukaNavMesh
      const convexHelper = createConvexRegionHelper(navMesh)
      const graphHelper = createGraphHelper(navMesh.graph, 0.2)
      const helper = new Group()
      helper.add(convexHelper)
      helper.add(graphHelper)
      console.log('navhelper', helper)
      Engine.scene.add(helper)
      DebugHelpers.helpersByEntity.navmesh.set(entity, helper)
    }
    for (const entity of navmeshQuery()) {
      // update
      const helper = DebugHelpers.helpersByEntity.navmesh.get(entity) as Object3D
      const transform = getComponent(entity, TransformComponent)
      helper.position.copy(transform.position)
      // helper.quaternion.copy(transform.rotation)
    }
    for (const entity of navmeshQuery.exit()) {
      const helper = DebugHelpers.helpersByEntity.navmesh.get(entity) as Object3D
      Engine.scene.remove(helper)
      DebugHelpers.helpersByEntity.navmesh.delete(entity)
    }
    // ===== Autopilot Helper ===== //
    // TODO add createPathHelper for navpathQuery

    DebugHelpers.physicsDebugRenderer(world, DebugHelpers.physicsDebugEnabled)
  }
}
