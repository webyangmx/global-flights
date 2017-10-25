import {Scene,WebGLRenderer,Group} from 'three';
//import threeCanvasRender from 'three-canvas-renderer';
import Earth from './earth';
let scene = new Scene();
let renderer = new WebGLRenderer();
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth,window.innerHeight);
let group = new Group();
new Earth();
scene.add(group);

export {
    scene,
    renderer,
    group
};