var Store = require('store');


/**
 * Expose 'Controller'
 */

module.exports = Controller;


/**
 * Controller constructor.
 * @api public
 */

function Controller(todos) {
  this.todos = todos;
  this.stats = new Store({
  	completed: 0
  });
	stats.compute('left', function(){
		return (todos.store.data.length - this.completed).toString(); //soso
	});
}


Controller.prototype.toggle = function() {
	
};


Controller.prototype.toggleAll = function() {

};


Controller.prototype.del = function() {

};


Controller.prototype.delAll = function() {

};


Controller.prototype.add = function(ev, node) {
	this.todos.set(todos.store.data.length, {
		label: node.value,
		completed: 'pending'
	});
};


Controller.prototype.edit = function() {

};


