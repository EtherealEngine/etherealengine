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

import { Noise } from 'noisejs'
import { useEffect } from 'react'
import { DataTexture, IUniform, LinearFilter, RedFormat, RepeatWrapping, Uniform, UnsignedByteType } from 'three'

import { getMutableState, getState, NO_PROXY } from '@etherealengine/hyperflux'

import { EngineState } from '../../../../ecs/classes/EngineState'
import { defineSystem } from '../../../../ecs/functions/SystemFunctions'
import { PluginPrototypeComponentType } from '../../components/MaterialPluginPrototypeComponent'
import { SourceType } from '../../components/MaterialSource'
import { MaterialLibraryState } from '../../MaterialLibrary'
import { FloatArg } from '../DefaultArgs'

let time: IUniform | null = null

const NOISE_OFFSET_PROTOTYPE_ID = 'NoiseOffset'

export const NoiseOffsetPlugin: PluginPrototypeComponentType = {
  prototypeId: NOISE_OFFSET_PROTOTYPE_ID,
  pluginObject: {
    id: NOISE_OFFSET_PROTOTYPE_ID,
    priority: 0.4,
    compile: (shader, renderer) => {
      const plugin = getMutableState(MaterialLibraryState).plugins['noiseOffset']
      const parameters = plugin.parameters.get(NO_PROXY)
      shader.uniforms['textureSize'] = new Uniform(parameters.textureSize)
      shader.uniforms['noiseTexture'] = new Uniform(parameters.noiseTexture)
      shader.uniforms['frequency'] = new Uniform(parameters.frequency)
      const elapsedSeconds = getState(EngineState).elapsedSeconds
      time = new Uniform(elapsedSeconds)
      shader.uniforms['time'] = time
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
uniform sampler2D noiseTexture;
uniform float textureSize; // The width of a slice
uniform float frequency;
uniform float time;

vec3 sampleNoise(vec3 pos) {
    float zSlice = floor(pos.z * textureSize);
    vec2 slicePos = vec2(zSlice / textureSize, fract(zSlice / textureSize));
    vec2 noisePos = slicePos + pos.xy / textureSize;
    return vec3(texture2D(noiseTexture, noisePos).r);
}

vec3 turbulence(vec3 position) {
  vec3 sum = vec3(0.0);
  float frequency = 0.01;
  float amplitude = 0.5;
  
  for (int i = 0; i < 4; i++) {
      vec3 p = position * frequency;
      p.z += time * 0.002;
      p = fract(p);

      sum += sampleNoise(p).rgb * amplitude;

      frequency *= 2.0;
      amplitude *= 0.5;
  }

  return sum;
}

void main() {`
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
#include <begin_vertex>
float yMagnitude = smoothstep(0.2, 0.7, position.y);
vec4 noiseWorldPosition = vec4(transformed, 1.0);
noiseWorldPosition = modelMatrix * noiseWorldPosition;
#ifdef USE_INSTANCING
  noiseWorldPosition = instanceMatrix * noiseWorldPosition;
#endif
vec3 offset = turbulence(noiseWorldPosition.xyz) * 1.0;
offset.y *= 0.2;
//offset *= yMagnitude;
transformed += offset;
        `
      )
    }
  },
  parameters: {
    textureSize: {
      ...FloatArg,
      default: 128
    },
    frequency: {
      ...FloatArg,
      default: 0.001
    }
  },
  src: {
    type: SourceType.BUILT_IN,
    path: ''
  }
}

const execute = () => {
  if (!time) return
  const elapsedSeconds = getState(EngineState).elapsedSeconds
  time.value = elapsedSeconds
}

const reactor = () => {
  const materialLibrary = getMutableState(MaterialLibraryState)
  useEffect(() => {
    const pluginState = materialLibrary.plugins['noiseOffset']
    const plugin = pluginState.get(NO_PROXY)
    time = plugin.parameters['time']
    // Create new Perlin noise instance
    const noise = new Noise(Math.random())

    // Set texture size
    const textureSize: number = plugin.parameters['textureSize'] // Adjust as needed

    // Create a data array to store the noise values
    const size = textureSize * textureSize * textureSize
    const data = new Uint8Array(4 * size)

    // Fill the data array with noise values
    for (let k = 0; k < textureSize; k++) {
      for (let j = 0; j < textureSize; j++) {
        for (let i = 0; i < textureSize; i++) {
          // Compute a single noise value between 0 and 255
          let value = noise.perlin3(i / textureSize, j / textureSize, k / textureSize)
          value = (value + 1) / 2 // remap from -1, 1 to 0, 1
          value *= 255

          const index = 4 * (i + j * textureSize + k * textureSize * textureSize)
          data[index] = data[index + 1] = data[index + 2] = value
          data[index + 3] = 255 // alpha channel
        }
      }
    }

    // Create a js data texture
    const noiseTexture = new DataTexture(data, textureSize, textureSize * textureSize)
    noiseTexture.format = RedFormat
    noiseTexture.type = UnsignedByteType
    noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping
    noiseTexture.minFilter = LinearFilter
    noiseTexture.magFilter = LinearFilter
    noiseTexture.unpackAlignment = 1
    noiseTexture.needsUpdate = true
    //pluginState.parameters['noiseTexture'].set(noiseTexture)
  }, [])
  return null
}

export const NoiseOffsetSystem = defineSystem({
  uuid: 'ee.engine.material.NoiseOffsetSystem',
  execute,
  reactor
})
