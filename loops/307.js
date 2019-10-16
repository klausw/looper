import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import { TubeBufferGeometry } from '../modules/three-tube-geometry.js';

import { parabola } from '../shaders/functions.js';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float offset;

varying vec3 vPosition;
varying vec2 vUv;
varying float vDepth;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}

void main() {
  vUv = uv;
  vec3 p = position;
  vec4 mvPosition = modelViewMatrix * vec4( p, 1. );
  gl_Position = projectionMatrix * mvPosition;
  vDepth = 1.5-20.*abs(gl_Position.z);
}
`;

const fragmentShader = `
precision highp float;

uniform float time;
uniform float offset;
uniform vec3 color;
uniform float glow;
uniform float speed;
uniform float opacity;

varying vec2 vUv;
varying float vDepth;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}

float v(vec2 uv, float offset, float t){
  float l = 200.;
  float o = .02 + .98*parabola(mod(1.*vUv.x+1.*t+offset+1.*time,1.),l);
  return o;
}

vec3 color1 = vec3(69.,91.,105.)/255.;
vec3 color2 = vec3(249.,122.,77.)/255.;
vec3 color3 = vec3(195.,58.,78.)/255.;
vec3 color4 = vec3(2.,130.,122.)/255.;

void main(){
  float e = 1./4.;
  float t = -2.* time/4.;
  float o1 = v(vUv, 0., t);
  float o2 = v(vUv, e, t);
  float o3 = v(vUv, 2.*e, t);
  float o4 = v(vUv, 3.*e, t);
  float stripe = .5 +.5 * sin(4.*(1.*vUv.y+6.*vUv.x)*TAU-4.*2.*t*TAU);
  if(smoothstep(.1,.2,stripe) < .5) discard;
  float stripe2 = .5 +.5 * sin(200.*(vUv.x)*TAU);
  float v = 1.-smoothstep(.45,.55,stripe);
  v += .1 * stripe;
  v += max(v,.5*smoothstep(.9,1.,stripe2));
  gl_FragColor = vec4(v*vDepth*(o1*color1+o2*color2+o3*color3+o4*color4)/4.,v);
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
const curve = new THREE.Curves.TorusKnot();
const geo = new TubeBufferGeometry(curve, 200, 6, 36, true);

const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    speed: { value: 1 },
    offset: { value: 0 },
    glow: { value: 0 },
    color: { value: new THREE.Color(0x455b69) },
    opacity: { value: 1 }
  },
  vertexShader,
  fragmentShader,
  wireframe: false,
  side: THREE.DoubleSide,
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);

const geo0 = new TubeBufferGeometry(curve, 200, 5, 36, true);
const mesh0 = new THREE.Mesh(geo0, mat.clone());
mesh0.rotation.z = Maf.TAU / 4;
group.add(mesh0);

group.scale.setScalar(.05);

scene.add(group);

camera.position.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = Maf.mod(time / loopDuration - .5, 1);

  mesh.material.uniforms.time.value = t;
  mesh0.material.uniforms.time.value = t;
  // mesh0.material.uniforms.glow.value = .5;

  group.rotation.z = 2 * t * Maf.TAU / 4;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };