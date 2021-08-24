import { Feature, LineString, Position } from 'geojson'
import { Vector3, Object3D, Camera } from 'three'
import { Text } from 'troika-three-text'
import { length, lineSliceAlong } from '@turf/turf'

const axisY = new Vector3(0, 1, 0)
const vector3 = new Vector3(1, 0, 0)

function normalizeAngle(angle: number) {
  return angle < 0 ? Math.PI * 2 + angle : angle
}

function createTextObject(textString: string): Text {
  const object3d = new Text()

  object3d.text = textString
  object3d.fontSize = DEFAULT_FONT_SIZE
  object3d.color = 0x000000
  object3d.anchorX = '50%'
  object3d.outlineWidth = '2%'
  object3d.outlineColor = 'white'

  return object3d
}

const DEFAULT_FONT_SIZE = 6

export class GeoLabelNode {
  geoFeature: Feature<LineString>
  geoLength?: number
  geoMiddleSlice: Position[]
  transformGeoPosition: (position: Position) => Position

  object3d: Text
  scale: Vector3

  constructor(feature: Feature<LineString>, transformGeoPosition: (position: Position) => Position) {
    this.geoFeature = feature
    this.transformGeoPosition = transformGeoPosition

    this.scale = new Vector3(1, 1, 1)

    this.object3d = createTextObject(feature.properties.name)

    // Update the rendering:
    this.object3d.sync()

    this.geoLength = length(this.geoFeature)
    this.geoMiddleSlice = lineSliceAlong(
      this.geoFeature,
      this.geoLength * 0.49,
      this.geoLength * 0.51
    ).geometry.coordinates.map(this.transformGeoPosition)
  }
  onUpdate(camera: Camera) {
    const [[x1, y1], [x2, y2]] = this.geoMiddleSlice

    const angle = Math.atan2(y2 - y1, x2 - x1)

    this.object3d.position.y = 15
    this.object3d.position.x = x1
    // for some reason the positions are mirrored along the X-axis
    this.object3d.position.z = y1 * -1

    camera.getWorldDirection(vector3)

    const cameraAngle = normalizeAngle(Math.atan2(vector3.x, vector3.z))
    const angleDiff = normalizeAngle(cameraAngle - angle)
    this.object3d.quaternion.setFromAxisAngle(
      axisY,
      angleDiff < Math.PI / 2 || angleDiff > (Math.PI * 3) / 2 ? angle + Math.PI : angle
    )

    // TODO MAP-48
    if (this.scale.x === 1) {
      const visibleDistanceMax = 150 * this.scale.length()

      this.object3d.visible = this.object3d.position.distanceTo(camera.position) < visibleDistanceMax
    }

    this.object3d.fontSize = DEFAULT_FONT_SIZE * this.scale.x
    this.object3d.sync()
  }
}
