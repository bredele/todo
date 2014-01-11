
//dependencies

var View = require('view'),
    Store = require('store'),
    Events = require('event-plugin'),
    List = require('list'),
    html = require('./todo.html');

//init

var app = new View();
var todos = new List([]);
// todos.store.local('todos', true);
var store = new Store({
	items: 0,
	pending: 0
}); //second arguments could be compute
// store.local('stats', true);

store.compute('completed', function() {
	return this.items - this.pending;
});


//controller 

function stats(cb) {
	return function(ev) {
		var count = 0,
		    target = ev.target || ev.srcElement;

		ev.target = target;
		cb.call(null, target.parentElement, ev); //remove ev when filter submit event
		todos.loop(function(todo) {
			if(todo.get('status') === 'pending') count++;
		});
		store.set('items', todos.store.data.length); //have size
		store.set('pending', count);
	};
}

var controller = {
	//we should have an input plugin
	add: stats(function(parent, ev) {
		var node = ev.target;
		if(ev.keyCode === 13 && node.value) {
			todos.add({
				status : 'pending',
				label : node.value
			});
			node.value = "";
		}
	}),
	
	toggle : stats(function(node, ev) {
		todos.set(node, {
			status :  ev.target.checked ? 'completed' : 'pending'
		});
	}),

	toggleAll : stats(function(node, ev) {
		var status = ev.target.checked ? 'completed' : 'pending';
		todos.loop(function(todo) {
			todo.set('status', status);
		});
	}),

	delAll : stats(function() {
		todos.del(function(todo) {
			return todo.get('status') === 'completed';
		});
	}),

	del : stats(function(node) {
		todos.del(node);
	})
};


//bindings

app.html(html, store);
app.attr('todos', todos);
app.attr('events', new Events(controller)); // could be greate to do events(controller) and events.off, etc
app.attr('visible', require('hidden-plugin'));
app.insert(document.querySelector('.todo-container'));