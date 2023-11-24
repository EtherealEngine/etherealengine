/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { useEffect } from 'react'

import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { defineComponent, useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useEntityContext } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'

import { Color, Mesh, Vector2 } from 'three'
import { MathUtils } from 'three/src/math/MathUtils'
import { Text as TroikaText } from 'troika-three-text'
import { matches } from '../../common/functions/MatchesUtils'
import { addObjectToGroup } from './GroupComponent'

/**
 * @description
 * troika.Color type, as declared by `troika-three-text` in its Text.color `@member` property.
 */
type TroikaColor = string | number | THREE.Color

/**
 * @description
 * troika.Text direction type, as declared by `troika-three-text` in its Text.direction `@member` property.
 * `auto` means choosing direction based on the text contents.
 */
export type TroikaTextDirection = 'auto' | 'ltr' | 'rtl'

/**
 * @description
 * troika.Text alignment type, as declared by `troika-three-text` in its Text.textAlign `@member` property.
 * Defines the horizontal alignment of each line within the overall bounding box.
 */
export type TroikaTextAlignment = 'left' | 'center' | 'right' | 'justify'

/**
 * @description
 * troika.Text wrap, as declared by `troika-three-text` in its Text.whiteSpace `@member` property.
 * Defines whether text should wrap when a line reaches `maxWidth`.
 * @option `'normal'`: Allow wrapping according to the `overflowWrap` property. Honors newline characters to manually break lines, making it behave more like `'pre-wrap'` does in CSS.
 * @option `'nowrap'`: Does not allow text to wrap.
 */
export type TroikaTextWrap = 'normal' | 'nowrap'

/**
 * @description
 * troika.Text wrapping kind, as declared by `troika-three-text` in its Text.overflowWrap `@member` property.
 * Defines how text wraps if TroikaTextWrap is set to `normal` _(aka TextComponent.textWrap: true)_.
 * @option `'normal'`: Break at whitespace characters
 * @option `'break-word'`: Break within words
 */
export type TroikaTextWrapKind = 'normal' | 'break-word'

/**
 * @description
 * Javascript-to-Typescript compatiblity type for the `troika-three-text` Text mesh class.
 *
 * @example
 * import { Text as TroikaText } from 'troika-three-text'
 * let textMesh = new TroikaText() as TextMesh
 *
 * @note
 * Go to the `troika-three-text`.Text class implementation for documentation about each of the fields.
 *
 * @abstract
 * Respects the shape of the original troika.Text class,
 * by intersecting the three.Mesh class with an explicit list of properties originally contained in the Text class.
 * Only the properties used by this implementation are explicitly declared in this type.
 */
type TextMesh = Mesh & {
  //____ Text layout properties ____
  text: string
  // Text properties
  fillOpacity: number // @note: Troika marks this as an Experimental API
  textIndent: number /** Indentation for the first character of a line; see CSS `text-indent`. */
  textAlign: TroikaTextAlignment
  overflowWrap: TroikaTextWrapKind
  whiteSpace: TroikaTextWrap

  letterSpacing: number /** Spacing between letters after kerning is applied. */
  maxWidth: number /** Value above which text starts wrapping */
  anchorX: number | string | 'left' | 'center' | 'right'
  anchorY: number | string | 'top' | 'top-baseline' | 'top-cap' | 'top-ex' | 'middle' | 'bottom-baseline' | 'bottom'
  depthOffset: number
  curveRadius: number
  direction: TroikaTextDirection
  // Font properties
  font: string | null /** Defaults to Noto Sans when null */
  fontSize: number
  outlineOpacity: number // @note: Troika marks this as an Experimental API
  outlineWidth: number | string // @note: Troika marks this as an Experimental API
  outlineBlur: number | string // @note: Troika marks this as an Experimental API
  outlineOffsetX: number | string // @note: Troika marks this as an Experimental API
  outlineOffsetY: number | string // @note: Troika marks this as an Experimental API
  strokeOpacity: number // @note: Troika marks this as an Experimental API
  strokeWidth: number | string // @note: Troika marks this as an Experimental API
  //____ Presentation properties ____
  color: TroikaColor /** aka fontColor */
  //____ SDF Properties ____
  gpuAccelerateSDF: boolean // Allows force-disabling GPU acceleration of SDF. Uses the JS fallback when true
  //____ Callbacks ____
  sync: () => void /** Async Render the text using the current properties. troika accepts a callback function, but that feature is not mapped */

  //_____________________________________________________________
  // TODO                                                      //
  //  Remove the unused properties. Only temp for easier dev  //
  //_________________________________________________________//
  //____ Simple Properties
  // The color of the text outline, if `outlineWidth`/`outlineBlur`/`outlineOffsetX/Y` are set.
  // Defaults to black.
  outlineColor: TroikaColor // WARNING: This API is experimental and may change.
  // The color of the text stroke, if `strokeWidth` is greater than zero. Defaults to gray.
  strokeColor: TroikaColor // WARNING: This API is experimental and may change.
  // If specified, defines a `[minX, minY, maxX, maxY]` of a rectangle outside of which all
  // pixels will be discarded. This can be used for example to clip overflowing text when
  // `whiteSpace='nowrap'`.
  clipRect: Array<number>
  //____ SDF & Geometry ____
  // Controls number of vertical/horizontal segments that make up each glyph's rectangular
  // plane. Defaults to 1. This can be increased to provide more geometrical detail for custom
  // vertex shader effects, for example.
  glyphGeometryDetail: number
  // The size of each glyph's SDF (signed distance field) used for rendering. This must be a
  // power-of-two number. Defaults to 64 which is generally a good balance of size and quality
  // for most fonts. Larger sizes can improve the quality of glyph rendering by increasing
  // the sharpness of corners and preventing loss of very thin lines, at the expense of
  // increased memory footprint and longer SDF generation time.
  sdfGlyphSize: number | null

  //____ Others ____
  // Sets the height of each line of text, as a multiple of the `fontSize`. Defaults to 'normal'
  // which chooses a reasonable height based on the chosen font's ascender/descender metrics.
  lineHeight: number | 'normal'

  // === Presentation properties: === //
  // Defines a _base_ material to be used when rendering the text. This material will be
  // automatically replaced with a material derived from it, that adds shader code to
  // decrease the alpha for each fragment (pixel) outside the text glyphs, with antialiasing.
  // By default it will derive from a simple white MeshBasicMaterial, but you can use any
  // of the other mesh materials to gain other features like lighting, texture maps, etc.
  // Also see the `color` shortcut property.
  material: THREE.Material
  // This allows more fine-grained control of colors for individual or ranges of characters,
  // taking precedence over the material's `color`. Its format is an Object whose keys each
  // define a starting character index for a range, and whose values are the color for each
  // range. The color value can be a numeric hex color value, a `THREE.Color` object, or
  // any of the strings accepted by `THREE.Color`.
  colorRanges: object | null // WARNING: This API is experimental and may change.
  // Defines the axis plane on which the text should be laid out when the mesh has no extra
  // rotation transform. It is specified as a string with two axes: the horizontal axis with
  // positive pointing right, and the vertical axis with positive pointing up. By default this
  // is '+x+y', meaning the text sits on the xy plane with the text's top toward positive y
  // and facing positive z. A value of '+x-z' would place it on the xz plane with the text's
  // top toward negative z and facing positive y.
  orientation: string

  //____ Unlikely ____
  fontWeight: number | 'normal' | 'bold' // The weight of the font. Currently only used for fallback Noto fonts.
  fontStyle: 'normal' | 'italic' // The style of the font. Currently only used for fallback Noto fonts.
  lang: string | null // The language code of this text; can be used for explicitly selecting certain CJK fonts.
  unicodeFontsURL: string | null // defaults to CDN
  debugSDF: boolean
}

/**
 *  @description
 *  Noto Sans is the default font for text rendering.
 *  @abstract
 *  troika.Text.font accepts a nullable string, and defaults to Noto Sans when null is passed
 */
const FontDefault = null! as string | null
/** @todo Remove. Only temp for testing */
const FontOrbitronURL = 'https://fonts.gstatic.com/s/orbitron/v9/yMJRMIlzdpvBhQQL_Qq7dys.woff'

export const TextComponent = defineComponent({
  name: 'TextComponent',
  jsonID: 'Text_troika',

  onInit: (entity) => {
    return {
      // Text contents to render
      text: 'Some Text',
      textOpacity: 100, // range[0..100], sent to troika as [0..1] :number
      textWidth: Infinity,
      textIndent: 0,
      textAlign: 'justify' as TroikaTextAlignment,
      textWrap: true, // Maps to: troika.Text.whiteSpace as TroikaTextWrap
      textWrapKind: 'normal' as TroikaTextWrapKind, // Maps to troika.Text.overflowWrap
      textAnchor: new Vector2(
        /* X */ 0, // range[0..100+], sent to troika as [0..100]% :string
        /* Y */ 0 // range[0..100+], sent to troika as [0..100]% :string
      ),
      textDepthOffset: 0, // For Z-fighting adjustments. Similar to anchor.Z
      textCurveRadius: 0,
      letterSpacing: 0,
      textDirection: 'auto' as TroikaTextDirection,

      // Font Properties
      font: FontDefault, // font: string|null
      fontSize: 0.2,
      fontColor: new Color(0x9966ff),
      // Font Outline Properties
      outlineOpacity: 0, // range[0..100], sent to troika as [0..1] :number
      outlineWidth: 0, // range[0..100+], sent to troika as [0..100]% :string
      outlineBlur: 0, // range[0..100+], sent to troika as [0..100]% :string
      outlineOffset: new Vector2(
        /* X */ 0, // range[0..100+], sent to troika as [0..100]% :string
        /* Y */ 0 // range[0..100+], sent to troika as [0..100]% :string
      ),
      // Font Stroke Properties
      strokeOpacity: 0, // range[0..100], sent to troika as [0..1] :number
      strokeWidth: 0, // range[0..100+], sent to troika as [0..100]% :string
      // SDF Configuration
      gpuAccelerated: true,
      // Internal State
      troikaMesh: new TroikaText() as TextMesh
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    // Text contents/properties
    if (matches.string.test(json.text)) component.text.set(json.text)
    if (matches.number.test(json.textOpacity)) component.textOpacity.set(json.textOpacity)
    if (matches.number.test(json.textWidth)) component.textWidth.set(json.textWidth)
    if (matches.number.test(json.textIndent)) component.textIndent.set(json.textIndent)
    if (matches.string.test(json.textAlign)) component.textAlign.set(json.textAlign)
    if (matches.boolean.test(json.textWrap)) component.textWrap.set(json.textWrap)
    if (matches.string.test(json.textWrapKind)) component.textWrapKind.set(json.textWrapKind)
    if (matches.object.test(json.textAnchor) && json.textAnchor.isVector2) component.textAnchor.set(json.textAnchor)
    if (matches.number.test(json.textDepthOffset)) component.textDepthOffset.set(json.textDepthOffset)
    if (matches.number.test(json.textCurveRadius)) component.textCurveRadius.set(json.textCurveRadius)
    if (matches.number.test(json.letterSpacing)) component.letterSpacing.set(json.letterSpacing)
    if (matches.string.test(json.textDirection)) component.textDirection.set(json.textDirection)
    // Font Properties
    if (matches.string.test(json.font)) component.font.set(json.font)
    else if (matches.nill.test(json.font)) component.font.set(null)
    if (matches.number.test(json.fontSize)) component.fontSize.set(json.fontSize)
    if (matches.object.test(json.fontColor) && json.fontColor.isColor) component.fontColor.set(json.fontColor)
    if (matches.number.test(json.outlineOpacity)) component.outlineOpacity.set(json.outlineOpacity)
    if (matches.number.test(json.outlineWidth)) component.outlineWidth.set(json.outlineWidth)
    if (matches.number.test(json.outlineBlur)) component.outlineBlur.set(json.outlineBlur)
    if (matches.object.test(json.outlineOffset) && json.outlineOffset.isVector2)
      component.outlineOffset.set(json.outlineOffset)
    if (matches.number.test(json.strokeOpacity)) component.strokeOpacity.set(json.strokeOpacity)
    if (matches.number.test(json.strokeWidth)) component.strokeWidth.set(json.strokeWidth)
    // SDF configuration
    if (matches.boolean.test(json.gpuAccelerated)) component.gpuAccelerated.set(json.gpuAccelerated)
  },

  toJSON: (entity, component) => {
    return {
      // Text contents/properties
      text: component.text.value,
      textOpacity: component.textOpacity.value,
      textWidth: component.textWidth.value,
      textIndent: component.textIndent.value,
      textAlign: component.textAlign.value,
      textWrap: component.textWrap.value,
      textWrapKind: component.textWrapKind.value,
      textAnchor: component.textAnchor.value,
      textDepthOffset: component.textDepthOffset.value,
      textCurveRadius: component.textCurveRadius.value,
      letterSpacing: component.letterSpacing.value,
      textDirection: component.textDirection.value,
      // Font Properties
      font: component.font.value,
      fontSize: component.fontSize.value,
      fontColor: component.fontColor.value,
      outlineOpacity: component.outlineOpacity.value,
      outlineWidth: component.outlineWidth.value,
      outlineBlur: component.outlineBlur.value,
      outlineOffset: component.outlineOffset.value,
      strokeOpacity: component.strokeOpacity.value,
      strokeWidth: component.strokeWidth.value,
      // SDF configuration
      gpuAccelerated: component.gpuAccelerated.value
    }
  },

  reactor: function () {
    if (!isClient) return null
    const entity = useEntityContext()
    const text = useComponent(entity, TextComponent)

    // Add the text mesh to the scene
    addObjectToGroup(entity, text.troikaMesh.value)

    useEffect(() => {
      // Update the Text content/properties
      text.troikaMesh.value.text = text.text.value
      text.troikaMesh.value.fillOpacity = text.textOpacity.value / 100
      text.troikaMesh.value.maxWidth = text.textWidth.value
      text.troikaMesh.value.textIndent = text.textIndent.value
      text.troikaMesh.value.textAlign = text.textAlign.value
      text.troikaMesh.value.overflowWrap = text.textWrapKind.value
      text.troikaMesh.value.whiteSpace = text.textWrap.value ? 'normal' : 'nowrap'
      text.troikaMesh.value.anchorX = `${text.textAnchor.x.value}%`
      text.troikaMesh.value.anchorY = `${text.textAnchor.y.value}%`
      text.troikaMesh.value.depthOffset = text.textDepthOffset.value
      text.troikaMesh.value.curveRadius = MathUtils.degToRad(text.textCurveRadius.value)
      text.troikaMesh.value.letterSpacing = text.letterSpacing.value
      text.troikaMesh.value.direction = text.textDirection.value
      // Update the font properties
      text.troikaMesh.value.font = text.font.value
      text.troikaMesh.value.fontSize = text.fontSize.value
      text.troikaMesh.value.color = text.fontColor.value.getHex()
      text.troikaMesh.value.outlineOpacity = text.outlineOpacity.value / 100
      text.troikaMesh.value.outlineWidth = `${text.outlineWidth.value}%`
      text.troikaMesh.value.outlineBlur = `${text.outlineBlur.value}%`
      text.troikaMesh.value.outlineOffsetX = `${text.outlineOffset.x.value}%`
      text.troikaMesh.value.outlineOffsetY = `${text.outlineOffset.y.value}%`
      text.troikaMesh.value.strokeOpacity = text.strokeOpacity.value / 100
      text.troikaMesh.value.strokeWidth = `${text.strokeWidth.value}%`
      // SDF configuration
      text.troikaMesh.value.gpuAccelerateSDF = text.gpuAccelerated.value
      // Order troika to synchronize the mesh
      text.troikaMesh.value.sync()
    }, [
      text.text,
      text.textOpacity,
      text.textIndent,
      text.textAlign,
      text.textWrap,
      text.textWrapKind,
      text.textAnchor,
      text.textCurveRadius,
      text.textDepthOffset,
      text.textWidth,
      text.letterSpacing,
      text.textDirection,
      text.fontSize,
      text.fontColor,
      text.outlineOpacity,
      text.outlineWidth,
      text.outlineBlur,
      text.outlineOffset,
      text.strokeOpacity,
      text.strokeWidth,
      text.gpuAccelerated
    ])

    return null
  }
})
