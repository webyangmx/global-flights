function createGraph(startId,endId,routesData,airportsData,idRelationMap) {
  let list = {};// 邻接链表
  let visited = {}; // visited 表示是否已经入栈
  let vertices = []; // 存储整张图中非孤立的点
  let country = airportsData[idRelationMap[startId]][3];
  console.log(country);
  if(!country)return;
  // 初始化邻接链表 visited数组
  for (let i = 0; i < routesData.length; i++) {
    let startAirportId = routesData[i][3];
    let endAirportId = routesData[i][5];
    // 若有NULL机场 或值为'' 该航线无效
    if(startAirportId == 'NULL' || endAirportId == 'NULL' || !startAirportId || !endAirportId)
      continue;

    // 限制需要在同一国家的航线 需要转换为实际数组下标
    let startAirport = airportsData[idRelationMap[startAirportId]];
    let endAirport = airportsData[idRelationMap[endAirportId]];
    if(!startAirport || !endAirport)continue;
    let startCountry = startAirport[3];
    let endCountry = endAirport[3];
    if(endCountry !== country || startCountry !== country){
      continue;
    }

    if(vertices.indexOf(startAirportId) === -1){
      vertices.push(startAirportId);
    }
    if(vertices.indexOf(endAirportId) === -1){
      vertices.push(endAirportId);
    }
    // 初始化visited数组(对象)
    visited[startAirportId] = false;
    visited[endAirportId] = false;
  }
  // 初始化邻接链表
  for (let i = 0; i < vertices.length; i++) {
    list[vertices[i]] = [];
  }
  for (let i = 0; i < routesData.length; i++) {
    let startAirportId = routesData[i][3];
    let endAirportId = routesData[i][5];
    // 若有NULL机场 或值为'' 该航线无效
    if(startAirportId == 'NULL' || endAirportId == 'NULL' || !startAirportId || !endAirportId)
      continue;

    // 限制需要在同一国家的航线
    let startAirport = airportsData[idRelationMap[startAirportId]];
    let endAirport = airportsData[idRelationMap[endAirportId]];
    if(!startAirport || !endAirport)continue;
    let startCountry = startAirport[3];
    let endCountry = endAirport[3];
    if(endCountry !== country || startCountry !== country){
      continue;
    }

    if(list[startAirportId]){
      // 判断是否重边
      if(list[startAirportId].indexOf(endAirportId) !== -1)continue;

      list[startAirportId].push({
        data:endAirportId,
        visited:false
      });
    }else{
      list[startAirportId] = [{
        data:endAirportId,
        visited:false
      }];
    }
  }
  return {list,vertices,visited};
}
