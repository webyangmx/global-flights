importScripts('./utils/utils.js');
this.onmessage = function (e) {
    let airports = getAirports(e.data.airports,e.data.globalRadius,e.data.routesData);
    this.postMessage({
        airports
    });
};
/**
 * 将所有airports的原始数据分类或转换成三维坐标然后返回
 * @param airports {Array} 所有airports的原始数据
 * @param globelRadius {Number} 地球球径 转换坐标时需要
 * @returns {Object} 分类后的数据
 */
function getAirports(airports,globalRadius,routes) {
    let allAirportsPos = [];// 保存所有airports的坐标
    let idRelationMap = {};// 保存数组下标和原始id的对应关系
    airports.forEach((airport,index) => {
        allAirportsPos.push({
            originIndex:airport[0].toString(),// 保存原始数据中的机场id
            idx:index,
            coor:LatLong2Coor(globalRadius,airport[7], airport[6])
          });
          idRelationMap[airport[0].toString()] = index;
    });

    // 将airports根据国家划分 第4个是country
    // 使用divideArrayByItemWithIdx
    let divideByCountry = divideArrayByItemWithIdx(airports,3,allAirportsPos);

    // 将国家根据其airports数量排序
    let sortedByCountry = Object.keys(divideByCountry);// 所以国家名字
    sortedByCountry.sort((a,b) => {
      return divideByCountry[b].length - divideByCountry[a].length;
    });

    // 将airports根据城市划分 第3个是country
    let divideByCity = divideArrayByItem(airports,2,allAirportsPos);

    // 将routes根据起始机场划分 第4个是srcAirport
    let divBySrcAirport = divideArrayByItem(routes,3,routes);
    // 将机场根据以其为起点的航线数量排序
    let sortByRoutesNum = Object.keys(divBySrcAirport);
    sortByRoutesNum.sort((a,b) => {
      return divBySrcAirport[a].length - divBySrcAirport[b].length;
    });
    return {
        allAirportsPos,
        idRelationMap,
        divideByCountry,
        divideByCity,
        sortedByCountry,
        divBySrcAirport,
        sortByRoutesNum
    };
}
