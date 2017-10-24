/**
 * Created by ymx on 2016/12/20.
 */
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

    return {x, y, z};
}

// 求空间两点中点
function getMidPoint3 ( p1, p2 ){
    return {
        x:(p1.x + p2.x) / 2,
        y:(p1.y + p2.y) / 2,
        z:(p1.z + p2.z) / 2
    };
}
