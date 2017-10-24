importScripts('../lib/three.js');
importScripts("./lib/subworkers.js");
importScripts('./utils/utils.js');
importScripts('./utils/generateOneRoute.js');
importScripts('./utils/pathsBetweenTwoPoints.js');
importScripts('./utils/createGraph.js');
importScripts('./utils/minHeap.js');
this.onmessage = function(e) {
  var {startId,endId,routesData,airportsData,idRelationMap,globeRadius: globalRadius} = e.data;
// -----------------------------------------------------
    // var routesData = [
    // ['','','','NULL','',1],
    // ['','','',1000,'',4],
    // ['','','',1000,'',6],
    // ['','','',1,'',2],
    // ['','','',1,'',2],
    // ['','','',2,'',3],
    // ['','','',2,'',100],
    // ['','','',3,'',2],
    // ['','','',3,'',100],
    // ['','','',3,'',5],
    // ['','','',100,'',50],
    // ['','','',100,'',60],
    // ['','','',100,'',70],
    // ['','','',4,'',5],
    // ['','','',4,'',6],
    // ['','','',6,'',7],
    // ['','','',6,'',1000],
    // ['','','',3,'',1000],
    // ['','','',5,'',6],
    // ['','','',5,'',2],
    // ['','','',7,'',8],
    // ['','','',7,'',100],
    // ['','','',40,'',30]
    // ];
    // var startId = 1000;
    // var endId = 100;

    var {list,vertices,visited} = createGraph(startId,endId,routesData,airportsData,idRelationMap);
    var paths = getAllPaths(list,visited,vertices,startId,endId);
    function unique(arr) {
      return arr.filter(function(item, index, array) {
        return array.indexOf(item) === index;
      });
    }
    var copyPaths = new Set();
    paths.forEach(function(item) {
      copyPaths.add(item.toString());
    });
    var temp = [];
    copyPaths.forEach(function(item) {
      temp.push(item.split(','));
    });
    paths = temp;

    // 计算路径的曲线
    // var lines = [];
    // for (var i = 1; i < paths[0].length; i++) {
    //   lines.push(generatePaths(paths[0][i - 1],paths[0][i],airportsData,globalRadius));
    // }
    // console.log(lines);
    var lines = paths.length && generateOneRoute(paths,airportsData,globalRadius,idRelationMap);
    this.postMessage({
        type:'allPaths',
        lines
    });

// 从结果路径中取点新建一张子图
    var pathVertices = [];
    for (var i = 0; i < paths.length; i++) {
      for (var j = 0; j < paths[i].length; j++) {
        if(pathVertices.indexOf(paths[i][j]) === -1){
          pathVertices.push(paths[i][j]);
        }
      }
    }
    // console.log(pathVertices);
// 根据上面获得的顶点 从邻接表中生成新的邻接子表
for(var key in list){
  var line = list[key];
  for (var i = 0; i < line.length;) {
    if(pathVertices.indexOf(line[i].data) !== -1){ // 是所有路径中的点
      // 计算权值
      list[key][i].pound = getDistacnce(airportsData,globalRadius,idRelationMap,key,line[i].data);
      list[key][i].hn = getDistacnce(airportsData,globalRadius,idRelationMap,endId,line[i].data);
      i++;
      continue;
    }
    //不是所有路径中的点 删除
    line.splice(i,1);
  }
}
for(var key in list){
  if(list[key].length === 0){
    delete list[key];
  }
}
// 最短路径算法
var minPath = AStar(list,startId,endId);
  // 计算最短路径的曲线
  var minPaths = [];
  minPath.forEach(function(item,index){
    minPaths.push(item.data);// 提取id
  });
  var minLines = minPaths.length && generateOneRoute([minPaths],airportsData,globalRadius,idRelationMap)

  // 返回数据进行绘制
  this.postMessage({
      type:'minPath',
      lines:minLines
  });
}
// a*算法
function AStar(list,startId,endId) {
		var open = new MinHeap();
		var openSet = new Set();
		var g = {};

    var start = {},end = {};
    start.data = startId;
    end.data = endId;
		g[start.data] = 0;
    // open 优先队列 最小堆实现
		open.insert(start);
    // openSet 判断优先队列是否含有某节点
		openSet.add(start);
		var closeSet = new Set();
		while(open.head().data !== end.data){ // 循环条件 没找到目标节点
			// 在最小堆open中取出最小值
			var current = open.pop();
			// 加入集合closeSet中
			closeSet.add(current);
			// 循环遍历current的邻接表
			var cost;
			for (var i = 0; i < list[current.data].length; i++) {
				var neighbor = list[current.data][i];
				cost = g[current.data] + neighbor.pound;//cost = g(current) + pound(current, neighbor)
				// if neighbor in OPEN and cost less than g(neighbor):
				if(openSet.has(neighbor) && cost < g[neighbor]){
					openSet.delete(neighbor);
				}
				// if neighbor in CLOSED and cost less than g(neighbor)
				if(closeSet.has(neighbor) && cost < g[neighbor]){
					closeSet.delete(neighbor);
				}
				// if neighbor not in OPEN and neighbor not in CLOSED:
				if(!openSet.has(neighbor) && !closeSet.has(neighbor)){
					// set g(neighbor) to cost
					g[neighbor.data] = cost;
      				// add neighbor to OPEN
      				openSet.add(neighbor);
      				// set priority queue rank to g(neighbor) + h(neighbor)
      				open.insert(neighbor);
      				// set neighbor's parent to current
      				neighbor.parent = current;
				}
			}
		}
    console.log(current);
    closeSet.add(open.head());
    return closeSet;
}

function getDistacnce(airportsData,globalRadius,idRelationMap,virtualID1,virtualID2){
    var airport1 = airportsData[idRelationMap[virtualID1]];
    var airport2 = airportsData[idRelationMap[virtualID2]];
    var coor1 = LatLong2Coor(globalRadius,airport1[7],airport1[6]);
    var coor2 = LatLong2Coor(globalRadius,airport2[7],airport2[6]);
    var vector1 = new THREE.Vector3(coor1.x,coor1.y,coor1.z);
    var vector2 = new THREE.Vector3(coor2.x,coor2.y,coor2.z);

    return vector1.distanceTo(vector2);
}

function getAllPaths(list,visited,vertices,startId,endId) {
  var stack = [];
  var p = startId;
  var end = endId;
  var paths = [];

  stack.push(p);
  visited[p] = true;

  // 在一个数组中找visited为false的节点
  function getNextVertice(arr) {
    if(!arr){return false;}
    for (var i = 0; i < arr.length; i++) {
      // 如果未入栈而且没有被当前栈顶元素访问 则符合
      if(!visited[arr[i].data] && !arr[i].visited){
        // 标志已被当前栈顶元素访问
        arr[i].visited = true;
        return arr[i].data;
      }
    }
    return false;
  }
  var timer = 0;
  // 循环条件 邻接表为空 或者 已经找到目的节点
  while(stack.length !== 0){
    timer ++;
    if(timer > 200000){
      break;
    }
    p = getNextVertice(list[p]);
    // 若没找到下个顶点 则出栈 同时重置出栈元素的临接顶点的visited为false
    // visited数组中出栈元素也置为false
    if(p === false){
      var head = stack.pop();
      if(!list[head]){continue}
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
      // 找到一条路径
      paths.push(stack.slice(0));
      var head = stack.pop();
      for (var i = 0; i < list[head].length; i++) {
        list[head][i].visited = false;
      }
      visited[head] = false;
      p = stack[stack.length - 1];
    }
  }
  return paths;
}
