import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';

import { parabola } from '../shaders/functions.js';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float time;

varying vec3 vPosition;
varying vec2 vUv;
varying float vDepth;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

void main() {
  vUv = uv;
  float scale = .5 + .5 + .5 *sin(1.*(vUv.x+time)*TAU);
  vec4 mvPosition = modelViewMatrix * vec4( position, 1. );
  gl_Position = projectionMatrix * mvPosition;
  vDepth = .1+1.-20.*(abs(gl_Position.z)-0.02);
}
`;

const fragmentShader = `
precision highp float;

uniform float time;
uniform float offset;
uniform vec3 color;

varying vec2 vUv;
varying float vDepth;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}

void main(){
  if(mod((vUv.y+10.*vUv.x+1.*time),1.)<.85-parabola(offset,1.)*.125*parabola(time,1.)) discard;
  if(mod(2.*vUv.x+2.*time+offset,1.)<.75-parabola(offset,.5)*.25*parabola(time,1.)) discard;
  gl_FragColor = vec4(.01*vDepth+vDepth*color/3., 1.);
}
`;

const canvas = renderer.domElement;
const camera = getOrthoCamera(2.25, 2.25);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = renderer; // FIXME new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const geo = new THREE.TorusKnotBufferGeometry(1, .45, 200, 36, 2, 3);
const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    offset: { value: 0 },
    color: { value: new THREE.Color(0x870000) }
  },
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  depthTest: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  wireframe: false
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);
const mesh2 = new THREE.Mesh(geo, mat.clone());
mesh2.material.uniforms.offset.value = .1;
mesh2.material.uniforms.color.value.setHex(0x008700);
const e = .001;
mesh2.scale.setScalar(1 + e);
group.add(mesh2);
const mesh3 = new THREE.Mesh(geo, mat.clone());
mesh3.material.uniforms.offset.value = .2;
mesh3.material.uniforms.color.value.setHex(0x000087);
mesh3.scale.setScalar(1. - e);
group.add(mesh3);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -4;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(-1.0702885548723662, -2.5452113826520217, 4.168498701802346);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);
scene.fog = new THREE.FogExp2(0x010203, .2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 10;
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const p = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mesh.material.uniforms.time.value = t;
  mesh2.material.uniforms.time.value = t;
  mesh3.material.uniforms.time.value = t;

  const t2 = Maf.mod(t * 2., 1.);
  mesh.material.uniforms.offset.value = t2;
  mesh2.material.uniforms.offset.value = easings.InOutQuad(t2);
  mesh3.material.uniforms.offset.value = easings.InOutCubic(t2);

  group.rotation.x = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };