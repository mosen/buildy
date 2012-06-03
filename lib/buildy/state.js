
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

    // TODO: The handling of the meta parameter is a bit inconsistent depending on whether you supply an array or not.

    if (value) {
        if (value instanceof Array) {
            value.forEach(function _forEach(v) {
                var uid = uuid.v1();

                this._values[uid] = v;
                if (type === State.TYPES.FILE) {
                    this._meta[uid] = { filename: v };
                }
            }, this);
        } else {
            var uid = uuid.v1();

            this._values[uid] = value;
            this._meta[uid] = meta;
        }
    }

    if (State.TYPES[type]) {
        this._type = type;
    } else {
        this._type = State.TYPES.STRING;
    }
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
     * This acts as a hash of unique ID's to values.
     *
     * @property _values
     * @type {Any}
     * @private
     */
    _values : {},

    /**
     * The buildy type of the current content.
     *
     * @property _type
     * @type {State.TYPES}
     * @private
     */
    _type : State.TYPES.UNDEFINED,

    /**
     * The metadata about each content item.
     *
     * It currently only stores the following properties for each item in the state:
     * - filename (to preserve the original filename when converting from a file to a string and back again)
     * - contentType (if the item was converted from a file, guess the mime content type of the file that was read in
     * this can help the build task guess how to handle the content in more detail).
     *
     * @property _meta
     * @type {Object}
     */
    _meta : {},

    /**
     * Retrieve value(s) from the state
     *
     * @param {String} key Unique key of the item to retrieve
     * @return Undefined if the key was not found, otherwise the value associated with the key.
     */
    value : function (key) {
        if (this._values.hasOwnProperty(key)) {
            return this._values[key];
        } else {
            return undefined;
        }
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
                k, this._values[k]
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
        if (this._meta.hasOwnProperty(key)) {
            if (!prop) {
                return this._meta[key];
            } else {
                return this._meta[key][prop];
            }
        } else {
            return undefined;
        }
    }
};