import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import { TubeBufferGeometry } from '../modules/three-tube-geometry.js';

import { parabola } from '../shaders/functions.js';
import noise2d from '../shaders/noise2d.js';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float offset;

varying vec3 vPosition;
varying vec2 vUv;
varying float vDepth;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

void main() {
  vUv = uv;
  vec3 p = position;
  vec4 mvPosition = modelViewMatrix * vec4( p, 1. );
  vPosition = (modelMatrix*vec4(position,1.)).xyz;
  gl_Position = projectionMatrix * mvPosition;
  vDepth = 1.5-20.*abs(gl_Position.z);
}
`;

const fragmentShader = `
precision highp float;

uniform float time;
uniform float offset;
uniform vec3 color;
uniform float speed;

varying vec2 vUv;
varying float vDepth;
varying vec3 vPosition;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}
${noise2d}

float v(vec2 uv, float offset, float t){
  float l = 10.;
  float o = .05 + .95*parabola(mod(1.*vUv.x+1.*t+offset+2.*time,1.),l);
  return o;
}

vec3 color1 = vec3(69., 91., 105.)/255.;
vec3 color2 = vec3(249.,122.,77.)/255.;
vec3 color3 = vec3(195.,58.,78.)/255.;

void main(){
  float e = 1./3.;
  float t = -1.*time/3.;
  float o1 = v(vUv, 0., t);
  float o2 = v(vUv, e, t);
  float o3 = v(vUv, -e, t);
  vec2 s = vec2(10.,1.);
  vec2 p = vUv+vec2(t,-4.*t);
  p = mod(20.*p,20.);
  vec2 p2 = floor(p*s)/s;
  float r = .2;
  float a = 2.*time * TAU;
  vec2 offset = vec2(2.*r,r)*vec2(cos(a),sin(a));
  float stripe = noise2d(1.25*p2+offset);
  float v = clamp(.5+stripe,0.,1.);
  float o = (o1+o2+o3);
  float gradient = 1.-smoothstep(.49,.51,length(mod(p*s,vec2(1.))-.5)/(.1+.9*v*o));
  gl_FragColor = vec4(gradient *vDepth*(o1*color1+o2*color2+o3*color3)/3.,1.);
}
`;

const canvas = renderer.domElement;
const camera = getOrthoCamera(2.25, 2.25);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = renderer; // FIXME new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const r = .2;
const curve = new THREE.Curves.TrefoilKnot();
const geo = new TubeBufferGeometry(curve, 200, 6, 36, true);

const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    speed: { value: 1 },
    offset: { value: 0 },
    color: { value: new THREE.Color(0x455b69) }
  },
  vertexShader,
  fragmentShader,
  wireframe: false,
  side: THREE.DoubleSide
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);

const geo0 = new TubeBufferGeometry(curve, 200, 4, 36, true);
const mesh0 = new THREE.Mesh(geo0, mat.clone());
mesh0.material.uniforms.offset.value = 10;
group.add(mesh0);

group.scale.setScalar(.05);

scene.add(group);

camera.position.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);

const loopDuration = 6;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = Maf.mod(time / loopDuration - .5, 1);

  mesh.material.uniforms.time.value = t;

  group.rotation.z = 1 * t * Maf.TAU / 3;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };