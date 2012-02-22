/**
 * This file contains a demonstration of how to build a custom task for use in your own build process.
 *
 * The custom task simply prepends a string to the input. Even though there's barely any functionality here,
 * it should give you a good idea about how to lay out your custom tasks.
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Prepend string to each file.
 *
 *  - STRINGS
 *  Prepend string to each string.
 *
 *  - STRING
 *  Prepend string to input string.
 *
 *  - UNDEFINED
 *  Output a message about being undefined.
 *
 * OUTPUT:
 *
 *  - FILES|STRINGS|STRING
 *  Same data as the input, with the string prepended.
 * ---
 */

// Required to access pseudo-constants State.TYPES.*
var State = require('buildy').State;

function prependTask(params, status) {
    switch (this._state.get().type) {
        case State.TYPES.FILES:
            // do something with files

            break;

        case State.TYPES.STRINGS:
            // do something with strings

            break;

        case State.TYPES.STRING:
            // do something with a single string

            break;

        default:
            // maybe emit a failure, or just ignore if this is a non critical task.
    }
}

exports.tasks = {
    'prepend' : prependTask // This task is now available as .task('prepend', params)
};