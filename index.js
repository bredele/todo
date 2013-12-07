
//dependencies

var View = require('view');
var Store = require('store');
var Events = require('event-plugin');
var List = require('list');

//init

var todo = new View();
var todos = new List([]);

var stats = new Store({
	pending: 0
});

//we should do that in interpolation
stats.compute('left', function(){
	return this.pending.toString();
});

stats.compute('completed', function(){
	//todos should have size
	return (todos.store.data.length - this.pending);
});

//controller 

function completed(cb){
	return function(ev){
		var count = 0;
		cb.call(null, ev.target.parentElement, ev); //remove ev when filter submit event
		todos.loop(function(todo){
			if(todo.get('status') === 'pending') count++;
		});
		stats.set('pending', count);
	};
}

var controller = {
	//we should have an input plugin
	submit: completed(function(parent, ev){
		var node = ev.target;
		if(ev.keyCode === 13 && node.value) {
			todos.add({
				status : 'pending',
				label: node.value
			});
			node.value = "";
		}
	}),

	toggle: completed(function(node, ev){
		todos.set(node, {
			status :  ev.target.checked ? 'completed' : 'pending'
		});
	}),

	toggleAll: completed(function(node, ev){
		var status = ev.target.checked ? 'completed' : 'pending';
		todos.loop(function(todo){
			todo.set('status', status);
		});
	}),

	delAll : completed(function(){
		todos.del(function(todo) {
			return todo.get('status') === 'completed';
		});
	}),

	del: completed(function(node){
		todos.del(node);
	})
};

//bindings

todo.html(document.getElementById('todoapp'), stats);
todo.attr('todos', todos);
todo.attr('events', new Events(controller)); // could be greate to do events(controller) and events.off, etc
todo.attr('visible', require('hidden-plugin'));
todo.alive();