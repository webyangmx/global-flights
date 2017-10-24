importScripts('./utils/utils.js');
this.onmessage = e => {
  let {airlines,routesData:routes} = e.data;
  let divByAirline = divideArrayByItem(routes,1,routes);
  let sortByAirline = Object.keys(divByAirline).sort((a,b) => {
    return divByAirline[b].length - divByAirline[a].length;
  });
  let airlineIDRealationMap = {};
  airlines.forEach((item,index) => {
    airlineIDRealationMap[item[0]] = index;
  });
  this.postMessage({sortByAirline,airlineIDRealationMap});
};
