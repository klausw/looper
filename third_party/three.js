import * as THREE from './three.module.js'

//Object.freeze = function(obj) { return obj; };

let exports = {};
for (let func in THREE) {
  exports[func] = THREE[func];
}

export default exports;
