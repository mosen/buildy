/**
 * Buildy state object
 *
 * This is the object passed from task to task. It encapsulates the data structure and holds some information about
 * what is contained within that structure
 */
var State = module.exports = function State() {
    this._type = 'UNDEFINED';
}

/**
 * Pseudo Constants of input/output types that may exist.
 * For a single file, just give an array with one entry.
 *
 * @property State.TYPES
 * @type Object
 * @final
 */
State.TYPES = {
    FILES   : 'FILES', // Collection of file paths, this is always an array, even with one filename
    STRINGS : 'STRINGS', // Collection of strings
    STRING  : 'STRING', // Single string input
    UNDEFINED : 'UNDEFINED' // No current state
};

State.prototype = {

    /**
     * The current state information. Determined by the output of
     * the previous task OR the constructor.
     *
     * @property _state
     * @type {Object}
     */
    _state : null,

    /**
     * The type of state that is currently held (one of State.TYPES)
     *
     * @property _type
     * @type {String}
     */
    _type : null,


    /**
     * Initialise this state using the values of another state object.
     *
     * @param state {Object} State object
     */
    fromState : function(state) {
        this._state = state._state || null;
        this._type = state._type || null;
    },

    /**
     * Set the state
     *
     * @param type {String} One of State.TYPES.*
     * @param value {Object} Any value which correlates with the type indicated.
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
     * @return {Object} with properties 'value' and 'type'
     */
    get : function() {
        return { type : this._type, value : this._state };
    }
}