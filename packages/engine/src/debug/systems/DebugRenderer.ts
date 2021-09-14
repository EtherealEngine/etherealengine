import {
  Scene,
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
  BufferAttribute
} from 'three'
import { CapsuleBufferGeometry } from '../../common/classes/CapsuleBufferGeometry'
import { World } from '../../ecs/classes/World'
import { isControllerBody } from '../../physics/classes/Physics'
import { BodyType, SHAPES } from '../../physics/types/PhysicsTypes'

const parentMatrix = new Matrix4()
const childMatrix = new Matrix4()
const pos = new Vector3()
const rot = new Quaternion()
const quat = new Quaternion()
const scale = new Vector3(1, 1, 1)
const scale2 = new Vector3(1, 1, 1)

export class DebugRenderer {
  private scene: Scene
  private _meshes: Map<number, any> = new Map<number, any>()
  private _obstacles: Map<number, any> = new Map<number, any>()
  private _raycasts: Map<number, any> = new Map<number, any>()
  private _materials: Material[]
  private _sphereGeometry: SphereBufferGeometry
  private _boxGeometry: BoxBufferGeometry
  private _planeGeometry: PlaneBufferGeometry
  private _lineMaterial: LineBasicMaterial

  public enabled: boolean

  constructor(scene: Scene) {
    this.scene = scene
    this.enabled = false

    this._materials = [
      new MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
      new MeshBasicMaterial({ color: 0x00ff00, wireframe: true }),
      new MeshBasicMaterial({ color: 0x00aaff, wireframe: true }),
      new MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
      new MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.25 }),
      new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    ]

    this._lineMaterial = new LineBasicMaterial({ color: 0x0000ff })
    this._sphereGeometry = new SphereBufferGeometry(1)
    this._boxGeometry = new BoxBufferGeometry()
    this._planeGeometry = new PlaneBufferGeometry(10000, 10000, 100, 100)
  }

  public setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled) {
      this._meshes.forEach((mesh) => {
        this.scene.remove(mesh)
      })
      this._raycasts.forEach((mesh) => {
        this.scene.remove(mesh)
      })
      this._obstacles.forEach((mesh) => {
        this.scene.remove(mesh)
      })
      this._meshes.clear()
      this._raycasts.clear()
      this._obstacles.clear()
    }
  }

  public update(world: World) {
    if (!this.enabled) {
      return
    }

    world.physics.bodies.forEach((body: PhysX.PxRigidActor) => {
      const pose = body.getGlobalPose()
      pos.set(pose.translation.x, pose.translation.y, pose.translation.z)
      if (isControllerBody(body)) {
        const controllerShapeID = (body as any)._shape.id
        this._updateController(body as any, controllerShapeID)
        this._meshes.get(controllerShapeID).position.copy(pos)
        return
      }
      rot.set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w)
      parentMatrix.compose(pos, rot, scale)

      world.physics.getRigidbodyShapes(body).forEach((shape) => {
        const localPose = shape.getLocalPose()
        this._updateMesh(body, (shape as any)._id, shape)

        if (this._meshes.get((shape as any).id)) {
          // Copy to meshes
          pos.set(localPose.translation.x, localPose.translation.y, localPose.translation.z)
          rot.set(localPose.rotation.x, localPose.rotation.y, localPose.rotation.z, localPose.rotation.w)
          childMatrix.compose(pos, rot, scale)
          childMatrix.premultiply(parentMatrix)
          childMatrix.decompose(pos, rot, scale2)
          this._meshes.get((shape as any).id).position.copy(pos)
          this._meshes.get((shape as any).id).quaternion.copy(rot)
        }
      })
    })
    world.physics.raycasts.forEach((raycast, id) => {
      this._updateRaycast(raycast, id)
    })
    world.physics.obstacles.forEach((obstacle, id) => {
      this._updateObstacle(obstacle, id)
    })
    this._obstacles.forEach((mesh, id) => {
      if (!world.physics.obstacles.has(id)) {
        this.scene.remove(mesh)
        this._meshes.delete(id)
      }
    })
    this._meshes.forEach((mesh, id) => {
      if (!world.physics.shapes.has(id)) {
        this.scene.remove(mesh)
        this._meshes.delete(id)
      }
    })
  }

  private _updateRaycast(raycast, id) {
    let line = this._raycasts.get(id)
    if (!line) {
      line = new Line(
        new BufferGeometry().setFromPoints([
          new Vector3().add(raycast.origin),
          new Vector3().add(raycast.origin).add(raycast.direction)
        ]),
        this._lineMaterial
      )
      this.scene.add(line)
      this._raycasts.set(id, line)
    } else {
      line.geometry.setFromPoints([
        new Vector3().add(raycast.origin),
        new Vector3().add(raycast.direction).multiplyScalar(raycast.maxDistance).add(raycast.origin)
      ])
    }
  }

  private _updateObstacle(obstacle, id) {
    if (!this._obstacles.get(id)) {
      const geom = obstacle.isCapsule
        ? new CapsuleBufferGeometry(obstacle.radius, obstacle.radius, obstacle.halfHeight * 2)
        : new BoxBufferGeometry(obstacle.halfExtents.x * 2, obstacle.halfExtents.y * 2, obstacle.halfExtents.z * 2)
      const mesh = new Mesh(geom, this._materials[5])
      mesh.position.copy(obstacle.position)
      mesh.quaternion.copy(obstacle.rotation)
      this.scene.add(mesh)
      this._obstacles.set(id, mesh)
    }
  }

  private _updateController(controller: PhysX.PxController, id: number) {
    let mesh = this._meshes.get(id)
    let needsUpdate = false
    if ((controller as any)._debugNeedsUpdate) {
      if (mesh) {
        this.scene.remove(mesh)
        needsUpdate = true
      }
      delete (controller as any)._debugNeedsUpdate
    }

    if (!mesh || needsUpdate) {
      if ((controller as any)._shape.isCapsule) {
        mesh = new Mesh(
          new CapsuleBufferGeometry(
            clampNonzeroPositive((controller as any).radius),
            clampNonzeroPositive((controller as any).radius),
            clampNonzeroPositive((controller as any).height)
          ),
          this._materials[BodyType.CONTROLLER]
        )
      } else {
        mesh = new Mesh(
          new BoxBufferGeometry(
            clampNonzeroPositive((controller as any).halfSideExtent * 2),
            clampNonzeroPositive((controller as any).halfHeight * 2),
            clampNonzeroPositive((controller as any).halfForwardExtent * 2)
          ),
          this._materials[BodyType.CONTROLLER]
        )
      }
      this._meshes.set(id, mesh)
      this.scene.add(mesh)
    }
  }

  private _updateMesh(body: PhysX.PxRigidActor, id: number, shape: PhysX.PxShape) {
    let mesh = this._meshes.get(id)
    let needsUpdate = false
    if ((shape as any)._debugNeedsUpdate) {
      if (mesh) {
        this.scene.remove(mesh)
        needsUpdate = true
        this._scaleMesh(mesh, shape)
      }
      delete (shape as any)._debugNeedsUpdate
    }
    if (!mesh || needsUpdate) {
      mesh = this._createMesh(shape, (body as any)._type)
      this._meshes.set(id, mesh)
      this._scaleMesh(mesh, shape)
    }
  }

  private _createMesh(shape, type: SHAPES): Mesh | Points {
    let mesh: Mesh | Points
    let geometry: BufferGeometry
    const material: Material = this._materials[shape.isTrigger ? 4 : type]
    let points: Vector3[] = []

    switch (shape.shape) {
      case SHAPES.Sphere:
        mesh = new Mesh(this._sphereGeometry, material)
        break

      case SHAPES.Capsule:
        mesh = new Mesh(
          new CapsuleBufferGeometry(
            clampNonzeroPositive(shape.options.radius),
            clampNonzeroPositive(shape.options.radius),
            clampNonzeroPositive(shape.options.halfHeight) * 2
          ),
          material
        )
        break

      case SHAPES.Box:
        mesh = new Mesh(this._boxGeometry, material)
        break

      case SHAPES.Plane:
        mesh = new Mesh(this._planeGeometry, material)
        break

      case SHAPES.ConvexMesh:
        geometry = new BufferGeometry()
        points = []
        for (let i = 0; i < shape.options.vertices.length; i += 3) {
          const [x, y, z] = [shape.options.vertices[i], shape.options.vertices[i + 1], shape.options.vertices[i + 2]]
          points.push(new Vector3(x, y, z))
        }
        geometry.setFromPoints(points)
        mesh = new Mesh(geometry, material)

        break

      case SHAPES.TriangleMesh:
        geometry = new BufferGeometry()
        points = []
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(shape.options.vertices), 3))
        geometry.setIndex(shape.options.indices)
        mesh = new Mesh(geometry, material)
        break
      default:
        mesh = new Mesh()

        break
    }

    if (mesh && mesh.geometry) {
      this.scene.add(mesh)
    }

    return mesh
  }

  private _scaleMesh(mesh: Mesh | Points, shape) {
    const scale = shape.transform.scale as Vector3
    if (shape.shape === SHAPES.Sphere) {
      const radius = clampNonzeroPositive(shape.options.radius)
      mesh.scale.set(radius, radius, radius)
    } else if (shape.shape === SHAPES.Box) {
      const { x, y, z } = shape.options.boxExtents
      mesh.scale.set(clampNonzeroPositive(x), clampNonzeroPositive(y), clampNonzeroPositive(z)).multiplyScalar(2)
    }
    mesh.scale.multiply(scale)
  }
}
const clampNonzeroPositive = (num) => {
  return Math.max(0.00001, num)
}
