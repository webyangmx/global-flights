import {PerspectiveCamera} from 'three';
import {scene} from './scene';
let camera = new PerspectiveCamera(45,window.innerWidth,window.innerHeight,0.1, 1000);
camera.position.x = -30;
camera.position.y = 40;
camera.position.z = 500;
camera.lookAt(scene.position);

export default camera;