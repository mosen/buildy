var fs = require('fs');

/**
 * Buildy state object
 *
 * The state is a wrapper around a collection. The collection will usually be file names, or contents of files but
 * may in future deal with buffers and streams. The state is more than a hash because it hides implementation details
 * about reading and writing the underlying file system or network streams. This way, each task only has to implement
 * its own responsibilities i.e doing the work, and the state will take care of how that data arrives at the task.
 *
 * You deal with the state like a hash: Each item has a name (usually a filename, but can be anything unique). You can
 * then iterate over the items and read their contents asynchronously.
 *
 * When setting values, an object with one property is expected. The property name hints at how to deal with reading or
 * writing to that object/file/stream. For example:
 *
 * - Using a string which has been declared literally or already read by some other process:
 * new State([{ name: 'foo.js', string: 'var a = 1;' }]);
 * state.set('foo.js', { string: 'var a = 1;' });
 *
 * - Using a file:
 * new State([{ name: 'bar.js', file: './bar.js' }]);
 * state.set('bar.js', { file: './bar.js' });
 *
 * @class State
 * @param {Array} The initial contents of the state object.
 * @namespace buildy
 * @constructor
 */
var State = module.exports = function State(values) {
    // TODO: some basic validation

    /**
     * The _values property is an array of objects in the following format:
     *
     * { name: 'filename.x or unique ID',
     *   string: 'string value' OR file: 'filename.x' }
     *
     * @type Array
     * @private
     */
    this._values = values;
};

State.prototype = {

    /**
     * Get the value of an item. If the named item is not available, this will return null
     *
     * @param name
     */
    get : function(name) {
        var item = null;

        for (var x=0; x<this._values.length; x++) {
            if (this._values[x].name === name) {
                item = this._values[x];
                break;
            }
        }

        return item;
    },

    /**
     * Set the value of an item
     *
     * @param name {String} Name of the item in the collection
     * @param value {}
     */
    set : function(name, value) {

        var valid_keys = Object.keys(value).filter(function(key) {
            return (['string', 'file'].indexOf(key) !== -1);
        });

        if (valid_keys.length === 0) { throw new TypeError('No valid values specified in set() with name:' + name); }

        var item = null;

        for (var x=0; x<this._values.length; x++) {
            if (this._values[x].name === name) {
                item = this._values[x];
                break;
            }
        }

        if (item === null) { throw new TypeError('Item was not found with name:' + name); }

        for (var i=0; i<valid_keys.length; i++) {
            item[valid_keys[i]] = value[valid_keys[i]];
        }
    },

    /**
     * The number of items in the state
     *
     * @method length
     * @return Integer Number of items being held.
     */
    length : function () {
        return this._values.length;
    },

    /**
     * Get all of the names of the items stored.
     *
     * @method keys
     * @return Array of strings, the .name property of each value held
     */
    keys : function() {
        var keys = [];

        for (var i=0; i<this._values.length; i++) {
            keys.push(this._values[i].name);
        }

        return keys;
    },

    /**
     * Iterate through all of the items.
     *
     * @param fn {Function} Callback function, called for each item. Receives 2 arguments name, and the value object.
     * @param context optional {Object} Calling context for the function, defaults to the state object.
     */
    forEach : function(fn, context) {
        context = context || this;

        this._values.forEach(function(value) {
            fn.call(context, value.name, value);
        }, this);
    },

    /**
     * Read the contents of an item asynchronously
     *
     * My intention is to have various reader classes that deal with
     * the kind of value you set in the state. That way the IO is delegated to something
     * specialised in reading and writing that kind of object.
     *
     * @param item
     * @param fn
     * @param context
     */
    read : function(item, fn, context) {
        // This is a stand-in for properly delegating to a different object for I/O
        if (item.file) {

            console.log('Implicit read of ' + item.file);

            fs.readFile(item.file, 'utf8', function(err, data) {
                fn.call(context, err, data);
            });
        }
    }
};