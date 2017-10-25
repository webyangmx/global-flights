import {Stats} from 'threejs-utils';
class myStats {
    constructor(){
        let stat = new Stats();
        let statsStyle = stat.domElement.style;
        statsStyle.position = 'absolute';
        statsStyle.left = '0px';
        statsStyle.top = '0px';
        return stat;
    }
};
export default myStats;