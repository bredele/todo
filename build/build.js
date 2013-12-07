
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
require.register("bredele-trim/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose 'trim'\n\
 * @param  {String} str\n\
 * @api public\n\
 */\n\
module.exports = function(str){\n\
  if(str.trim) return str.trim();\n\
  return str.replace(/^\\s*|\\s*$/g, '');\n\
};//@ sourceURL=bredele-trim/index.js"
));
require.register("bredele-supplant/index.js", Function("exports, require, module",
"var indexOf = require('indexof');\n\
var trim = require('trim');\n\
\n\
\n\
/**\n\
 * Variable substitution on the string.\n\
 *\n\
 * @param {String} str\n\
 * @param {Object} model\n\
 * @return {String} interpolation's result\n\
 */\n\
\n\
module.exports = function(text, model){\n\
  //TODO: refactor with attrs\n\
  return text.replace(/\\{([^}]+)\\}/g, function(_, expr){\n\
    var value = model.get(trim(expr));\n\
    return value ? value : '';\n\
  });\n\
};\n\
\n\
\n\
module.exports.attrs = function(text, model){\n\
  var exprs = [];\n\
  text.replace(/\\{([^}]+)\\}/g, function(_, expr){\n\
    var value = trim(expr);\n\
    if(!~indexOf(exprs, value)) exprs.push(value);\n\
  });\n\
  return exprs;\n\
};\n\
//@ sourceURL=bredele-supplant/index.js"
));
require.register("bredele-subs/index.js", Function("exports, require, module",
"var supplant = require('supplant');\n\
\n\
\n\
/**\n\
 * Node text substitution constructor.\n\
 * @param {HTMLElement} node type 3\n\
 * @param {Store} store \n\
 */\n\
\n\
module.exports = function(node, store) { //may be use an adapter\n\
  var text = node.nodeValue,\n\
      exprs = supplant.attrs(text);\n\
  for(var l = exprs.length; l--;) {\n\
  \t// var expr = exprs[l];\n\
  \t// if(expr[0] === '{') {\t\t\n\
\n\
    store.on('change ' + exprs[l], function() {\n\
      replace(node, text, store);\n\
    });\n\
  }\n\
  replace(node, text, store);\n\
};\n\
\n\
\n\
function replace(node, text, obj) {\n\
  node.nodeValue = supplant(text, obj);\n\
}\n\
//@ sourceURL=bredele-subs/index.js"
));
require.register("bredele-plugin-parser/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Plugin constructor.\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str) {\n\
\tstr = str.replace(/ /g,'');\n\
\tvar phrases = str ? str.split(';') : ['default'];\n\
  //var phrases = str.replace(/ /g,'').split(';') || ['default'];\n\
  var results = [];\n\
  for(var i = 0, l = phrases.length; i < l; i++) {\n\
    var expr = phrases[i].split(':');\n\
\n\
    var params = [];\n\
    var name = expr[0];\n\
\n\
    if(expr[1]) {\n\
      params = expr[1].split(',');\n\
    } else {\n\
      name = 'default';\n\
    }\n\
\n\
    results.push({\n\
      method: expr[0],\n\
      params: params\n\
    });\n\
  }\n\
  return results;\n\
 };//@ sourceURL=bredele-plugin-parser/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("bredele-binding/index.js", Function("exports, require, module",
"var subs = require('subs'),\n\
    indexOf = require('indexof'),\n\
    parser = require('plugin-parser');\n\
\n\
\n\
/**\n\
 * Expose 'data binding'\n\
 */\n\
\n\
module.exports = Binding;\n\
\n\
\n\
/**\n\
 * Intitialize a binding.\n\
 * @param {Object} model \n\
 */\n\
\n\
function Binding(model){\n\
  //TODO: mixin with store if not instanceof store\n\
  this.model = model;\n\
  this.plugins = {};\n\
}\n\
\n\
\n\
/**\n\
 * Add binding by name\n\
 * @param {String} name  \n\
 * @param {Object} plugin \n\
 * @api public\n\
 */\n\
\n\
Binding.prototype.attr = function(name, plugin) {\n\
  this.plugins[name] = plugin;\n\
};\n\
\n\
\n\
/**\n\
 * Add binding by name\n\
 * @param {String} name  \n\
 * @param {Object} plugin \n\
 * @api public\n\
 */\n\
\n\
Binding.prototype.data = function(name, plugin) {\n\
  this.attr(\"data-\" + name, plugin);\n\
};\n\
\n\
\n\
/**\n\
 * Attribute binding.\n\
 * @param  {HTMLElement} node \n\
 * @api private\n\
 */\n\
\n\
Binding.prototype.attrsBinding = function(node){\n\
  var attributes = node.attributes;\n\
  //reverse loop doesn't work on IE...\n\
  for(var i = 0, l = attributes.length; i < l; i++){\n\
    var attribute = attributes[i],\n\
        plugin = this.plugins[attribute.nodeName],\n\
        content = attribute.nodeValue;\n\
\n\
    if(plugin) {\n\
      if(typeof plugin === 'function'){\n\
        plugin.call(this.model, node, content);\n\
      } else {\n\
        //is it necessary...event delegation?\n\
        var formats = parser(content);\n\
        for(var j = 0, h = formats.length; j < h; j++) {\n\
          var format = formats[j];\n\
          format.params.splice(0,0, node);\n\
          plugin[format.method].apply(plugin, format.params);\n\
        }\n\
      }\n\
    } else if(indexOf(content, '{') > -1){\n\
      subs(attribute, this.model);\n\
    }\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Apply bindings on a single node\n\
 * @param  {DomElement} node \n\
 * @api private\n\
 */\n\
\n\
Binding.prototype.applyBindings = function(node) {\n\
  var type = node.nodeType;\n\
  //dom element\n\
  if (type === 1) return this.attrsBinding(node);\n\
  // text node\n\
  if (type == 3) subs(node, this.model);\n\
};\n\
\n\
\n\
/**\n\
 * Apply bindings on nested DOM element.\n\
 * @param  {DomElement} node \n\
 * @api public\n\
 */\n\
\n\
Binding.prototype.apply = function(node) {\n\
  var nodes = node.childNodes;\n\
  this.applyBindings(node);\n\
\n\
  //child nodes are elements and text\n\
  for (var i = 0, l = nodes.length; i < l; i++) {\n\
    this.apply(nodes[i]);\n\
  }\n\
};\n\
//@ sourceURL=bredele-binding/index.js"
));
require.register("bredele-view/index.js", Function("exports, require, module",
"var Binding = require('binding'),\n\
    Store = require('store');\n\
\n\
\n\
/**\n\
 * Expose 'View'\n\
 */\n\
\n\
module.exports = View;\n\
\n\
\n\
/**\n\
 * View constructor.\n\
 * We keep the constructor clean for override.\n\
 * @api public\n\
 */\n\
\n\
function View(){\n\
  this.dom = null;\n\
  this.store = null;\n\
  this.binding = new Binding();\n\
}\n\
\n\
/**\n\
 * String to DOM.\n\
 * @api pruvate\n\
 */\n\
\n\
function domify(tmpl){\n\
  if(tmpl instanceof HTMLElement) return tmpl;\n\
  //may be by applying binding on this node we can have multiple\n\
  //children\n\
  var div = document.createElement('div');\n\
  //use component insert\n\
  div.innerHTML = tmpl;\n\
  return div.firstChild;\n\
}\n\
\n\
\n\
/**\n\
 * Turn HTML into DOM with data store.\n\
 * The template is either a string or \n\
 * an existing HTML element.\n\
 * @param  {String|HTMLElement|Function} tmpl  \n\
 * @param  {Object} store can be nothing, an object or a store\n\
 * @api public\n\
 */\n\
\n\
View.prototype.html = function(tmpl, store) { //add mixin obj?\n\
  if(typeof tmpl === 'function') {\n\
    //TODO: use component to array\n\
    this.dom = tmpl.apply(null, [].slice.call(arguments, 1));\n\
  } else {\n\
    this.store = new Store(store);\n\
    this.binding.model = this.store;\n\
    this.dom = domify(tmpl);\n\
  }\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Add attribute binding plugin.\n\
 * @param  {String} name \n\
 * @param  {Object | Function} plug \n\
 * @return {View}\n\
 * @api public\n\
 */\n\
\n\
View.prototype.attr = function(name, plug) {\n\
  this.binding.attr(name, plug);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Add binding plugin.\n\
 * @param  {String} name \n\
 * @param  {Object | Function} plug \n\
 * @return {View}\n\
 * @api public\n\
 */\n\
\n\
View.prototype.data = function(name, plug) {\n\
  this.binding.data(name, plug);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Place widget in document.\n\
 * @param {HTMLElement} node\n\
 * @api public\n\
 */\n\
\n\
View.prototype.insert = function(node) {\n\
  this.alive();\n\
  node.appendChild(this.dom);\n\
};\n\
\n\
\n\
/**\n\
 * Apply data-binding on dom.\n\
 * @param {HTMLElement} node widget's dom if undefined\n\
 * @api publi\n\
 */\n\
\n\
View.prototype.alive = function(node) {\n\
  //do we want to apply multiple times? no\n\
  if(node) this.dom = node;\n\
  this.binding.apply(this.dom);\n\
};\n\
\n\
\n\
/**\n\
 * Call the destroy method for every registered plugin.\n\
 * \n\
 * @api public\n\
 */\n\
\n\
View.prototype.destroy = function() {\n\
  var plugins = this.binding.plugins,\n\
      parent = this.dom.parentNode;\n\
  //has own properties?\n\
  for(var name in plugins) {\n\
    var plugin = plugins[name];\n\
    plugin.destroy && plugin.destroy();\n\
  }\n\
  if(parent) parent.removeChild(this.dom);\n\
\n\
};\n\
//@ sourceURL=bredele-view/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("bredele-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose 'each'\n\
 */\n\
\n\
module.exports = function(obj, fn, scope){\n\
  if( obj instanceof Array) {\n\
    array(obj, fn, scope);\n\
  } else if(typeof obj === 'object') {\n\
    object(obj, fn, scope);\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Object iteration.\n\
 * @param  {Object}   obj   \n\
 * @param  {Function} fn    \n\
 * @param  {Object}   scope \n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn, scope) {\n\
  for (var i in obj) {\n\
    if (obj.hasOwnProperty(i)) {\n\
      fn.call(scope, i, obj[i]);\n\
    }\n\
  }\n\
}\n\
\n\
\n\
/**\n\
 * Array iteration.\n\
 * @param  {Array}   obj   \n\
 * @param  {Function} fn    \n\
 * @param  {Object}   scope \n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn, scope){\n\
  for(var i = 0, l = obj.length; i < l; i++){\n\
    fn.call(scope, i, obj[i]);\n\
  }\n\
}//@ sourceURL=bredele-each/index.js"
));
require.register("bredele-clone/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose 'clone'\n\
 * @param  {Object} obj \n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj) {\n\
  if(obj instanceof Array) {\n\
    return obj.slice(0);\n\
  }\n\
  return clone(obj);\n\
};\n\
\n\
\n\
/**\n\
 * Clone object.\n\
 * @param  {Object} obj \n\
 * @api private\n\
 */\n\
\n\
function clone(obj){\n\
  if(typeof obj === 'object') {\n\
    var copy = {};\n\
    for (var key in obj) {\n\
      if (obj.hasOwnProperty(key)) {\n\
        copy[key] = clone(obj[key]);\n\
      }\n\
    }\n\
    return copy;\n\
  }\n\
  return obj;\n\
}//@ sourceURL=bredele-clone/index.js"
));
require.register("bredele-store/index.js", Function("exports, require, module",
"var Emitter = require('emitter'); //TODO:replace by our own with scope\n\
var clone = require('clone');\n\
var each = require('each');\n\
\n\
/**\n\
 * Expose 'Store'\n\
 */\n\
\n\
module.exports = Store;\n\
\n\
\n\
/**\n\
 * Store constructor\n\
 * @api public\n\
 */\n\
\n\
function Store(data) {\n\
  if(data instanceof Store) return data;\n\
  this.data = data || {};\n\
  this.formatters = {};\n\
}\n\
\n\
\n\
Emitter(Store.prototype);\n\
\n\
/**\n\
 * Set store attribute.\n\
 * @param {String} name\n\
 * @param {Everything} value\n\
 * @api public\n\
 */\n\
\n\
Store.prototype.set = function(name, value, plugin) { //add object options\n\
  var prev = this.data[name];\n\
  if(prev !== value) {\n\
    this.data[name] = value;\n\
    this.emit('change', name, value, prev);\n\
    this.emit('change ' + name, value, prev);\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Get store attribute.\n\
 * @param {String} name\n\
 * @return {Everything}\n\
 * @api public\n\
 */\n\
\n\
Store.prototype.get = function(name) {\n\
  var formatter = this.formatters[name];\n\
  var value = this.data[name];\n\
  if(formatter) {\n\
    value = formatter[0].call(formatter[1], value);\n\
  }\n\
  return value;\n\
};\n\
\n\
/**\n\
 * Get store attribute.\n\
 * @param {String} name\n\
 * @return {Everything}\n\
 * @api private\n\
 */\n\
\n\
Store.prototype.has = function(name) {\n\
  //NOTE: I don't know if it should be public\n\
  return this.data.hasOwnProperty(name);\n\
};\n\
\n\
\n\
/**\n\
 * Delete store attribute.\n\
 * @param {String} name\n\
 * @return {Everything}\n\
 * @api public\n\
 */\n\
\n\
Store.prototype.del = function(name) {\n\
  //TODO:refactor this is ugly\n\
  if(this.has(name)){\n\
    if(this.data instanceof Array){\n\
      this.data.splice(name, 1);\n\
    } else {\n\
      delete this.data[name]; //NOTE: do we need to return something?\n\
    }\n\
    this.emit('deleted', name, name);\n\
    this.emit('deleted ' + name, name);\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Set format middleware.\n\
 * Call formatter everytime a getter is called.\n\
 * A formatter should always return a value.\n\
 * @param {String} name\n\
 * @param {Function} callback\n\
 * @param {Object} scope\n\
 * @return this\n\
 * @api public\n\
 */\n\
\n\
Store.prototype.format = function(name, callback, scope) {\n\
  this.formatters[name] = [callback,scope];\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Compute store attributes\n\
 * @param  {String} name\n\
 * @return {Function} callback                \n\
 * @api public\n\
 */\n\
\n\
Store.prototype.compute = function(name, callback) {\n\
  //NOTE: I want something clean instaead passing the computed \n\
  //attribute in the function\n\
  var str = callback.toString();\n\
  var attrs = str.match(/this.[a-zA-Z0-9]*/g);\n\
\n\
  this.set(name, callback.call(this.data)); //TODO: refactor (may be use replace)\n\
  for(var l = attrs.length; l--;){\n\
    this.on('change ' + attrs[l].slice(5), function(){\n\
      this.set(name, callback.call(this.data));\n\
    });\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Reset store\n\
 * @param  {Object} data \n\
 * @api public\n\
 */\n\
\n\
Store.prototype.reset = function(data) {\n\
  var copy = clone(this.data),\n\
      length = data.length;\n\
  this.data = data;\n\
\n\
\n\
    //remove undefined attributes\n\
    //TODO: we don't need to go through each items for array (only difference)\n\
    each(copy, function(key, val){\n\
      if(typeof data[key] === 'undefined'){\n\
        this.emit('deleted', key, length);\n\
        this.emit('deleted ' + key, length);\n\
      }\n\
    }, this);\n\
\n\
  //set new attributes\n\
  each(data, function(key, val){\n\
    //TODO:refactor with this.set\n\
    var prev = copy[key];\n\
    if(prev !== val) {\n\
      this.emit('change', key, val, prev);\n\
      this.emit('change ' + key, val, prev);\n\
    }\n\
  }, this);\n\
};\n\
\n\
\n\
/**\n\
 * Loop through store data.\n\
 * @param  {Function} cb   \n\
 * @param  {[type]}   scope \n\
 * @api public\n\
 */\n\
\n\
Store.prototype.loop = function(cb, scope) {\n\
  each(this.data, cb, scope || this);\n\
};\n\
\n\
\n\
/**\n\
 * Stringify model\n\
 * @return {String} json\n\
 * @api public\n\
 */\n\
\n\
Store.prototype.toJSON = function() {\n\
  return JSON.stringify(this.data);\n\
};//@ sourceURL=bredele-store/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("discore-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return  \n\
  }\n\
}//@ sourceURL=discore-closest/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var closest = require('closest')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    var target = e.target || e.srcElement;\n\
    e.delegateTarget = closest(target, selector, true, el);\n\
    if (e.delegateTarget) fn.call(el, e);\n\
  }, capture);\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("bredele-event-plugin/index.js", Function("exports, require, module",
"/**\n\
 * Dependencies\n\
 */\n\
\n\
var ev = require('event'),\n\
    delegate = require('delegate');\n\
\n\
/**\n\
 * Map touch events.\n\
 * @type {Object}\n\
 * @api private\n\
 */\n\
\n\
var mapper = {\n\
\t'click' : 'touchend',\n\
\t'mousedown' : 'touchstart',\n\
\t'mouseup' : 'touchend',\n\
\t'mousemove' : 'touchmove'\n\
};\n\
\n\
\n\
/**\n\
 * Expose 'Event plugin'\n\
 */\n\
\n\
module.exports = Events;\n\
\n\
\n\
/**\n\
 * Event plugin constructor\n\
 * @param {Object} view event plugin scope\n\
 * @param {Boolean} isTouch optional\n\
 * @api public\n\
 */\n\
\n\
function Events(view, isTouch){\n\
  this.view = view;\n\
  this.listeners = [];\n\
  this.isTouch = isTouch || (window.ontouchstart !== undefined);\n\
}\n\
\n\
\n\
\n\
/**\n\
 * Listen events.\n\
 * @param {HTMLElement} node \n\
 * @param {String} type event's type\n\
 * @param {String} callback view's callback name\n\
 * @param {String} capture useCapture\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.on = function(node, type, callback, capture) {\n\
  var _this = this,\n\
      cap = (capture === 'true'),\n\
      cb = function(e) {\n\
        _this.view[callback].call(_this.view, e, node);\n\
      };\n\
  ev.bind(node, this.map(type), cb, cap);\n\
  this.listeners.push([node, this.map(type), cb, cap]);\n\
};\n\
\n\
\n\
/**\n\
 * Event delegation.\n\
 * @param {HTMLElement} node \n\
 * @param {String} selector\n\
 * @param {String} type event's type\n\
 * @param {String} callback view's callback name\n\
 * @param {String} capture useCapture\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.delegate = function(node, selector, type, callback, capture) {\n\
  var _this = this,\n\
      cap = (capture === 'true'),\n\
      cb = delegate.bind(node, selector, this.map(type), function(e){\n\
      _this.view[callback].call(_this.view, e, node);\n\
      }, cap);\n\
  this.listeners.push([node, this.map(type), cb, cap]);\n\
};\n\
\n\
\n\
/**\n\
 * Map events (desktop and mobile)\n\
 * @param  {String} type event's name\n\
 * @return {String} mapped event\n\
 */\n\
\n\
Events.prototype.map = function(type) {\n\
\treturn this.isTouch ? (mapper[type] || type) : type;\n\
};\n\
\n\
\n\
/**\n\
 * Remove all listeners.\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.destroy = function() {\n\
  for(var l = this.listeners.length; l--;) {\n\
    var listener = this.listeners[l];\n\
    ev.unbind(listener[0], listener[1], listener[2], listener[3]);\n\
  }\n\
  this.listeners = [];\n\
};\n\
\n\
//@ sourceURL=bredele-event-plugin/index.js"
));
require.register("bredele-each-plugin/index.js", Function("exports, require, module",
"var Binding = require('binding'),\n\
    Store = require('store'),\n\
    index = require('indexof');\n\
\n\
\n\
\n\
/**\n\
 * Expose 'event-plugin'\n\
 */\n\
\n\
module.exports = Plugin;\n\
\n\
\n\
/**\n\
 * Plugin constructor.\n\
 * @param {Object} model (should have getter/setter and inherit from emitter)\n\
 * @api public\n\
 */\n\
\n\
function Plugin(store){\n\
  this.store = store;\n\
  this.items = [];\n\
}\n\
\n\
\n\
/**\n\
 * Each util.\n\
 * Iterate through store.\n\
 * @param  {HTMLElement} node \n\
 * @api public\n\
 */\n\
\n\
Plugin.prototype.default =  \n\
Plugin.prototype.each = function(node) {\n\
  var data = this.store.data;\n\
  var first = node.children[0];\n\
  var _this = this;\n\
  this.node = node;\n\
  //NOTE: may be instead that get the string of node and pass to the renderer\n\
  //do benchmark\n\
  this.clone = first.cloneNode(true);\n\
\n\
  node.removeChild(first);\n\
\n\
\n\
  this.store.on('change', function(key, value){\n\
    var item = _this.items[key];\n\
    if(item) {\n\
      //NOTE: should we unbind in store when we reset?\n\
      item.reset(value); //do our own emitter to have scope\n\
    } else {\n\
      //create item renderer\n\
      _this.addItem(key, value);\n\
    }\n\
  });\n\
\n\
  this.store.on('deleted', function(key, idx){\n\
    _this.delItem(idx);\n\
  });\n\
\n\
  //NOTE: might be in store (store.loop)\n\
  for(var i = 0, l = data.length; i < l; i++){\n\
    this.addItem(i, data[i]);\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Create item renderer from data.\n\
 * @param  {Object} data \n\
 * @api private\n\
 */\n\
\n\
Plugin.prototype.addItem = function(key, data) {\n\
  var item = new ItemRenderer(this.clone, data);\n\
  this.items[key] = item;\n\
  this.node.appendChild(item.dom);\n\
};\n\
\n\
\n\
/**\n\
 * Delete item.\n\
 * @param  {Number} idx index\n\
 * @api private\n\
 */\n\
\n\
Plugin.prototype.delItem = function(idx) {\n\
    var item = this.items[idx];\n\
    item.unbind(this.node);\n\
    //delete this.items[idx];\n\
    this.items.splice(idx, 1);\n\
    item = null; //for garbage collection\n\
};\n\
\n\
\n\
/**\n\
 * Return index of node in list.\n\
 * @param  {HTMLelement} node \n\
 * @return {Number}  \n\
 */\n\
\n\
Plugin.prototype.indexOf = function(node) {\n\
  //works if we use plugin only once (this.node could be in constructor)\n\
  var children = [].slice.call(this.node.children);\n\
  return index(children, node);\n\
};\n\
\n\
/**\n\
 * Item renderer.\n\
 * Represents the item that going to be repeated.\n\
 * @param {HTMLElement} node \n\
 * @param {Store} data \n\
 * @api private\n\
 */\n\
\n\
function ItemRenderer(node, data){\n\
  //NOTE: is it more perfomant to work with string?\n\
  this.dom = node.cloneNode(true);\n\
  this.store = new Store(data);\n\
  this.binding = new Binding(this.store); //we have to have a boolean parameter to apply interpolation &|| plugins\n\
  this.binding.apply(this.dom);\n\
}\n\
\n\
\n\
/**\n\
 * Unbind an item renderer from its ancestor.\n\
 * @param  {HTMLElement} node \n\
 * @api private\n\
 */\n\
\n\
ItemRenderer.prototype.unbind = function(node) {\n\
  //NOTE: is there something else to do to clean the memory?\n\
  this.store.off();\n\
  node.removeChild(this.dom);\n\
};\n\
\n\
\n\
/**\n\
 * Reset iten renderer.\n\
 * @param  {Object} data \n\
 * @api private\n\
 */\n\
\n\
ItemRenderer.prototype.reset = function(data) {\n\
  this.store.reset(data);\n\
};\n\
\n\
//@ sourceURL=bredele-each-plugin/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  if (!el) throw new Error('A DOM element reference is required');\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.toggle(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (this.has(name)) {\n\
    this.remove(name);\n\
  } else {\n\
    this.add(name);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("bredele-hidden-plugin/index.js", Function("exports, require, module",
"var classes = require('classes');\n\
\n\
\n\
/**\n\
 * Conditionally add 'hidden' class.\n\
 * @param {HTMLElement} node \n\
 * @param {String} attr model's attribute\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(node, attr) {\n\
\tthis.on('change ' + attr, function(val) {\n\
\t\tif(val) {\n\
\t\t\tclasses(node).remove('hidden');\n\
\t\t} else {\n\
\t\t\tclasses(node).add('hidden');\n\
\t\t}\n\
\t});\n\
};\n\
//@ sourceURL=bredele-hidden-plugin/index.js"
));
require.register("todo/index.js", Function("exports, require, module",
"\n\
//dependencies\n\
\n\
var View = require('view');\n\
var Store = require('store');\n\
var Events = require('event-plugin');\n\
var Each = require('each-plugin');\n\
\n\
//init\n\
\n\
var todo = new View();\n\
var list = new Store([]);\n\
var todos = new Each(list);\n\
\n\
var stats = new Store({\n\
\tpending: 0\n\
});\n\
\n\
//we should do that in interpolation\n\
stats.compute('left', function(){\n\
\treturn this.pending.toString();\n\
});\n\
\n\
stats.compute('completed', function(){\n\
\treturn (list.data.length - this.pending);\n\
});\n\
\n\
//controller \n\
\n\
function completed(){\n\
  var l = list.data.length,\n\
     count = 0;\n\
\twhile(l--) {\n\
\t\t//should may be be a boolean\n\
\t\tif(list.get(l).status === 'pending') count++;\n\
\t}\n\
\tstats.set('pending', count);\n\
}\n\
\n\
var controller = {\n\
\t//we should have an input plugin\n\
\tsubmit: function(ev, node){\n\
\t\tif(ev.keyCode === 13 && node.value) {\n\
\t\t\t//store should have push\n\
\t\t\tlist.set(list.data.length,{\n\
\t\t\t\tlabel: node.value,\n\
\t\t\t\tstatus: 'pending' //we set a class which is not needed\n\
\t\t\t});\n\
\t\t\tnode.value = \"\";\n\
\t\t\tcompleted();\n\
\t\t}\n\
\t},\n\
\n\
\t//it seems really complicated\n\
\tstatus: function(ev, node){\n\
\t\tvar target = ev.target;\n\
\n\
\t\tvar index = todos.indexOf(target.parentElement);\n\
\t\tvar store = todos.items[index].store;\n\
\n\
\t\t//better if boolean\n\
\t\tstore.set('status', target.checked ? 'completed' : 'pending');\n\
\t\tcompleted();\n\
\t},\n\
\n\
\ttoggleAll: function(){\n\
\n\
\t\tlist.loop(function(l){\n\
\t\t\ttodos.items[l].store.set('status', 'completed');\n\
\t\t});\n\
\t\t//do store loop\n\
\t\t// var l = list.data.length;\n\
\t\t// stats.set('completed', l);\n\
\t\t// while(l--) {\n\
\t\t// \ttodos.items[l].store.set('status', 'completed');\n\
\t\t// }\n\
\t},\n\
\n\
\tdelAll : function(){\n\
\t\tlist.loop(function(l){\n\
\t\t\t//for array we could do store.get(index, 'key');...use to function\n\
\t\t\tif(this.get(l).status === 'completed') this.del(l);\n\
\t\t});\n\
\t\tcompleted();\n\
\t},\n\
\n\
\t//the html attribute is huge :s\n\
\tdel: function(ev, node){\n\
\t\tlist.del(todos.indexOf(ev.target.parentElement));\n\
\t\tcompleted();\n\
\t}\n\
};\n\
\n\
//bindings\n\
\n\
todo.html(document.getElementById('todoapp'), stats);\n\
todo.attr('todos', todos);\n\
todo.attr('events', new Events(controller)); // could be greate to do events(controller) and events.off, etc\n\
todo.attr('visible', require('hidden-plugin'));\n\
todo.alive();//@ sourceURL=todo/index.js"
));










require.alias("bredele-view/index.js", "todo/deps/view/index.js");
require.alias("bredele-view/index.js", "todo/deps/view/index.js");
require.alias("bredele-view/index.js", "view/index.js");
require.alias("bredele-binding/index.js", "bredele-view/deps/binding/index.js");
require.alias("bredele-binding/index.js", "bredele-view/deps/binding/index.js");
require.alias("bredele-subs/index.js", "bredele-binding/deps/subs/index.js");
require.alias("bredele-subs/index.js", "bredele-binding/deps/subs/index.js");
require.alias("bredele-supplant/index.js", "bredele-subs/deps/supplant/index.js");
require.alias("bredele-supplant/index.js", "bredele-subs/deps/supplant/index.js");
require.alias("component-indexof/index.js", "bredele-supplant/deps/indexof/index.js");

require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-trim/index.js");
require.alias("bredele-supplant/index.js", "bredele-supplant/index.js");
require.alias("bredele-subs/index.js", "bredele-subs/index.js");
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
require.alias("bredele-each-plugin/index.js", "todo/deps/each-plugin/index.js");
require.alias("bredele-each-plugin/index.js", "todo/deps/each-plugin/index.js");
require.alias("bredele-each-plugin/index.js", "each-plugin/index.js");
require.alias("bredele-binding/index.js", "bredele-each-plugin/deps/binding/index.js");
require.alias("bredele-binding/index.js", "bredele-each-plugin/deps/binding/index.js");
require.alias("bredele-subs/index.js", "bredele-binding/deps/subs/index.js");
require.alias("bredele-subs/index.js", "bredele-binding/deps/subs/index.js");
require.alias("bredele-supplant/index.js", "bredele-subs/deps/supplant/index.js");
require.alias("bredele-supplant/index.js", "bredele-subs/deps/supplant/index.js");
require.alias("component-indexof/index.js", "bredele-supplant/deps/indexof/index.js");

require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-supplant/deps/trim/index.js");
require.alias("bredele-trim/index.js", "bredele-trim/index.js");
require.alias("bredele-supplant/index.js", "bredele-supplant/index.js");
require.alias("bredele-subs/index.js", "bredele-subs/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-binding/deps/plugin-parser/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-binding/deps/plugin-parser/index.js");
require.alias("bredele-plugin-parser/index.js", "bredele-plugin-parser/index.js");
require.alias("component-indexof/index.js", "bredele-binding/deps/indexof/index.js");

require.alias("bredele-binding/index.js", "bredele-binding/index.js");
require.alias("bredele-store/index.js", "bredele-each-plugin/deps/store/index.js");
require.alias("bredele-store/index.js", "bredele-each-plugin/deps/store/index.js");
require.alias("component-emitter/index.js", "bredele-store/deps/emitter/index.js");

require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-store/deps/each/index.js");
require.alias("bredele-each/index.js", "bredele-each/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-store/deps/clone/index.js");
require.alias("bredele-clone/index.js", "bredele-clone/index.js");
require.alias("bredele-store/index.js", "bredele-store/index.js");
require.alias("component-indexof/index.js", "bredele-each-plugin/deps/indexof/index.js");

require.alias("bredele-each-plugin/index.js", "bredele-each-plugin/index.js");
require.alias("bredele-hidden-plugin/index.js", "todo/deps/hidden-plugin/index.js");
require.alias("bredele-hidden-plugin/index.js", "todo/deps/hidden-plugin/index.js");
require.alias("bredele-hidden-plugin/index.js", "hidden-plugin/index.js");
require.alias("component-classes/index.js", "bredele-hidden-plugin/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("bredele-hidden-plugin/index.js", "bredele-hidden-plugin/index.js");
require.alias("todo/index.js", "todo/index.js");