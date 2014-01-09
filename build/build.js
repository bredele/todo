
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("bredele-trim/index.js", function(exports, require, module){

/**
 * Expose 'trim'
 * @param  {String} str
 * @api public
 */
module.exports = function(str){
  if(str.trim) return str.trim();
  return str.replace(/^\s*|\s*$/g, '');
};
});
require.register("bredele-supplant/index.js", function(exports, require, module){
var indexOf = require('indexof'),
    trim = require('trim'),
    props = require('./lib/props');


var cache = {};

function scope(statement){
  var result = props(statement, 'model.');
  return new Function('model', 'return ' + result);
};

/**
 * Variable substitution on the string.
 *
 * @param {String} str
 * @param {Object} model
 * @return {String} interpolation's result
 */

 module.exports = function(text, model){
	//TODO:  cache the function the entire text or just the expression?
  return text.replace(/\{([^}]+)\}/g, function(_, expr) {
  	if(/[.'[+(]/.test(expr)) {
  		var fn = cache[expr] = cache[expr] || scope(expr);
  		return fn(model) || '';
  	}
    return model[trim(expr)] || '';
  });
};


module.exports.attrs = function(text) {
  var exprs = [];
  text.replace(/\{([^}]+)\}/g, function(_, expr){
    var val = trim(expr);
    if(!~indexOf(exprs, val)) exprs.push(val);
  });
  return exprs;
};
});
require.register("bredele-supplant/lib/props.js", function(exports, require, module){
var indexOf = require('indexof');

/**
 * Global Names
 */

var globals = /\b(Array|Date|Object|Math|JSON)\b/g;

/**
 * Return immediate identifiers parsed from `str`.
 *
 * @param {String} str
 * @param {String|Function} map function or prefix
 * @return {Array}
 * @api public
 */

module.exports = function(str, fn){
  var p = unique(props(str));
  if (fn && 'string' == typeof fn) fn = prefixed(fn);
  if (fn) return map(str, p, fn);
  return p;
};

/**
 * Return immediate identifiers in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function props(str) {
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .replace(globals, '')
    .match(/[a-zA-Z_]\w*/g)
    || [];
}

/**
 * Return `str` with `props` mapped with `fn`.
 *
 * @param {String} str
 * @param {Array} props
 * @param {Function} fn
 * @return {String}
 * @api private
 */

function map(str, props, fn) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return fn(_);
    if (!~indexOf(props, _)) return _;
    return fn(_);
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~indexOf(ret, arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Map with prefix `str`.
 */

function prefixed(str) {
  return function(_){
    return str + _;
  };
}
});
require.register("bredele-plugin-parser/index.js", function(exports, require, module){

/**
 * Plugin constructor.
 * @api public
 */

module.exports = function(str) {
	str = str.replace(/ /g,'');
	var phrases = str ? str.split(';') : ['main'];
  //var phrases = str.replace(/ /g,'').split(';') || ['main'];
  var results = [];
  for(var i = 0, l = phrases.length; i < l; i++) {
    var expr = phrases[i].split(':');

    var params = [];
    var name = expr[0];

    if(expr[1]) {
      params = expr[1].split(',');
    } else {
      name = 'main';
    }

    results.push({
      method: expr[0],
      params: params
    });
  }
  return results;
 };
});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("bredele-binding/index.js", function(exports, require, module){
var subs = require('./lib/attr'),
    parser = require('plugin-parser');


/**
 * Expose 'data binding'
 */

module.exports = Binding;


/**
 * Intitialize a binding.
 * @param {Object} model 
 */

function Binding(model){
  if(!(this instanceof Binding)) return new Binding(model);
  //TODO: mixin with store if not instanceof store
  this.model = model;
  this.plugins = {};
}


/**
 * Bind object as function.
 * @api private
 */

function binder(obj) {
  return function(el, expr) {
    var formats = parser(expr);
    for(var i = 0, l = formats.length; i < l; i++) {
      var format = formats[i];
      format.params.splice(0, 0, el);
      obj[format.method].apply(obj, format.params);
    }
  };
}


/**
 * Add binding by name
 * @param {String} name  
 * @param {Object} plugin 
 * @api public
 */

Binding.prototype.add = function(name, plugin) {
  if(typeof plugin === 'object') plugin = binder(plugin);
  this.plugins[name] = plugin;
  return this;
};


/**
 * Attribute binding.
 * @param  {HTMLElement} node 
 * @api private
 */

Binding.prototype.bindAttrs = function(node) {
  var attrs = node.attributes;
  //reverse loop doesn't work on IE...
  for(var i = 0, l = attrs.length; i < l; i++) {
    var attr = attrs[i],
        plugin = this.plugins[attr.nodeName];

    if(plugin) {
      plugin.call(this.model, node, attr.nodeValue);
    } else {
      subs(attr, this.model);
    }
  }
};


/**
 * Apply bindings on a single node
 * @param  {DomElement} node 
 * @api private
 */

Binding.prototype.bind = function(node) {
  var type = node.nodeType;
  //dom element
  if (type === 1) return this.bindAttrs(node);
  // text node
  if (type === 3) subs(node, this.model);
};


/**
 * Apply bindings on nested DOM element.
 * @param  {DomElement} node 
 * @api public
 */

Binding.prototype.apply = function(node) {
  var nodes = node.childNodes;
  this.bind(node);
  //use each?
  for (var i = 0, l = nodes.length; i < l; i++) {
    this.apply(nodes[i]);
  }
};

});
require.register("bredele-binding/lib/attr.js", function(exports, require, module){
var supplant = require('supplant'), //don't use supplant for attributes (remove attrs)
    indexOf = require('indexof'),
    props = require('supplant/lib/props'); //TODO: make component props or supplant middleware


/**
 * Node text substitution constructor.
 * @param {HTMLElement} node type 3
 * @param {Store} store 
 */

module.exports = function(node, store) {
  var text = node.nodeValue;

  //TODO: it seems faster if index in index.js??
  //is it enought to say that's an interpolation?
  if(!~ indexOf(text, '{')) return;

  var exprs = getProps(text),
      handle = function() {
        node.nodeValue = supplant(text, store.data);
      };

  for(var l = exprs.length; l--;) {
    //when destroy binding, we should do off store
    store.on('change ' + exprs[l], handle);
  }

  handle();
};


function getProps(text) {
  var exprs = [];
  
  //is while and test faster?
  text.replace(/\{([^}]+)\}/g, function(_, expr){
    if(!~indexOf(exprs, expr)) exprs = exprs.concat(props(expr));
  });

  return exprs;
}
});
require.register("bredele-view/index.js", function(exports, require, module){
var Binding = require('binding'),
    Store = require('store');


/**
 * Expose 'View'
 */

module.exports = View;


/**
 * View constructor.
 * We keep the constructor clean for override.
 * @api public
 */

function View(){
  this.dom = null;
  this.store = null;
  this.binding = new Binding();
}

/**
 * String to DOM.
 * @api pruvate
 */

function domify(tmpl){
  if(tmpl instanceof Element) return tmpl;
  //may be by applying binding on this node we can have multiple
  //children
  var div = document.createElement('div');
  //use component insert
  div.innerHTML = tmpl;
  return div.firstChild;
}


/**
 * Turn HTML into DOM with data store.
 * The template is either a string or 
 * an existing HTML element.
 * @param  {String|HTMLElement|Function} tmpl  
 * @param  {Object} store can be nothing, an object or a store
 * @api public
 */

View.prototype.html = function(tmpl, store) { //add mixin obj?
  if(typeof tmpl === 'function') {
    //TODO: use component to array
    this.dom = tmpl.apply(null, [].slice.call(arguments, 1));
  } else {
    this.store = new Store(store);
    this.binding.model = this.store;
    this.dom = domify(tmpl);
  }
  return this;
};


/**
 * Add attribute binding plugin.
 * @param  {String} name 
 * @param  {Object | Function} plug 
 * @return {View}
 * @api public
 */

View.prototype.attr = function(name, plug) {
  this.binding.add(name, plug);
  return this;
};


/**
 * Add binding plugin.
 * @param  {String} name 
 * @param  {Object | Function} plug 
 * @return {View}
 * @api public
 */

View.prototype.data = function(name, plug) {
  return this.attr('data-' + name, plug);
};


/**
 * Place widget in document.
 * @param {HTMLElement} node
 * @api public
 */

View.prototype.insert = function(node) {
  this.alive();
  node.appendChild(this.dom);
};


/**
 * Apply data-binding on dom.
 * @param {HTMLElement} node widget's dom if undefined
 * @api publi
 */

View.prototype.alive = function(node) {
  //do we want to apply multiple times? no
  if(node) this.dom = node;
  this.binding.apply(this.dom);
};


/**
 * Call the destroy method for every registered plugin.
 * 
 * @api public
 */

View.prototype.destroy = function() {
  var plugins = this.binding.plugins,
      parent = this.dom.parentNode;
  //has own properties?
  for(var name in plugins) {
    var plugin = plugins[name];
    plugin.destroy && plugin.destroy();
  }
  if(parent) parent.removeChild(this.dom);

};

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("bredele-each/index.js", function(exports, require, module){

/**
 * Expose 'each'
 */

module.exports = function(obj, fn, scope){
  if( obj instanceof Array) {
    array(obj, fn, scope);
  } else if(typeof obj === 'object') {
    object(obj, fn, scope);
  }
};


/**
 * Object iteration.
 * @param  {Object}   obj   
 * @param  {Function} fn    
 * @param  {Object}   scope 
 * @api private
 */

function object(obj, fn, scope) {
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      fn.call(scope, i, obj[i]);
    }
  }
}


/**
 * Array iteration.
 * @param  {Array}   obj   
 * @param  {Function} fn    
 * @param  {Object}   scope 
 * @api private
 */

function array(obj, fn, scope){
  for(var i = 0, l = obj.length; i < l; i++){
    fn.call(scope, i, obj[i]);
  }
}
});
require.register("bredele-clone/index.js", function(exports, require, module){

/**
 * Expose 'clone'
 * @param  {Object} obj 
 * @api public
 */

module.exports = function(obj) {
  if(obj instanceof Array) {
    return obj.slice(0);
  }
  return clone(obj);
};


/**
 * Clone object.
 * @param  {Object} obj 
 * @api private
 */

function clone(obj){
  if(typeof obj === 'object') {
    var copy = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = clone(obj[key]);
      }
    }
    return copy;
  }
  return obj;
}
});
require.register("bredele-store/index.js", function(exports, require, module){
var Emitter = require('emitter'),
    clone = require('clone'),
    each = require('each'),
    storage = window.localStorage;

/**
 * Expose 'Store'
 */

module.exports = Store;


/**
 * Store constructor
 * @api public
 */

function Store(data) {
  if(data instanceof Store) return data;
  this.data = data || {};
  this.formatters = {};
}


Emitter(Store.prototype);

/**
 * Set store attribute.
 * @param {String} name
 * @param {Everything} value
 * @api public
 */

Store.prototype.set = function(name, value, plugin) { //add object options
  var prev = this.data[name];
  if(prev !== value) {
    this.data[name] = value;
    this.emit('change', name, value, prev);
    this.emit('change ' + name, value, prev);
  }
};


/**
 * Get store attribute.
 * @param {String} name
 * @return {Everything}
 * @api public
 */

Store.prototype.get = function(name) {
  var formatter = this.formatters[name];
  var value = this.data[name];
  if(formatter) {
    value = formatter[0].call(formatter[1], value);
  }
  return value;
};

/**
 * Get store attribute.
 * @param {String} name
 * @return {Everything}
 * @api private
 */

Store.prototype.has = function(name) {
  //NOTE: I don't know if it should be public
  return this.data.hasOwnProperty(name);
};


/**
 * Delete store attribute.
 * @param {String} name
 * @return {Everything}
 * @api public
 */

Store.prototype.del = function(name) {
  //TODO:refactor this is ugly
  if(this.has(name)){
    if(this.data instanceof Array){
      this.data.splice(name, 1);
    } else {
      delete this.data[name]; //NOTE: do we need to return something?
    }
    this.emit('deleted', name, name);
    this.emit('deleted ' + name, name);
  }
};


/**
 * Set format middleware.
 * Call formatter everytime a getter is called.
 * A formatter should always return a value.
 * @param {String} name
 * @param {Function} callback
 * @param {Object} scope
 * @return this
 * @api public
 */

Store.prototype.format = function(name, callback, scope) {
  this.formatters[name] = [callback,scope];
  return this;
};


/**
 * Compute store attributes
 * @param  {String} name
 * @return {Function} callback                
 * @api public
 */

Store.prototype.compute = function(name, callback) {
  //NOTE: I want something clean instaead passing the computed 
  //attribute in the function
  var str = callback.toString();
  var attrs = str.match(/this.[a-zA-Z0-9]*/g);

  this.set(name, callback.call(this.data)); //TODO: refactor (may be use replace)
  for(var l = attrs.length; l--;){
    this.on('change ' + attrs[l].slice(5), function(){
      this.set(name, callback.call(this.data));
    });
  }
};


/**
 * Reset store
 * @param  {Object} data 
 * @api public
 */

Store.prototype.reset = function(data) {
  var copy = clone(this.data),
      length = data.length;
  this.data = data;


    //remove undefined attributes
    //TODO: we don't need to go through each items for array (only difference)
    each(copy, function(key, val){
      if(typeof data[key] === 'undefined'){
        this.emit('deleted', key, length);
        this.emit('deleted ' + key, length);
      }
    }, this);

  //set new attributes
  each(data, function(key, val){
    //TODO:refactor with this.set
    var prev = copy[key];
    if(prev !== val) {
      this.emit('change', key, val, prev);
      this.emit('change ' + key, val, prev);
    }
  }, this);
};


/**
 * Loop through store data.
 * @param  {Function} cb   
 * @param  {[type]}   scope 
 * @api public
 */

Store.prototype.loop = function(cb, scope) {
  each(this.data, cb, scope || this);
};


/**
 * Synchronize with local storage.
 * 
 * @param  {String} name 
 * @param  {Boolean} bool save in localstore
 * @api public
 */

Store.prototype.local = function(name, bool) {
  //TODO: should we do a clear for .local()?
  if(!bool) {
    storage.setItem(name, this.toJSON());
  } else {
    this.reset(JSON.parse(storage.getItem(name)));
  }
  //TODO: should we return this?
};


/**
 * Use middlewares to extend store.
 * A middleware is a function with the store
 * as first argument.
 * 
 * @param  {Function} fn 
 * @return {this}
 * @api public
 */

Store.prototype.use = function(fn) {
  fn(this);
  return this;
};


/**
 * Stringify model
 * @return {String} json
 * @api public
 */

Store.prototype.toJSON = function() {
  return JSON.stringify(this.data);
};

//TODO: localstorage middleware like
});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});
require.register("component-query/index.js", function(exports, require, module){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

});
require.register("component-matches-selector/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var query = require('query');

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

});
require.register("discore-closest/index.js", function(exports, require, module){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return  
  }
}
});
require.register("component-delegate/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var closest = require('closest')
  , event = require('event');

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

});
require.register("bredele-event-plugin/index.js", function(exports, require, module){
/**
 * Dependencies
 */

var ev = require('event'),
    delegate = require('delegate');

/**
 * Map touch events.
 * @type {Object}
 * @api private
 */

var mapper = {
	'click' : 'touchend',
	'mousedown' : 'touchstart',
	'mouseup' : 'touchend',
	'mousemove' : 'touchmove'
};


/**
 * Expose 'Event plugin'
 */

module.exports = Events;


/**
 * Event plugin constructor
 * @param {Object} view event plugin scope
 * @param {Boolean} isTouch optional
 * @api public
 */

function Events(view, isTouch){
  this.view = view;
  this.listeners = [];
  this.isTouch = isTouch || (window.ontouchstart !== undefined);
}



/**
 * Listen events.
 * @param {HTMLElement} node 
 * @param {String} type event's type
 * @param {String} callback view's callback name
 * @param {String} capture useCapture
 * @api private
 */

Events.prototype.on = function(node, type, callback, capture) {
  var _this = this,
      cap = (capture === 'true'),
      cb = function(e) {
        _this.view[callback].call(_this.view, e, node);
      };
  ev.bind(node, this.map(type), cb, cap);
  this.listeners.push([node, this.map(type), cb, cap]);
};


/**
 * Event delegation.
 * @param {HTMLElement} node 
 * @param {String} selector
 * @param {String} type event's type
 * @param {String} callback view's callback name
 * @param {String} capture useCapture
 * @api private
 */

Events.prototype.delegate = function(node, selector, type, callback, capture) {
  var _this = this,
      cap = (capture === 'true'),
      cb = delegate.bind(node, selector, this.map(type), function(e){
      _this.view[callback].call(_this.view, e, node);
      }, cap);
  this.listeners.push([node, this.map(type), cb, cap]);
};


/**
 * Map events (desktop and mobile)
 * @param  {String} type event's name
 * @return {String} mapped event
 */

Events.prototype.map = function(type) {
	return this.isTouch ? (mapper[type] || type) : type;
};


/**
 * Remove all listeners.
 * @api public
 */

Events.prototype.destroy = function() {
  for(var l = this.listeners.length; l--;) {
    var listener = this.listeners[l];
    ev.unbind(listener[0], listener[1], listener[2], listener[3]);
  }
  this.listeners = [];
};


});
require.register("bredele-list/index.js", function(exports, require, module){
var Binding = require('binding'),
    Store = require('store'),
    each = require('each'),
    index = require('indexof');



/**
 * Expose 'List'
 */

module.exports = List;


/**
 * List constructor.
 * 
 * @param {HTMLelement} el
 * @param {Object} model
 * @api public
 */

function List(store){
  this.store = new Store(store);
  this.items = [];
}


/**
 * Bind HTML element with store.
 * Takes the first child as an item renderer.
 * 
 * @param  {HTMLElement} node 
 * @api public
 */

List.prototype.main =  
List.prototype.list = function(node) {
  var first = node.children[0],
      _this = this;

  this.node = node;
  this.clone = first.cloneNode(true);
  node.removeChild(first);


  this.store.on('change', function(key, value){
    var item = _this.items[key];
    if(item) {
      //NOTE: should we unbind in store when we reset?
      item.reset(value); //do our own emitter to have scope
    } else {
      //create item renderer
      _this.addItem(key, value);
    }
  });

  this.store.on('deleted', function(key, idx){
    _this.delItem(idx);
  });

  this.store.loop(this.addItem, this);
};

/**
 * Return index of node in list.
 * @param  {HTMLelement} node 
 * @return {Number}  
 * @api public
 */

List.prototype.indexOf = function(node) {
  var children = [].slice.call(this.node.children);
  return index(children, node);
};


/**
 * Loop over the list items.
 * Execute callback and pass store item.
 * 
 * @param  {Function} cb    
 * @param  {Object}   scope 
 * @api public
 */

List.prototype.loop = function(cb, scope) {
  each(this.items, function(idx, item){
    cb.call(scope, item.store);
  });
};


/**
 * Add list item.
 * 
 * @param {Object} obj
 * @api public
 */

List.prototype.add = function(obj) {
  //store push?
  //in the future, we could use a position
  this.store.set(this.store.data.length, obj);
};


/**
 * Set list item.
 * 
 * @param {HTMLElement|Number} idx 
 * @param {Object} obj
 * @api public
 */

List.prototype.set = function(idx, obj) {
  if(idx instanceof HTMLElement) idx = this.indexOf(idx);
  var item = this.items[idx].store;
  each(obj, function(key, val){
    item.set(key, val);
  });
};


/**
 * Delete item(s) in list.
 * 
 * @api public
 */

List.prototype.del = function(arg, scope) {
  //we should optimize store reset
  if(arg === undefined) return this.store.reset([]);
  if(typeof arg === 'function') {
    //could we handle that with inverse loop and store loop?
    var l = this.store.data.length;
    while(l--) {
      if(arg.call(scope, this.items[l].store)){
        this.store.del(l);
      }
    }
  }
  this.store.del(arg instanceof HTMLElement ? this.indexOf(arg): arg);
};


/**
 * Create item renderer from data.
 * @param  {Object} data 
 * @api private
 */

List.prototype.addItem = function(key, data) {
  var item = new ItemRenderer(this.clone, data);
  this.items[key] = item;
  this.node.appendChild(item.dom);
};


/**
 * Delete item.
 * @param  {Number} idx index
 * @api private
 */

List.prototype.delItem = function(idx) {
    var item = this.items[idx];
    item.unbind(this.node);
    this.items.splice(idx, 1);
    item = null; //for garbage collection
};


/**
 * Item renderer.
 * Represents the item that going to be repeated.
 * @param {HTMLElement} node 
 * @param {Store} data 
 * @api private
 */

function ItemRenderer(node, data){
  //NOTE: is it more perfomant to work with string?
  this.dom = node.cloneNode(true);
  this.store = new Store(data);
  this.binding = new Binding(this.store); //we have to have a boolean parameter to apply interpolation &|| plugins
  this.binding.apply(this.dom);
}


/**
 * Unbind an item renderer from its ancestor.
 * @param  {HTMLElement} node 
 * @api private
 */

ItemRenderer.prototype.unbind = function(node) {
  //NOTE: is there something else to do to clean the memory?
  this.store.off();
  node.removeChild(this.dom);
};


/**
 * Reset iten renderer.
 * @param  {Object} data 
 * @api private
 */

ItemRenderer.prototype.reset = function(data) {
  this.store.reset(data);
};


});
require.register("component-classes/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("bredele-hidden-plugin/index.js", function(exports, require, module){
var classes = require('classes');


/**
 * Conditionally add 'hidden' class.
 * @param {HTMLElement} node 
 * @param {String} attr model's attribute
 * @api public
 */

module.exports = function(node, attr) {
	this.on('change ' + attr, function(val) {
		if(val) {
			classes(node).remove('hidden');
		} else {
			classes(node).add('hidden');
		}
	});
};

});
require.register("todo/index.js", function(exports, require, module){

//dependencies

var View = require('view'),
    Store = require('store'),
    Events = require('event-plugin'),
    List = require('list'),
    html = require('./todo.html');

//init

var app = new View();
todos = new List([]);
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
		var count = 0;
		cb.call(null, ev.target.parentElement, ev); //remove ev when filter submit event
		todos.loop(function(todo) {
			if(todo.get('status') === 'pending') count++;
		});
		store.set('items', todos.store.data.length); //have size
		store.set('pending', count);
		// todos.store.local('todos');
		// store.local('stats');
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
	
  edit : function(ev) {
  	//delegate should nay be passe the target
  	var target = ev.target;
  	target.contentEditable = true;
  },

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
});










require.register("todo/todo.html", function(exports, require, module){
module.exports = '<section id="todoapp">\n  <header id="header">\n    <h1>todos</h1>\n    <input id="new-todo" placeholder="What needs to be done?" events="on:keypress,add" autofocus>\n  </header>\n  <section id="main">\n    <input id="toggle-all" type="checkbox" events="on:click,toggleAll">\n    <label for="toggle-all">Mark all as complete</label>\n    <ul id="todo-list" events="delegate:.toggle,click,toggle;delegate:.destroy,click,del;delegate:.label,dblclick,edit" todos>\n      <li class="{status}">\n        <input class="toggle" type="checkbox">\n        <label class="label">{label}</label>\n        <button class="destroy"></button>\n      </li>\n    </ul>\n  </section>\n  <footer id="footer" class="hidden" visible="items">\n    <span id="todo-count">\n      <strong>{ \'\' + pending }</strong> \n      item{ pending !== 1 ? \'s\' : \'\' } left\n    </span>\n    <button id="clear-completed" events="on:click,delAll" class="{completed ? \'\' : \'hidden\'}">\n      Clear completed ({ completed })\n    </button>\n  </footer>\n</section>';
});
require.alias("bredele-view/index.js", "todo/deps/view/index.js");
require.alias("bredele-view/index.js", "todo/deps/view/index.js");
require.alias("bredele-view/index.js", "view/index.js");
require.alias("bredele-binding/index.js", "bredele-view/deps/binding/index.js");
require.alias("bredele-binding/lib/attr.js", "bredele-view/deps/binding/lib/attr.js");
require.alias("bredele-binding/index.js", "bredele-view/deps/binding/index.js");
require.alias("bredele-supplant/index.js", "bredele-binding/deps/supplant/index.js");
require.alias("bredele-supplant/lib/props.js", "bredele-binding/deps/supplant/lib/props.js");
require.alias("bredele-supplant/index.js", "bredele-binding/deps/supplant/index.js");
require.alias("component-indexof/index.js", "bredele-supplant/deps/indexof/index.js");

require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-trim/index.js");
require.alias("bredele-supplant/index.js", "bredele-supplant/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-binding/deps/plugin-parser/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-binding/deps/plugin-parser/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-plugin-parser/index.js");
require.alias("component-indexof/index.js", "bredele-binding/deps/indexof/index.js");

require.alias("bredele-binding/index.js", "bredele-binding/index.js");
require.alias("bredele-store/index.js", "bredele-view/deps/store/index.js");
require.alias("bredele-store/index.js", "bredele-view/deps/store/index.js");
require.alias("component-emitter/index.js", "bredele-store/deps/emitter/index.js");

require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-each/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-clone/index.js");
require.alias("bredele-store/index.js", "bredele-store/index.js");
require.alias("bredele-view/index.js", "bredele-view/index.js");
require.alias("bredele-store/index.js", "todo/deps/store/index.js");
require.alias("bredele-store/index.js", "todo/deps/store/index.js");
require.alias("bredele-store/index.js", "store/index.js");
require.alias("component-emitter/index.js", "bredele-store/deps/emitter/index.js");

require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-each/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-clone/index.js");
require.alias("bredele-store/index.js", "bredele-store/index.js");
require.alias("component-event/index.js", "todo/deps/event/index.js");
require.alias("component-event/index.js", "event/index.js");

require.alias("bredele-event-plugin/index.js", "todo/deps/event-plugin/index.js");
require.alias("bredele-event-plugin/index.js", "todo/deps/event-plugin/index.js");
require.alias("bredele-event-plugin/index.js", "event-plugin/index.js");
require.alias("component-event/index.js", "bredele-event-plugin/deps/event/index.js");

require.alias("component-delegate/index.js", "bredele-event-plugin/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("bredele-event-plugin/index.js", "bredele-event-plugin/index.js");
require.alias("bredele-list/index.js", "todo/deps/list/index.js");
require.alias("bredele-list/index.js", "todo/deps/list/index.js");
require.alias("bredele-list/index.js", "list/index.js");
require.alias("bredele-binding/index.js", "bredele-list/deps/binding/index.js");
require.alias("bredele-binding/lib/attr.js", "bredele-list/deps/binding/lib/attr.js");
require.alias("bredele-binding/index.js", "bredele-list/deps/binding/index.js");
require.alias("bredele-supplant/index.js", "bredele-binding/deps/supplant/index.js");
require.alias("bredele-supplant/lib/props.js", "bredele-binding/deps/supplant/lib/props.js");
require.alias("bredele-supplant/index.js", "bredele-binding/deps/supplant/index.js");
require.alias("component-indexof/index.js", "bredele-supplant/deps/indexof/index.js");

require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-trim/index.js");
require.alias("bredele-supplant/index.js", "bredele-supplant/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-binding/deps/plugin-parser/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-binding/deps/plugin-parser/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-plugin-parser/index.js");
require.alias("component-indexof/index.js", "bredele-binding/deps/indexof/index.js");

require.alias("bredele-binding/index.js", "bredele-binding/index.js");
require.alias("bredele-store/index.js", "bredele-list/deps/store/index.js");
require.alias("bredele-store/index.js", "bredele-list/deps/store/index.js");
require.alias("component-emitter/index.js", "bredele-store/deps/emitter/index.js");

require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-each/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-clone/index.js");
require.alias("bredele-store/index.js", "bredele-store/index.js");
require.alias("component-indexof/index.js", "bredele-list/deps/indexof/index.js");

require.alias("bredele-each/index.js", "bredele-list/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-list/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-each/index.js");
require.alias("bredele-list/index.js", "bredele-list/index.js");
require.alias("bredele-hidden-plugin/index.js", "todo/deps/hidden-plugin/index.js");
require.alias("bredele-hidden-plugin/index.js", "todo/deps/hidden-plugin/index.js");
require.alias("bredele-hidden-plugin/index.js", "hidden-plugin/index.js");
require.alias("component-classes/index.js", "bredele-hidden-plugin/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("bredele-hidden-plugin/index.js", "bredele-hidden-plugin/index.js");
require.alias("todo/index.js", "todo/index.js");