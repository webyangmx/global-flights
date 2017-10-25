import {
    BufferGeometry,
    LineBasicMaterial,
    VertexColors,
    BufferAttribute,
    Line,
    LineSegments
} from 'three';
import {scene,renderer,group} from '../scene';

function rgbToHex(rgb) {
    // rgb(x, y, z)
    var color = rgb.toString().match(/\d+/g); // 把 x,y,z 推送到 color 数组里
    var hex = "#";
    for (var i = 0; i < 3; i++) {
        // 'Number.toString(16)' 是JS默认能实现转换成16进制数的方法.
        // 'color[i]' 是数组，要转换成字符串.
        // 如果结果是一位数，就在前面补零。例如： A变成0A
        hex += ("0" + Number(color[i]).toString(16)).slice(-2);
    }
    return hex;
}
const availableColors = [
    '(171, 217, 233)',
    '(253, 174, 97)',
    '(244, 109, 67)',
    '(255, 115, 136)',
    '(186, 247, 86)',
    '(220, 50, 50)'
];
let i = 0;

function drawRoutes(linesProps){
    let color = rgbToHex(availableColors[i++]);
    let line_positions = linesProps.line_positions;
    let colors = linesProps.colors;
    var geometry = new BufferGeometry();
    var material = new LineBasicMaterial({
        color: color,
        //vertexColors: VertexColors,
        transparent: false,
        opacity: 1,
        depthTest: true,
        depthWrite: false
    });
    geometry.addAttribute('position', new BufferAttribute(line_positions, 3));
    geometry.addAttribute('color', new BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();
    // Line: parameter LinePieces no longer supported. Created LineSegments instead.
    group.add(new Line(geometry, material, LineSegments));
}
function drawRouteByCondition(type,query){
    fetch('/data/routes.json').then(res => {
        res.json().then(routes => {
            fetch('/data/airports.json').then(res => {
                res.json().then(airports => {
                    let routesWorker = new Worker('/workers/routes.js');
                    routesWorker.postMessage({
                        airports,
                        routes,
                        globalRadius:150,
                        condition:{
                            type:type,
                            query:query
                        }
                    });
                    routesWorker.onmessage = e => {
                        let data = e.data;
                        data.linesProps && drawRoutes(data.linesProps);
                    };
                })
            })

        })
    })
}
export {drawRoutes,drawRouteByCondition};