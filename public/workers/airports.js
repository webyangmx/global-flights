importScripts('./utils/utils.js');
this.onmessage = function (e) {
    let airports = getAirports(e.data.airports,e.data.globalRadius);
    // var airnames = getAirlinesName(data.airlines);
    // var airlines = getAirlines(data.routes,data.airlines,airports);

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
function getAirports(airports,globalRadius) {
    let allAirportsPos = [];// 保存所有airports的坐标
    airports.forEach((airport,index) => {
        allAirportsPos.push(LatLong2Coor(globalRadius,airport[7], airport[6]));
    });

    // 将airports根据国家划分 第4个是country
    let divideByCountry = divideArrayByItem(airports,3,allAirportsPos);
    /*let sortedByCountry = [];
    Object.keys(divideByCountry).forEach(country => {

    });*/
    // 将airports根据城市划分 第3个是country
    let divideByCity = divideArrayByItem(airports,2,allAirportsPos);
    return {
        allAirportsPos,
        divideByCountry,
        divideByCity
    };
}