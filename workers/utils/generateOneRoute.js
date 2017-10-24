/**
 * 生成曲线控制点
 * @param routes {Array} 路径数据
 * @param radius {Number} 球径
 * @param airports {Array} 所有airport的数据
 */
function generateControlPoints(startLng,startLat,endLng,endLat,radius){
    // 根据起点和终点间距离求最大高度
    var srcCoor = LatLong2Coor(radius,startLng,startLat);
    var destCoor = LatLong2Coor(radius,endLng,endLat);
    var srcVector = new THREE.Vector3(srcCoor.x,srcCoor.y,srcCoor.z);
    var destVector = new THREE.Vector3(destCoor.x,destCoor.y,destCoor.z);
    var maxHeight = Math.random() * 30;
    // var maxHeight = 30 * distance / (2 * radius);
    // var distance = srcVector.distanceTo(destVector);// distance在0到 2*radius之间
    // var maxHeight = 0;
    // if(distance > radius){
    //   maxHeight = 40;
    // }else if(distance > 0.5 * radius && distance < radius){
    //   maxHeight = 20;
    // }else{
    //   maxHeight = 2;
    // }
    var points = [];
    const splineControlPoints = 10;// 样条控制点个数
    for (var i = 0; i < splineControlPoints + 1; i++) {
        var arc_angle = i * 180.0 / splineControlPoints;
        var arc_radius = radius + (Math.sin(arc_angle * Math.PI / 180.0)) * maxHeight;
        var latlng = latlngInterPoint(startLat, startLng, endLat, endLng, i / splineControlPoints);
        var pos = LatLong2Coor(arc_radius, latlng.lng, latlng.lat);
        points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
    }
    // THREE.SplineCurve3 will be deprecated. Please use THREE.CatmullRomCurve3
    var spline = new THREE.CatmullRomCurve3(points);
    return {
        spline
    }
}
function getLines(splines) {
    const ctrlPoints = 32;
    var linePos = new Float32Array(splines.length * 3 * 2 * ctrlPoints);
    // var colors = new Float32Array(splines.length * 3 * 2 * ctrlPoints);

    for (var i = 0; i < splines.length; ++i) {
        for (var j = 0; j < ctrlPoints - 1; ++j) {
            var startPos = splines[i].spline.getPoint(j / (ctrlPoints - 1));
            var endPos = splines[i].spline.getPoint((j + 1) / (ctrlPoints - 1));
            let a = (i * ctrlPoints + j) * 6;
            linePos[a] = startPos.x;
            linePos[a + 1] = startPos.y;
            linePos[a + 2] = startPos.z;
            linePos[a + 3] = endPos.x;
            linePos[a + 4] = endPos.y;
            linePos[a + 5] = endPos.z;
        }
    }
    return {linePos};
}

/**
 * 将某类route转换成curve 比如按airline分类 按srcAirport分
 * @param route {Object} 分类后的数据 例:{'China flights':[...]}
 * @param airports {Array} 所有airports数据
 * @param globalRadius {Number} 球径
 * @param query {Number} 具体需要某id的数据
 * @returns {{linePos, colors}}
 */
function generateOneRoute(paths,airports,globalRadius,idRelationMap){
    let linesProps = [];
    let splines = [];
    var drawHowMany = paths.length > 1000 ? 1000:paths.length;
    var temp = '';
    for (var i = 0; i < drawHowMany; i+=100) {
      console.log(temp === paths[i].toString());
      for (var j = 1; j < paths[i].length; j++) {
        var startAirport = airports[idRelationMap[paths[i][j]]];
        var endAirport = airports[idRelationMap[paths[i][j - 1]]];
        if(!startAirport || !endAirport)return null;
        let spline = generateControlPoints(startAirport[7],startAirport[6],endAirport[7],endAirport[6],globalRadius);
        splines.push(spline);
      }
      temp = paths[i].toString();
      linesProps.push(getLines(splines));
    }
    return linesProps;
}
