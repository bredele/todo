
//dependencies

var View = require('view');
var Store = require('store');
var Events = require('event-plugin');
var Each = require('each-plugin');

//init

var todo = new View();
var list = new Store([]);
todos = new Each(list);
stats = new Store({
	left: 0,
	completed: 0
}); //i prefer Store({})

var length = 0; //trick meanwhile store push

//controller 

var controller = {
	//we should have an input plugin
	submit: function(ev, node){
		if(ev.keyCode === 13) {
			//store should have push
			list.set(length,{
				label: node.value,
				status: 'pending' //we set a class which is not needed
			});
			length++;
			stats.set('left', length); //soso
			node.value = "";
		}
	},
	//it seems really complicated
	status: function(ev, node){
		var target = ev.target;
		var parent = target.parentElement;
		var ul = [].slice.call(node.children); //use to array
		var store = todos.items[ul.indexOf(parent)].store;

		//sheeeeeit
		if(target.checked) {
      store.set('status', 'completed');
      stats.set('left', stats.get('left') - 1);
      stats.set('completed', stats.get('completed') + 1);
		} else {
      store.set('status', 'pending'); 
      stats.set('left', stats.get('left') + 1);
      stats.set('completed', stats.get('completed') - 1);
		}

	},
	//the html attribute is huge :s
	destroy: function(ev, node){
		var ul = [].slice.call(node.children); //use to array
		list.del(ul.indexOf(ev.target.parentElement));
	}
};

//bindings

todo.html(document.getElementById('todoapp'), stats);
todo.attr('events', new Events(controller));
todo.attr('todos', todos);
todo.attr('visible', require('hidden-plugin'));
todo.alive();