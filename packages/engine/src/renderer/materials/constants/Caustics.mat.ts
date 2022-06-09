import { ShaderMaterial } from 'three'

import { MaterialParms } from '../MaterialParms'

export const vertexShader = `
varying vec2 vUv;
uniform float iTime;
uniform float offsetScale;
uniform float offsetFrequency;
void main() {
    vUv = uv;
    vec3 offset = normalize(normal) * sin(iTime * offsetFrequency) * offsetScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1);
}
`
export const fragmentShader = `
#define TAU 6.28318530718

uniform float iTime;
uniform vec3 iResolution;
uniform int numIterations;
varying vec2 vUv;


void main() 
{
vec2 fragCoord = vUv;
float time = iTime * .75+23.0;
// uv should be the 0-1 uv of texture...
vec2 uv = fragCoord.xy / iResolution.xy;
uv = fract(uv - vec2(iTime * 0.3, sin(iTime * 0.03)));

vec2 p = mod(uv*TAU, TAU)-250.0;

vec2 i = vec2(p);
float c = 1.0;
float inten = .005;

for (int n = 0; n < numIterations; n++) 
{
    float t = time * (1.0 - (3.5 / float(n+1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
}
c /= float(numIterations);
c = 1.17-pow(c, 1.4);
vec3 colour = vec3(pow(abs(c), 8.0));
colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);

gl_FragColor = vec4(colour, 1.0);
}`

export const DefaultArgs = {
  iTime: 0.0,
  iResolution: [window.innerWidth * 2, window.innerHeight * 2, 1],
  numIterations: 3,
  offsetScale: 0.5,
  offsetFrequency: 0.25
}

export default async function Caustics(args?): Promise<MaterialParms> {
  const uniforms = args ? { ...DefaultArgs, ...args } : DefaultArgs
  const mat = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  })

  return {
    material: mat,
    update: (delta) => {
      mat.uniforms.iTime.value += delta
    }
  }
}
