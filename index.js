
//dependencies

var View = require('view');
var Store = require('store');
var Events = require('event-plugin');
var Each = require('each-plugin');

//init

var todo = new View();
var list = new Store([]);
todos = new Each(list);
var stats = new Store({
	length: 0
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
			stats.set('length', length); //soso
			node.value = "";
		}
	},
	status: function(){
		alert('ola');
	},
	//the html attribute is huge :s
	destroy: function(ev, node){
		var ul = [].slice.call(node.children); //use to array
		var index = ul.indexOf(ev.target.parentElement);
		list.del(index);
		//todos.delItem(list.indexOf(ev.target.parentElement));
	}
};

//bindings

todo.html(document.getElementById('todoapp'), stats);
todo.attr('events', new Events(controller));
todo.attr('todos', todos);
todo.attr('visible', require('hidden-plugin'));
todo.alive();