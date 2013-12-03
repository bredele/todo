
//dependencies

var View = require('view');
var Store = require('store');
var Events = require('event-plugin');
var Each = require('each-plugin');

//init

var todo = new View();
var list = new Store([]);
var length = 0; //trick meanwhile store push

//controller 

var controller = {
	//we should have an input plugin
	submit: function(ev, node){
		if(ev.keyCode === 13) {
			//store should have push
			list.set(length,{
				label: node.value
			});
			length++;
			node.value = "";
		}
	}
};

//bindings

todo.html(document.getElementById('todoapp'));
todo.attr('events', new Events(controller));
todo.attr('todos', new Each(list));
todo.alive();