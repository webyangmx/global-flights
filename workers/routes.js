importScripts('./utils/utils.js');
importScripts('./utils/generateRoute.js');

/**
 * 统计某类route的特性 比如目的机场在哪几个国家
 * @param route {Object} 分类后的数据 例:{'China flights':[...]}
 * @param airports {Array} 所有airports数据
 * @param query {Number} 具体需要某id的数据
 * @returns {{countries:{'country A':10,'country B':20},routesNum:100}} 共100条航线 有10个目的机场在国家A
 */
function countRoute(route,airports,query,idRelationMap) {
  // queryRoute是一个数组 每项是一条航线的数据 包含起始、目的机场的id等
  let queryRoute = route[query];
  let result = {
    routesNum:0,
    country:{}
  };
  if(!queryRoute || queryRoute.length === 0){
    return result;
  }
  // result.routesNum = queryRoute.length;// 其中有许多空的航线 不能直接取长度
  var routesNum = 0;
  let countryMap = result.country;
  queryRoute.forEach((route,index) => {
    let srcAirportId = idRelationMap[route[3]];
    let destAirportId = idRelationMap[route[5]];

    if(!airports[destAirportId])return;
    if(srcAirportId === "NULL" || destAirportId === "NULL")return;
    routesNum++;

    let country = airports[destAirportId][3];
    if(!country)return;
    if(countryMap[country]){
      countryMap[country].push(destAirportId);
    }else{
      countryMap[country] = [destAirportId];
    }
  });
  result.routesNum = routesNum;
  return result;
}
this.onmessage = (e) => {
  let {routes,airports,globalRadius,idRelationMap} = e.data;
  let {type,query} = e.data.condition;// 传过来的query也是virtualID

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
            // 将所有航线根据终点Destination Airport分类 第6个是Destination airport ID
            divByItem = divideArrayByItem(routes,5,routes);
            break;
    }
    // let sortByItem = Object.keys(divByItem).sort((a,b) => {
    //   return divByItem[a].length > divByItem[b].length;
    // });
    let linesProps = route2CurveByCondition(divByItem,airports,globalRadius,query,idRelationMap);
    let statistics = query && countRoute(divByItem,airports,query,idRelationMap);

    console.log(linesProps);
    this.postMessage({
        linesProps,
        // sortByItem,
        statistics
    });
};
