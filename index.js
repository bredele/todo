
//dependencies

var View = require('view');
var Store = require('store');
var Events = require('event-plugin');
var Each = require('each-plugin');

//init

var todo = new View();
var list = new Store([]);
var todos = new Each(list);

stats = new Store({
	completed: 0
});

stats.compute('left', function(){
	return list.data.length - this.completed; //to string?
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
		if(list.get(l).status === 'completed') count++;
	}
	stats.set('completed', count);
}

var controller = {
	//we should have an input plugin
	submit: function(ev, node){
		if(ev.keyCode === 13) {
			//store should have push
			list.set(list.data.length,{
				label: node.value,
				status: 'pending' //we set a class which is not needed
			});
			node.value = "";
			stats.set('left', stats.get('left') + 1); //better way?
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
		while(l--) {
			//store should have update
			list.set(l, {
				status : 'completed'
			});
		}
		stats.set('completed', l);
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
todo.attr('events', new Events(controller));
todo.attr('visible', require('hidden-plugin'));
todo.alive();