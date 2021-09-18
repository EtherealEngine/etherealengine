import { defineQuery } from 'bitecs'
import {
  Mesh,
  Points,
  SphereBufferGeometry,
  BoxBufferGeometry,
  PlaneBufferGeometry,
  BufferGeometry,
  MeshBasicMaterial,
  Vector3,
  Matrix4,
  Quaternion,
  LineBasicMaterial,
  Line,
  MeshStandardMaterial,
  Material,
  Float32BufferAttribute
} from 'three'
import { CapsuleBufferGeometry } from '../../common/classes/CapsuleBufferGeometry'
import { Engine } from '../../ecs/classes/Engine'
import { World } from '../../ecs/classes/World'
import { getGeometryType, isControllerBody, isTriggerShape } from '../../physics/classes/Physics'
import { RaycastComponent } from '../../physics/components/RaycastComponent'
import { BodyType } from '../../physics/types/PhysicsTypes'

const parentMatrix = new Matrix4()
const childMatrix = new Matrix4()
const pos = new Vector3()
const rot = new Quaternion()
const quat = new Quaternion()
const scale = new Vector3(1, 1, 1)
const scale2 = new Vector3(1, 1, 1)
const halfPI = Math.PI / 2

const raycastQuery = defineQuery([RaycastComponent])

export const DebugRenderer = () => {
  const _meshes: Map<number, any> = new Map<number, any>()
  const _obstacles: Map<number, any> = new Map<number, any>()
  const _raycasts: Map<number, any> = new Map<number, any>()
  const _materials: Material[] = [
    new MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
    new MeshBasicMaterial({ color: 0x00ff00, wireframe: true }),
    new MeshBasicMaterial({ color: 0x00aaff, wireframe: true }),
    new MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
    new MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.25 }),
    new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
  ]
  const _sphereGeometry = new SphereBufferGeometry(1)
  const _boxGeometry = new BoxBufferGeometry()
  const _planeGeometry = new PlaneBufferGeometry(10000, 10000, 100, 100)
  const _lineMaterial = new LineBasicMaterial({ color: 0x0000ff })
  let enabled = false

  const setEnabled = (_enabled) => {
    enabled = _enabled
    if (!_enabled) {
      _meshes.forEach((mesh) => {
        Engine.scene.remove(mesh)
      })
      _raycasts.forEach((mesh) => {
        Engine.scene.remove(mesh)
      })
      _obstacles.forEach((mesh) => {
        Engine.scene.remove(mesh)
      })
      _meshes.clear()
      _raycasts.clear()
      _obstacles.clear()
    }
  }

  function _updateRaycast(raycast, id) {
    let line = _raycasts.get(id)
    if (!line) {
      line = new Line(
        new BufferGeometry().setFromPoints([
          new Vector3().add(raycast.origin),
          new Vector3().add(raycast.origin).add(raycast.direction)
        ]),
        _lineMaterial
      )
      Engine.scene.add(line)
      _raycasts.set(id, line)
    } else {
      line.geometry.setFromPoints([
        new Vector3().add(raycast.origin),
        new Vector3().add(raycast.direction).multiplyScalar(raycast.maxDistance).add(raycast.origin)
      ])
    }
  }

  function _updateObstacle(obstacle: PhysX.PxObstacle, id) {
    if (!_obstacles.get(id)) {
      let geom
      if ((obstacle as any)._isCapsule) {
        const radius = (obstacle as PhysX.PxCapsuleObstacle).getRadius()
        const halfHeight = (obstacle as PhysX.PxCapsuleObstacle).getHalfHeight()
        geom = new CapsuleBufferGeometry(radius, radius, halfHeight * 2)
      } else {
        const halfExtents = (obstacle as PhysX.PxBoxObstacle).getHalfExtents()
        geom = new BoxBufferGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2)
      }
      const mesh = new Mesh(geom, _materials[5])
      mesh.position.copy(obstacle.getPosition() as Vector3)
      mesh.quaternion.copy(obstacle.getRotation() as Quaternion)
      Engine.scene.add(mesh)
      _obstacles.set(id, mesh)
    }
  }

  function _updateController(body: PhysX.PxRigidActor) {
    const shape = (body as any)._shapes[0] as PhysX.PxShape
    const id = shape._id
    let mesh = _meshes.get(id)
    let needsUpdate = false
    if ((body as any)._debugNeedsUpdate) {
      if (mesh) {
        Engine.scene.remove(mesh)
        needsUpdate = true
      }
      delete (body as any)._debugNeedsUpdate
    }

    if (!mesh || needsUpdate) {
      const geometryType = getGeometryType(shape)
      if (geometryType === PhysX.PxGeometryType.eCAPSULE.value) {
        const geometry = new PhysX.PxCapsuleGeometry(1, 1)
        shape.getCapsuleGeometry(geometry)
        mesh = new Mesh(
          new CapsuleBufferGeometry(
            clampNonzeroPositive(geometry.radius / 0.8),
            clampNonzeroPositive(geometry.radius / 0.8),
            clampNonzeroPositive(geometry.halfHeight / 0.8) * 2
          ),
          _materials[BodyType.CONTROLLER]
        )
      } else {
        const geometry = new PhysX.PxBoxGeometry(1, 1, 1)
        shape.getBoxGeometry(geometry)
        const { x, y, z } = geometry.halfExtents
        mesh = new Mesh(
          new BoxBufferGeometry(clampNonzeroPositive(x * 2), clampNonzeroPositive(y * 2), clampNonzeroPositive(z * 2)),
          _materials[BodyType.CONTROLLER]
        )
      }
      _meshes.set(id, mesh)
      Engine.scene.add(mesh)
    }
  }

  function _updateMesh(body: PhysX.PxRigidActor, id: number, shape: PhysX.PxShape) {
    let mesh = _meshes.get(id)
    let needsUpdate = false
    if ((shape as any)._debugNeedsUpdate) {
      if (mesh) {
        Engine.scene.remove(mesh)
        needsUpdate = true
      }
      delete (shape as any)._debugNeedsUpdate
    }
    if (!mesh || needsUpdate) {
      mesh = _createMesh(shape, body)
      _meshes.set(id, mesh)
    }
  }

  function _createMesh(shape: PhysX.PxShape, body: PhysX.PxRigidActor): Mesh | Points {
    const isTrigger = isTriggerShape(shape)
    const geometryType = getGeometryType(shape)
    let mesh: Mesh
    const material: Material = _materials[isTrigger ? 4 : (body as any)._type]

    switch (geometryType) {
      case PhysX.PxGeometryType.eSPHERE.value: {
        const geometry = new PhysX.PxSphereGeometry(1)
        shape.getSphereGeometry(geometry)
        const radius = clampNonzeroPositive(geometry.radius)
        mesh = new Mesh(_sphereGeometry, material)
        mesh.scale.set(radius, radius, radius)
        break
      }

      case PhysX.PxGeometryType.eCAPSULE.value: {
        const geometry = new PhysX.PxCapsuleGeometry(1, 1)
        shape.getCapsuleGeometry(geometry)
        mesh = new Mesh(
          new CapsuleBufferGeometry(
            clampNonzeroPositive(geometry.radius),
            clampNonzeroPositive(geometry.radius),
            clampNonzeroPositive(geometry.halfHeight) * 2
          ),
          material
        )
        break
      }

      case PhysX.PxGeometryType.eBOX.value: {
        const geometry = new PhysX.PxBoxGeometry(1, 1, 1)
        shape.getBoxGeometry(geometry)
        const { x, y, z } = geometry.halfExtents
        mesh = new Mesh(_boxGeometry, material)
        mesh.scale.set(clampNonzeroPositive(x), clampNonzeroPositive(y), clampNonzeroPositive(z)).multiplyScalar(2)
        break
      }

      case PhysX.PxGeometryType.ePLANE.value: {
        mesh = new Mesh(_planeGeometry.clone(), material)
        mesh.quaternion.copy(shape.getLocalPose().rotation as Quaternion)
        // idk
        mesh.geometry.rotateY(-halfPI)
        mesh.geometry.rotateX(-halfPI)
        break
      }

      case PhysX.PxGeometryType.eCONVEXMESH.value: {
        const verts = (shape as any)._vertices
        const indices = (shape as any)._indices
        const scale = (shape as any)._scale
        const bufferGeometry = new BufferGeometry()
        bufferGeometry.setAttribute('position', new Float32BufferAttribute(verts, 3))
        bufferGeometry.setIndex(indices)
        bufferGeometry.scale(scale.x, scale.y, scale.z)
        mesh = new Mesh(bufferGeometry, material)
        break
      }

      case PhysX.PxGeometryType.eTRIANGLEMESH.value: {
        const verts = (shape as any)._vertices
        const indices = (shape as any)._indices
        const scale = (shape as any)._scale
        const bufferGeometry = new BufferGeometry()
        bufferGeometry.setAttribute('position', new Float32BufferAttribute(verts, 3))
        bufferGeometry.setIndex(indices)
        bufferGeometry.scale(scale.x, scale.y, scale.z)
        mesh = new Mesh(bufferGeometry, material)
        break
      }
      default:
        mesh = new Mesh()
        break
    }

    if (mesh && mesh.geometry) {
      Engine.scene.add(mesh)
    }

    return mesh
  }

  return (world: World, _enabled: boolean) => {
    if (enabled !== _enabled) {
      enabled = _enabled
      setEnabled(_enabled)
    }

    world.physics.bodies.forEach((body: PhysX.PxRigidActor) => {
      const pose = body.getGlobalPose()
      pos.set(pose.translation.x, pose.translation.y, pose.translation.z)
      if (isControllerBody(body)) {
        const controllerShapeID = (body as any)._shapes[0]._id
        _updateController(body as any)
        _meshes.get(controllerShapeID).position.copy(pos)
        return
      }
      rot.set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w)
      parentMatrix.compose(pos, rot, scale)
      ;(body as any)._shapes?.forEach((shape: PhysX.PxShape) => {
        const localPose = shape.getLocalPose()
        _updateMesh(body, (shape as any)._id, shape)

        if (_meshes.get((shape as any)._id)) {
          // Copy to meshes
          pos.set(localPose.translation.x, localPose.translation.y, localPose.translation.z)
          rot.set(localPose.rotation.x, localPose.rotation.y, localPose.rotation.z, localPose.rotation.w)
          childMatrix.compose(pos, rot, scale)
          childMatrix.premultiply(parentMatrix)
          childMatrix.decompose(pos, rot, scale2)
          _meshes.get((shape as any)._id).position.copy(pos)
          _meshes.get((shape as any)._id).quaternion.copy(rot)
        }
      })
    })
    // world.physics.raycasts.forEach((raycast, id) => {
    //   _updateRaycast(raycast, id)
    // })
    world.physics.obstacles.forEach((obstacle, id) => {
      _updateObstacle(obstacle, id)
    })
    _obstacles.forEach((mesh, id) => {
      if (!world.physics.obstacles.has(id)) {
        Engine.scene.remove(mesh)
        _meshes.delete(id)
      }
    })
    _meshes.forEach((mesh, id) => {
      if (!world.physics.shapes.has(id)) {
        Engine.scene.remove(mesh)
        _meshes.delete(id)
      }
    })
  }
}

const clampNonzeroPositive = (num) => {
  return Math.max(0.00001, num)
}
