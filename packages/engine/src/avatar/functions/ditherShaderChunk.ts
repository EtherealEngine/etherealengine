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

/** glsl, vertex uniforms */
export const ditheringVertexUniform = `
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
uniform bool useWorldCenter;
uniform bool useLocalCenter;
`

/** glsl, vertex main */
export const ditheringVertex = `
if(useWorldCenter) vWorldPosition = (modelMatrix * vec4( transformed, 1.0 )).xyz;
if(useLocalCenter) vLocalPosition = position.xyz;
`

/** glsl, fragment uniforms */
export const ditheringFragUniform = `
varying vec3 vWorldPosition;
varying vec3 vLocalPosition; 
uniform bool useWorldCenter;
uniform bool useLocalCenter;
uniform vec3 ditheringWorldCenter;
uniform vec3 ditheringLocalCenter;
uniform float ditheringWorldExponent;
uniform float ditheringLocalExponent;
uniform float ditheringWorldDistance;
uniform float ditheringLocalDistance;
`

/** glsl, fragment main */
export const ditheringAlphatestChunk = `
// sample sine at screen space coordinates for dithering pattern
float distance = 1.0;
if(useWorldCenter) distance *= pow(clamp(ditheringWorldDistance*length(ditheringWorldCenter - vWorldPosition), 0.0, 1.0),ditheringWorldExponent);
if(useLocalCenter) distance *= pow(clamp(ditheringLocalDistance*length(ditheringLocalCenter - vLocalPosition), 0.0, 1.0),ditheringLocalExponent);

float dither = (sin( gl_FragCoord.x * 2.0)*sin( gl_FragCoord.y * 2.0));

dither += 2.0;
dither *= 0.5;
dither -= distance;

diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
diffuseColor.a -= max(dither, 0.0);

if ( diffuseColor.a == 0.0 ) discard;

if ( diffuseColor.a < alphaTest ) discard;
    `
