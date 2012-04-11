/**
 * Buildy state object
 *
 * The state object represents the contents of what the task will act on.
 * It might be a filename, string, a list of strings.
 *
 * @class State
 * @namespace buildy
 * @constructor
 */
var State = module.exports = function State() {
    this._type = 'UNDEFINED';
};

/**
 * Pseudo Constants of input/output types that may exist.
 * For a single file, just give an array with one entry.
 *
 * @property State.TYPES
 * @type Object
 * @final
 */
State.TYPES = {
    FILES     : 'FILES', // Collection of file paths, this is always an array, even with one filename
    STRINGS   : 'STRINGS', // Collection of strings
    STRING    : 'STRING', // Single string input
    UNDEFINED : 'UNDEFINED' // No current state
};

State.prototype = {

    /**
     * The current state information. Determined by the output of
     * the previous task OR the constructor.
     *
     * @property _state
     * @type {Object}
     * @private
     */
    _state : null,

    /**
     * The type of state that is currently held (one of State.TYPES)
     *
     * @property _type
     * @type {String}
     * @private
     */
    _type : null,

    /**
     * Initialise this state using the values of another state object.
     *
     * @method fromState
     * @public
     * @param {Object} state State object to copy
     */
    fromState : function(state) {
        this._state = state._state || null;
        this._type = state._type || null;
    },

    /**
     * Set the state
     *
     * @method set
     * @public
     * @param {String} type One of State.TYPES.*
     * @param {Object} value Any value which correlates with the type indicated.
     */
    set : function(type, value) {
        if (State.TYPES.hasOwnProperty(type)) {
            this._state = value;
            this._type = type;
        } else {
            throw new TypeError('Cant set the state with an unrecognised type');
        }
    },

    /**
     * Get the state
     *
     * @method get
     * @public
     * @return {Object} with properties 'value' and 'type'
     */
    get : function() {
        return { type : this._type, value : this._state };
    }
};