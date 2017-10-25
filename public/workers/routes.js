importScripts('./utils/utils.js');
importScripts('./lib/three.js');

/**
 * 生成曲线控制点
 * @param routes {Array} 路径数据
 * @param radius {Number} 球径
 * @param airports {Array} 所有airport的数据
 */
function generateControlPoints(routes,airports,radius){
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
        let srcAirport = airports[srcAirportId];
        let destAirport = airports[destAirportId];
        if(!srcAirport || !destAirport){return;}
        var start_lat = srcAirport[6];
        var start_lng = tempFuncle(srcAirport[7]);
        var end_lat = destAirport[6];
        var end_lng = tempFuncle(destAirport[7]);

        //var max_height = Math.random() * 40;
        var max_height = 20;
        var points = [];
        const spline_control_points = 8;
        for (var i = 0; i < spline_control_points + 1; i++) {
            var arc_angle = i * 180.0 / spline_control_points;
            var arc_radius = radius + (Math.sin(arc_angle * Math.PI / 180.0)) * max_height;
            var latlng = latlngInterPoint(start_lat, start_lng, end_lat, end_lng, i / spline_control_points);
            var pos = xyzFromLatLng(latlng.lat, latlng.lng, arc_radius);

            points.push(new THREE.Vector3(pos.x, pos.y, pos.z));

        }
        max_height += 10;
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
    const num_control_points = 32;
    const availableColors = [
        {r:171, g:217, b:233},
        {r:253, g:174, b:97},
        {r:244, g:109, b:67},
        {r:255, g:115, b:136},
        {r:186, g:247, b:86},
        {r:220, g:50, b:50}
    ];

    var line_positions = new Float32Array(lineNums * 3 * 2 * num_control_points);
    var colors = new Float32Array(lineNums * 3 * 2 * num_control_points);

    for (var i = startIndex; i < endIndex; ++i) {

        for (var j = 0; j < num_control_points - 1; ++j) {

            var start_pos = splines[i].getPoint(j / (num_control_points - 1));
            var end_pos = splines[i].getPoint((j + 1) / (num_control_points - 1));

            let a = (i * num_control_points + j) * 6;

            line_positions[a] = start_pos.x;
            line_positions[a + 1] = start_pos.y;
            line_positions[a + 2] = start_pos.z;
            line_positions[a + 3] = end_pos.x;
            line_positions[a + 4] = end_pos.y;
            line_positions[a + 5] = end_pos.z;

            let color = availableColors[Math.floor(Math.random() * 6)];
            colors[a] = color.r;

            colors[a + 1] = color.g;
            colors[a + 2] = color.b;
            colors[a + 3] = color.r;
            colors[a + 4] = color.g;
            colors[a + 5] = color.b;
        }
    }
    return {line_positions,colors};
}

/**
 * 将所有route数据都转换成curve 数据量太大 渲染后会卡甚至崩溃
 * @param route {Array} 所有route数据
 * @param airports {Array} 所有airports数据
 * @param globalRadius {Number} 球径
 * @returns {{line_positions, colors}}
 */
function allRoute2Curve(route,airports,globalRadius){
    let splines = generateControlPoints(route,airports,globalRadius);
    // 可能会有某条route为NULL 应该以计算得出的spline数组长度为准
    let allLinesProps = getLines(0,splines.splines.length - 1,splines.splines.length,splines.splines);
    return allLinesProps;
}

/**
 * 将某类route转换成curve 比如按airline分类 按srcAirport分
 * @param route {Object} 分类后的数据 例:{'China flights':[...]}
 * @param airports {Array} 所有airports数据
 * @param globalRadius {Number} 球径
 * @returns {{line_positions, colors}}
 */
function route2CurveByCondition(route,airports,globalRadius,query){
    let queryRoute = route[query];
    if(!queryRoute)
        return null;
    let splines = generateControlPoints(queryRoute,airports,globalRadius);
    // 可能会有某条route为NULL 应该以计算得出的spline数组长度为准
    let linesProps = getLines(0,splines.splines.length - 1,splines.splines.length,splines.splines);
    return linesProps;
}
this.onmessage = (e) => {
    let data = e.data;
    let routes = data.routes;
    let airports = data.airports;
    let globalRadius = data.globalRadius;
    let type = data.condition.type;
    let query = data.condition.query;

    let divByItem = null;

    switch(type){
        case "airline":
            // 将所有航线根据航班ID分类 第2个是Airline ID
            divByItem = divideArrayByItem(routes,1,routes);
            break;
        case "srcAirport":
            // 将所有航线根据起始点Source Airport分类 第4个是Source airport ID
            divByItem = divideArrayByItem(routes,3,routes);
            break;
        case "destAirport":
            // 将所有航线根据终点Destination Airport分类 第6个是Destination  airport ID
            divByItem = divideArrayByItem(routes,5,routes);
            break;
    }
    let linesProps = route2CurveByCondition(divByItem,airports,globalRadius,query);
    this.postMessage({
        linesProps
    });
};
