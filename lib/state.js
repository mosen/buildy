/**
 * Buildy state object
 *
 * This is the object passed from task to task. It encapsulates the data structure and holds some information about
 * what is contained within that structure
 */
var State = module.exports = function State() {

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
    STRING  : 'STRING' // Single string input
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
    }
}