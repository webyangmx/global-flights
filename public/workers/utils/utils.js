/**
 * 将一个数组按某项分类
 * @param arr {Array} 需被分类的数组
 * @param index {Number} 分类条件的索引
 * @param source {Array} 将初步分类后的index替换为有意义的内容
 * @returns {{}} 返回分类后的键值对
 * @example
 * [
 *  ["a","b","c"],
 *  ["e","b","f"],
 *  ["a","g","h"]
 * ]
 * => index = 0
 * {
 *  a:[0,2],
 *  b:[1]
 * }
 * => source
 * {
 *  a:[source[0],source[2]],
 *  b:[source[1]]
 * }
 */
function divideArrayByItem(arr,index,source){
    let result = {};
    arr.forEach((item,idx) => {
        let condition = item[index];
        if(result[condition]){
            result[condition].push(source[idx]);
        }else{
            result[condition] = [source[idx]];
        }
    });
    return result;
}
//拓展对象方法(浅拷贝)
function extend(source,target){
  //  浅拷贝
    if(!target instanceof Object)
        return;
  for(var p in target){
      if(target.hasOwnProperty(p))//不拷贝原型链上的属性
          source[p] = target[p];
  }
    return source;
}

//    经纬度转换函数
function LatLong2Coor(radius,longitude,latitude ) {
    var pi = Math.PI;
    var pi2 = 2 * pi;
    //角度转弧度
    var phi = latitude * pi / 180;
    var theta = -longitude * pi / 180;

    var x = radius * Math.cos(phi) * Math.cos(theta);
    var y = radius * Math.sin(phi);
    var z = radius * Math.cos(phi) * Math.sin(theta);

    return {x: Math.round(x), y: Math.round(y), z: Math.round(z)};
}

// 求空间两点中点
function getMidPoint3 ( p1, p2 ){
    return {
        x:(p1.x + p2.x) / 2,
        y:(p1.y + p2.y) / 2,
        z:(p1.z + p2.z) / 2
    };
}

function tempFuncle(lng) {
    var _lng;
    if (lng > 90) {
        _lng = parseFloat(lng) - 270;
    } else {
        _lng = parseFloat(lng) + 90;
    }
    _lng = _lng.toFixed(3);
    return _lng;
}
function xyzFromLatLng(lat, lng, radius) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (360 - lng) * Math.PI / 180;

    return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
    };
}

function latlngInterPoint(lat1, lng1, lat2, lng2, offset) {
    lat1 = lat1 * Math.PI / 180.0;
    lng1 = lng1 * Math.PI / 180.0;
    lat2 = lat2 * Math.PI / 180.0;
    lng2 = lng2 * Math.PI / 180.0;

    d = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
    A = Math.sin((1 - offset) * d) / Math.sin(d);
    B = Math.sin(offset * d) / Math.sin(d);
    x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    z = A * Math.sin(lat1) + B * Math.sin(lat2);
    lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
    lng = Math.atan2(y, x) * 180 / Math.PI;

    return {
        lat: lat,
        lng: lng
    };
}
function getOpacity(nums) {
    var opac = 0.2;
    if (nums > 9000) {
        opac = 0.2;
    } else if (nums < 2000) {
        opac = 0.35
    } else {
        opac = 0.3
    }
    return opac;
}

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