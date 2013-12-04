
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
	completed: 0 //could be a ompute of length and left
}); //i prefer Store({})
stats.compute('left', function(){
	return (list.data.length - this.completed).toString();
});

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
		var index = ul.indexOf(parent);
		var store = todos.items[index].store;

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
	toggleAll: function(){
		//do store loop
		var l = list.data.length;
		while(l--) {
			//store should have update
			list.set(l, {
				status : 'completed'
			});
		}
	},
	delAll : function(){
		//do store loop
		var l = list.data.length;
		while(l--) {
			var item = list.get(l);
			if(item.status === 'completed') list.del(l);
		}
		stats.set('completed', 0);
	},
	//the html attribute is huge :s
	del: function(ev, node){
		var ul = [].slice.call(node.children); //use to array
		var index = ul.indexOf(ev.target.parentElement);
		var store = todos.items[index].store;
		if(store.get('status') === 'completed') {
			stats.set('completed', stats.get('completed') - 1);
		} else {
			stats.set('left', stats.get('left') - 1);
		}
		length--;
		list.del(index);
	}
};

//bindings

todo.html(document.getElementById('todoapp'), stats);
todo.attr('events', new Events(controller));
todo.attr('todos', todos);
todo.attr('visible', require('hidden-plugin'));
todo.alive();