import THREE from '../third_party/three.js';
import { WEBVR } from './WebVR.js';

function getWebGLRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(400, 400);
  const canvas = renderer.domElement;
  canvas.style.width = '400px';
  canvas.style.height = '400px';

  renderer.setPixelRatio(window.devicePixelRatio);

  let btnVR = WEBVR.createButton(
      renderer, {
	mode: 'immersive-vr',
	referenceSpaceType: 'local', // 'local-floor'
	sessionInit: {//requiredFeatures: ['local-floor'],
          optionalFeatures: ['dom-overlay-for-handheld-ar']}
      });
  btnVR.style.left = 'calc(50% - 110px)';
  document.body.appendChild(btnVR);

  let btnAR = WEBVR.createButton(
      renderer, {
	mode: 'immersive-ar',
	referenceSpaceType: 'local', // 'local-floor'
	sessionInit: {//requiredFeatures: ['local-floor'],
          optionalFeatures: ['dom-overlay-for-handheld-ar']}
      });
  btnAR.style.left = 'calc(50% + 10px)';
  document.body.appendChild(btnAR);

  renderer.vr.addEventListener('sessionstart',
			       function(ev) {
				 console.log('sessionstart', ev);
                                 renderer.vr.enabled = true;
                                 if (ev.target.getSession().blendMode != 'opaque') {
                                   renderer.autoClearColor = false;
                                 }
                                 document.querySelector('canvas').style.display = 'none';
			       });
  renderer.vr.addEventListener('sessionend',
			       function(ev) {
				 console.log('sessionend', ev);
                                 renderer.vr.enabled = false;
                                 renderer.autoClearColor = true;
                                 document.querySelector('canvas').style.display = '';
			       });
  return renderer;
}

const renderer = getWebGLRenderer();

let camera;

function getCamera(fov) {
  camera = new THREE.PerspectiveCamera(fov ? fov : 35, 1, .1, 100);
  return camera;
}

function getLastCameraObject(fov) {
  return camera;
}

function getOrthoCamera(w, h) {
  return new THREE.OrthographicCamera(-w, w, h, -h, -100, 100);
}

export { renderer, getCamera, getLastCameraObject, getOrthoCamera };
