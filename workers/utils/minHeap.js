function MinHeap() {
	this.data = [];
	this.count = 0;
}
MinHeap.prototype.head = function() {
	return this.data[1];
};
MinHeap.prototype._shiftUp = function(k) {
	while(k > 1 && this.data[k].hn < this.data[Math.floor(k / 2)].hn){
		this._swap(k,Math.floor(k / 2));
		k = Math.floor(k / 2);
	}
};
MinHeap.prototype._shiftDown = function(k) {
	// 可以只有左孩子没有有孩子
	while(2 * k <= this.count){
		var j = 2 * k;// j 记录k应该和谁交换
		if(j + 1 <= this.count && this.data[j + 1].hn < this.data[j].hn){
			j++;
		}
		if(this.data[k].hn <= this.data[j].hn){// data[k]已经是最小
			break;
		}
		this._swap(k,j);
		k = j;
	}
};
MinHeap.prototype.insert = function(ele) {
	this.data[this.count + 1] = ele;
	this.count ++;
	this._shiftUp(this.count);
};
MinHeap.prototype.pop = function() {
	var min = this.data[1];
	this._swap(this.count,1);
	this.data.pop();
	this.count --;
	this._shiftDown(1);
	return min;
};
MinHeap.prototype._swap = function(i,j) {
	var temp = this.data[i];
	this.data[i] = this.data[j];
	this.data[j] = temp;
};
