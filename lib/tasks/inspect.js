/**
 * Inspect the output from the previous task.
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Output filenames, one per line.
 *
 *  - STRINGS
 *  Output strings, separated by line feeds.
 *
 *  - STRING
 *  Output string.
 *
 *  - UNDEFINED
 *  Output a message about being undefined.
 *
 * OUTPUT:
 *
 *  - FILES|STRINGS|STRING
 *  Same data as the input, untouched.
 * ---
 */

var util = require('util'),
    State = require('buildy/lib/state');

/**
 * Inspect the output of the previous task.
 * This can be used to debug the build chain or provide extra output in the build process.
 *
 * @method log
 * @param spec {Object}
 * @param spec.header {String} Message to be logged prior to the input contents.
 * @param spec.footer {String} Message to be logged after the input contents.
 * @param spec.depth {Integer} How much to recurse when inspecting an object
 * @param spec.show_hidden {Boolean} [show_hidden=false] Show an objects non enumerable properties.
 * @param status {EventEmitter}
 * @protected
 */
function inspectTask(spec, status) {

    spec = spec || {};

    spec.depth = spec && spec.depth || 2;
    spec.show_hidden = spec && spec.show_hidden || false;

    if (spec && spec.header) {
        console.log(spec.header);
    }

    switch (this._state.get().type) {

        case State.TYPES.FILES:
            util.log(this._state.get().type);
            this._state.get().value.forEach(function(filename) {
                console.log(filename);
            });
            break;

        case State.TYPES.STRINGS:
            util.log(this._state.get().type);
            this._state.get().value.forEach(function(str) {
                console.log(str);
            });
            break;

        case State.TYPES.STRING:
            util.log(this._state.get().type);
            console.log(this._state.get().value);

            break;

        case State.TYPES.UNDEFINED:
            util.log(this._state.get().type);
            console.log('No output to display for type UNDEFINED');

            break;

        default:

    }

    if (spec && spec.footer) {
        console.log(spec.footer);
    }

    status.emit('complete', 'inspect', ''); // TODO: Maybe this should be the log output? the event arg
}

exports.tasks = {
    'inspect' : {
        callback: inspectTask
    }
};