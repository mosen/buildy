
var uuid = require('node-uuid');

/**
 * Buildy state object
 *
 * The state holds a value or collection of values. It has its own type, which gives us a hint about
 * how to interpret the values it is holding. They might be strings of code, or the strings might be named files.
 *
 * Some tasks can cause the value contained to be changed in some way: A file might be read into a string, and be stored
 * as a string throughout the rest of the process. The state should retain the original filename(s) so that they can be
 * used later on in the build process.
 *
 * The state should also contain other kinds of information about the contents (aka metadata). For instance: an image
 * file might be read, and the dimensions available to be queried, or made part of a filename as one example.
 *
 * @class State
 * @param {String|Array} value(s) of the item(s) in the state collection
 * @param {State.TYPES} type of values (string or filenames)
 * @param {Object} meta Metadata information about value(s) including filename(s)/and or mime content types
 * @namespace buildy
 * @constructor
 */
var State = module.exports = function State(value, type, meta) {
    this.reset();
    this.set(null, value, type, meta);
};

/**
 * Pseudo Constants of input/output types that may exist.
 *
 * @property State.TYPES
 * @type Object
 * @final
 */
State.TYPES = {
    FILE      : 'FILE', // The state contains one or more filenames as strings
    STRING    : 'STRING', // The state contains just a string
    UNDEFINED : 'UNDEFINED' // No current state
};

State.prototype = {

    /**
     * The value(s) held by the state object.
     * The key is either the originating filename or a uniquely generated id (for an in-memory string).
     *
     * @property _values
     * @type {Any}
     * @private
     */
    _values : undefined,

    /**
     * The buildy type of the current content.
     * This applies to all entries in _values
     *
     * @property _type
     * @type {State.TYPES}
     * @private
     */
    _type : undefined,

    /**
     * The metadata about each content item.
     *
     * It currently only stores the following properties for each item in the state:
     * - filename (to preserve the original filename when converting from a file to a string and back again)
     * - contentType (if the item was converted from a file, guess the mime content type of the file that was read in
     * this can help the build task guess how to handle the content in more detail).
     * - encoding: If the content is a string, how the string encoding should be handled. by default this should be
     * utf-8.
     *
     * @property _meta
     * @type {Object}
     */
    _meta : undefined,

    /**
     * Retrieve a value that we are holding.
     *
     * You can specify a key, the absence of the key parameter
     * will return the first value found only.
     *
     * @param {String} key Unique key of the item to retrieve
     */
    value : function (key) {
        if (!key) {
            var value_keys = Object.keys(this._values);

            if (value_keys.length === 0) {
                return undefined;
            } else {
                return this._values[value_keys[0]];
            }
        } else {
            if (!this._values.hasOwnProperty(key)) {
                throw new Error('State does not contain a value with that key');
            } else {
                return this._values[key];
            }
        }
    },

    /**
     * Retrieve all of the values that we are holding
     *
     *
     */
    values : function() {
        return Object.keys(this._values).map(function(k) {
            return this._values[k];
        }, this);
    },

    /**
     * Reset the state back to empty.
     */
    reset : function() {
        this._values = {};
        this._meta = {};
        this._type = State.TYPES.UNDEFINED;
    },

    /**
     * Set the value(s) held by this object.
     *
     * You can supply an object as the fourth parameter with properties related
     * to the metadata i.e the information about the contents that are held in this object.
     *
     * If the key parameter is not specified it is assumed that you want to reset with a new set of values.
     *
     * @param key [optional] If there are multiple values, the uuid of the value to set.
     * @param value The value to hold, can be any of State.TYPES.* as an array or single value.
     * @param type How we should interpret the contents of the value(s), any of State.TYPES.*
     * @param meta [optional] An object containing information about the value(s)
     */
    set : function(key, value, type, meta) {

        if (!key) { this.reset(); }

        this._type = type || this._type; // By default, the type remains the same

        if (value instanceof Array) {
            value.forEach(function(v) {
                this._set(key, v, this._type, meta);
            }, this);
        } else {
            this._set(key, value, this._type, meta);
        }
    },

    /**
     * Private method to set the value, called by set() public method
     *
     * @param key
     * @param value
     * @param type
     * @param meta
     * @private
     */
    _set : function(key, value, type, meta) {

        meta = meta || { encoding: 'utf8' };

        if(!key) {
            key = uuid.v1();
        }

        this._values[key] = value;

        if (this._type === State.TYPES.FILE) {
            meta.filename = value;
        }

        this._meta[key] = meta;
    },

    /**
     * The number of items in the state
     *
     * @method length
     * @return Integer Number of items being held.
     */
    length : function () {
        return Object.keys(this._values).length;
    },

    /**
     * Iterate through each item stored by the state object.
     *
     * The iterator function receives 2 arguments:
     * - The unique key of the item in this collection
     * - The value of that item
     *
     * @method forEach
     * @param {Function} fnIterator The function that will be executed for each item
     * @param {Object} context The context in which the fnIterator function will be executed (default: this state object)
     */
    forEach : function (fnIterator, context) {
        context = context || this;

        Object.keys(this._values).forEach(function _forEachKey(k) {
            fnIterator.apply(context, [
                k, this._values[k], this._meta[k]
            ]);
        }, this);
    },

    eachAs : function(convertTo, fnIterator, context) {
        context = context || this;
        var fs = require('fs');

        if (this._type === State.TYPES.FILE) {
            var fileContents = Object.keys(this._values).map(function _forEachKey(k) {
                var content = fs.readSync(k);
                return { filename: k, content: content };
            }, this);

            fileContents.forEach(function _forEachFile(f) {
                fnIterator.apply(context, [
                    f.content, f.filename
                ]);
            });
        }
    },

    /**
     * Grab the buildy type of the items held in this collection.
     * The type can be one of State.TYPES.*
     *
     * @return {String} One of State.TYPES.*
     */
    type : function () {
        return this._type;
    },

    /**
     * Grab the metadata associated with the specified item.
     *
     *
     * @method meta
     * @param {String} key The unique hash key of the item
     * @param [optional] {String} prop The metadata property to retrieve.
     * @return The metadata value(s) requested.
     */
    meta : function (key, prop) {
        if (key && this._meta.hasOwnProperty(key)) {
            if (!prop) {
                return this._meta[key];
            } else {
                return this._meta[key][prop];
            }
        } else if (!key) {
            return this._meta;
        } else {
            return undefined;
        }
    }
};