importScripts('../lib/three.js');
/**
 * 生成曲线控制点
 * @param routes {Array} 路径数据
 * @param radius {Number} 球径
 * @param airports {Array} 所有airport的数据
 */
function generateControlPoints(routes,airports,radius,idRelationMap){
    var splines = [];
    var lineDistance = [];
    routes.forEach(route => {
        // 获取起点终点的经纬度
        let srcAirportId = route[3];
        let destAirportId = route[5];
        // "NULL"代表该route不存在起点或终点
        if(srcAirportId === "NULL" || destAirportId === "NULL"){
            return;
        }
        // 如果srcAirportId或者destAirportId号机场不存在 则返回
        // 这里需要将virtualID转换为realID
        let srcAirport = airports[idRelationMap[srcAirportId]];
        let destAirport = airports[idRelationMap[destAirportId]];
        if(!srcAirport || !destAirport){return;}
        var startLat = srcAirport[6];
        // 若使用tempFuncle函数计算 又会出现经度正负数错误导致点位置不对的问题
        // var startLng = tempFuncle(srcAirport[7]);
        var startLng = srcAirport[7];
        var endLat = destAirport[6];
        // var endLng = tempFuncle(destAirport[7]);
        var endLng = destAirport[7];

        // var maxHeight = Math.random() * 30;// 随机取最大高度
        // 根据起点和终点间距离求最大高度
        var srcCoor = LatLong2Coor(radius,startLng,startLat);
        var destCoor = LatLong2Coor(radius,endLng,endLat);
        var srcVector = new THREE.Vector3(srcCoor.x,srcCoor.y,srcCoor.z);
        var destVector = new THREE.Vector3(destCoor.x,destCoor.y,destCoor.z);
        var distance = srcVector.distanceTo(destVector);// distance在0到 2*radius之间
        var maxHeight = 0;
        // var maxHeight = 30 * distance / (2 * radius);
        if(distance > radius){
          maxHeight = 40;
        }else if(distance > 0.5 * radius && distance < radius){
          maxHeight = 20;
        }else{
          maxHeight = 5;
        }
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
        splines.push(spline);

        var arc_length = spline.getLength();
        lineDistance.push(arc_length);
    });
    // webWorker里不允许返回group(因为跟渲染有关) 所以只计算曲线数据 然后返回主线程画线
    return {
        splines,
        lineDistance
    }
}
function getLines(startIndex,endIndex,lineNums,splines) {
    const ctrlPoints = 32;
    var linePos = new Float32Array(lineNums * 3 * 2 * ctrlPoints);
    // var colors = new Float32Array(lineNums * 3 * 2 * ctrlPoints);

    for (var i = startIndex; i < endIndex; ++i) {
        for (var j = 0; j < ctrlPoints - 1; ++j) {
            var startPos = splines[i].getPoint(j / (ctrlPoints - 1));
            var endPos = splines[i].getPoint((j + 1) / (ctrlPoints - 1));
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
function route2CurveByCondition(route,airports,globalRadius,query,idRelationMap){
    let queryRoute = route[query];
    if(!queryRoute)
        return null;
    let splines = generateControlPoints(queryRoute,airports,globalRadius,idRelationMap);
    // 可能会有某条route为NULL 应该以计算得出的spline数组长度为准
    let linesProps = getLines(0,splines.splines.length - 1,splines.splines.length,splines.splines);
    linesProps.lineNum = splines.splines.length;
    return linesProps;
}
