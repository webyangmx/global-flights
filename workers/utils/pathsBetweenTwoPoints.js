importScripts('./utils/createGraph.js');
this.onmessage = function(e) {
  var {startId,endId,routesData,airportsData,idRelationMap} = e.data;

  // var routesData = [
  // ['','','',1000,'',1],
  // ['','','',1000,'',20],
  // ['','','',1000,'',30],
  // ['','','',1000,'',40],
  // ['','','',1000,'',4],
  // ['','','',1000,'',6],
  // ['','','',1,'',2],
  // ['','','',2,'',3],
  // ['','','',3,'',2],
  // ['','','',3,'',100],
  // ['','','',3,'',5],
  // ['','','',100,'',50],
  // ['','','',100,'',60],
  // ['','','',100,'',70],
  // ['','','',4,'',5],
  // ['','','',4,'',6],
  // ['','','',6,'',7],
  // ['','','',5,'',6],
  // ['','','',5,'',2],
  // ['','','',7,'',8],
  // ['','','',7,'',100],
  // ['','','',40,'',30]
  // ];
  // var startId = 1000;
  // var endId = 100;

  var {list,vertices,visited} = createGraph(routesData,airportsData,idRelationMap);
  console.log(list,visited,vertices);

  var stack = [];
  var p = startId;
  var end = endId;

  var result = [];

  stack.push(p);
  visited[p] = true;

  // 在一个数组中找visited为false的节点
  function getNextVertice(arr) {
    for (var i = 0; i < arr.length; i++) {

      if(!visited[arr[i].data] && !arr[i].visited){// 如果为false 即找到
        arr[i].visited = true;
        return arr[i].data;
      }
    }
    return false;
  }

var timer = 0;
  // 循环条件 邻接表为空 或者 已经找到目的节点
  while(stack.length !== 0){
    timer++;
    if(timer > 10000000)
      break;
    p = getNextVertice(list[p]);
    if(!p){
      var head = stack.pop();
      for (var i = 0; i < list[head].length; i++) {
        list[head][i].visited = false;
      }
      visited[head] = false;
      p = stack[stack.length - 1];
      continue;
    }
    stack.push(p);
    visited[p] = true;
    if(p == end){
      // 找到一条
      result.push(stack.slice(0));
      // console.log(stack.slice(0));
      var head = stack.pop();
      for (var i = 0; i < list[head].length; i++) {
        list[head][i].visited = false;
      }
      visited[head] = false;
      p = stack[stack.length - 1];
    }
  }
  console.log(timer,result);
  // this.postMessage({result});
}
