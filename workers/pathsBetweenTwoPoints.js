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
