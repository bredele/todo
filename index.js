
//dependencies

var View = require('view');
var Store = require('store');
var Events = require('event-plugin');
var Each = require('each-plugin');

//init

var todo = new View();
var list = new Store([]);
var todos = new Each(list);

var stats = new Store({
	pending: 0
});

//we should do that in interpolation
stats.compute('left', function(){
	return this.pending.toString();
});

stats.compute('completed', function(){
	return (list.data.length - this.pending);
});

//controller 

function todoIndex(list, node){
  var ul = [].slice.call(list.children);
  return ul.indexOf(node.parentElement);
}

function completed(){
  var l = list.data.length,
     count = 0;
	while(l--) {
		//should may be be a boolean
		if(list.get(l).status === 'pending') count++;
	}
	stats.set('pending', count);
}

var controller = {
	//we should have an input plugin
	submit: function(ev, node){
		if(ev.keyCode === 13 && node.value) {
			//store should have push
			list.set(list.data.length,{
				label: node.value,
				status: 'pending' //we set a class which is not needed
			});
			node.value = "";
			completed();
		}
	},
	//it seems really complicated
	status: function(ev, node){
		var target = ev.target;
		var index = todoIndex(node, target);
		var store = todos.items[index].store;

		//better if boolean
		store.set('status', ev.target.checked ? 'completed' : 'pending');
		completed();
	},

	toggleAll: function(){
		//do store loop
		var l = list.data.length;
		stats.set('completed', l);
		while(l--) {
			todos.items[l].store.set('status', 'completed');
		}
	},

	delAll : function(){
		//do store loop
		var l = list.data.length;
		while(l--) {
			var item = list.get(l);
			if(item.status === 'completed') list.del(l);
		}
		completed();
	},

	//the html attribute is huge :s
	del: function(ev, node){
		list.del(todoIndex(node, ev.target));
		completed();
	}
};

//bindings

todo.html(document.getElementById('todoapp'), stats);
todo.attr('todos', todos);
todo.attr('events', new Events(controller)); // could be greate to do events(controller) and events.off, etc
todo.attr('visible', require('hidden-plugin'));
todo.alive();