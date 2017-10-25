import {Geometry,PointsMaterial,Color,Vector3,Points,Raycaster} from 'three';
import {scene,renderer,group} from '../scene';
import camera from '../camera';
function drawAirports(airportsCoor) {
    var geometry = new Geometry();
    var material = new PointsMaterial({
        size: 2,
        vertexColors: true,
        color: 0xffffff
    });
    airportsCoor.forEach(function (coor) {
        var particle = new Vector3(coor.x, coor.y, coor.z);
        geometry.vertices.push(particle);
        geometry.colors.push(new Color(Math.random() * 0xffffff));
    });
    let pointsSystem = new Points(geometry, material);
    group.add(pointsSystem);

}
function drawAirportsByCountry(data,country){
    var geometry = new Geometry();
    var material = new PointsMaterial({
        size: 2,
        vertexColors: true, color: 0xffffff
    });
    data[country].forEach(function (coor) {
        var particle = new Vector3(coor.x, coor.y, coor.z);
        geometry.vertices.push(particle);
        geometry.colors.push(new Color(Math.random() * 0xffffff));
    });
    var pointsSystem = new Points(geometry, material);
    group.add(pointsSystem);
}
export {drawAirports,drawAirportsByCountry};