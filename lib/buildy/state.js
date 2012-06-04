
var uuid = require('node-uuid');

/**
 * Buildy state object
 *
 * The state acts like a collection of values that are passed from one task to
 * another in the chain. It provides a place to store those values (the same as a hash would),
 * but also a way of getting more detailed information about each item within.
 *
 * @class State
 * @param {String|Array} value(s) of the item(s) in the state collection
 * @param {State.TYPES} type of values (string or filenames)
 * @param {Object} meta Metadata information about value(s) including filename(s)/and or mime content types
 * @namespace buildy
 * @constructor
 */
var State = module.exports = function State(value, type, meta) {
    this.init();
    this.set(value, type, meta);
};

/**
 * Pseudo Constants of input/output types that may exist.
 *
 * @property State.TYPES
 * @type Object
 * @final
 */
State.TYPES = {
    FILE : 'FILE', // The state contains one or more filenames as strings
    STRING : 'STRING', // The state contains just a string
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
     * Retrieve value(s) from the state.
     *
     * If the key is unspecified, all values are returned as an array.
     * If the key is not found, returns undefined.
     *
     * @param {String} key Unique key of the item to retrieve
     * @return Undefined|Array
     */
    value : function (key) {
        if (key && this._values.hasOwnProperty(key)) {
            return this._values[key];
        } else if (!key) {
            var values = [];

            Object.keys(this._values).forEach(function _eachKey(k) {
                values.push(this._values[k]);
            }, this);

            return values;
        } else {
            return undefined;
        }
    },

    /**
     * Reset the state back to empty.
     */
    init : function() {
        this._values = {};
        this._meta = {};
        this._type = State.TYPES.UNDEFINED;
    },

    /**
     * Set the state value(s).
     * Main api for setting the state, delegates to setValues()/setValue().
     *
     * @param value
     * @param type
     * @param key
     * @param meta
     */
    set : function(value, type, key, meta) {
        type = type || State.TYPES.STRING;

        this._type = type;

        if (value instanceof Array) {
            this.setValues(value, type, meta);
        } else {
            this.setValue(value, type, key, meta);
        }
    },

    /**
     * Set the state with an array of values
     *
     * @param values
     * @param type
     * @param meta
     */
    setValues : function(values, type, meta) {
        values.forEach(function _eachValue(v) {
            this.setValue(v, type, null, meta);
        }, this);
    },

    /**
     * Set a single state value, key optional.
     *
     * @param value
     * @param type
     * @param key
     * @param meta
     */
    setValue : function(value, type, key, meta) {
        var v_meta = {};
        v_meta.encoding = (meta && meta.encoding) || 'utf8';

        if (!key) {
            if (type === 'FILE') {
                key = value;
                v_meta.filename = value;
            } else {
                key = uuid.v1();
            }
        }

        this._values[key] = value;
        this._meta[key] = v_meta;
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