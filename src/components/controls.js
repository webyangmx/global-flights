import {TextureLoader,MeshBasicMaterial} from 'three';
import {dat} from 'threejs-utils';
//const dat = require('threejs-utils').dat;
class DatGUI {
    constructor(controls = {
        globeScaleRate: 1.0,
        rotaSpeed: 0.005
    }){
        this.controls = controls;
        //gui参数控制器
        let gui = new dat.GUI();
        var folder = gui.addFolder('地球参数');
        folder.add(this.controls, 'globeScaleRate', 0.5, 1.5);
        folder.add(this.controls, 'rotaSpeed', 0, 0.01);
        folder.open();
        return gui;
    }
};
export default DatGUI;
