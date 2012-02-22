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
    State = require('../state');

/**
 * Inspect the output of the previous task.
 * This can be used to debug the build chain or provide extra output in the build process.
 *
 * @method log
 * @param params {Object}
 * @param params.header {String} Message to be logged prior to the input contents.
 * @param params.footer {String} Message to be logged after the input contents.
 * @param params.depth {Integer} How much to recurse when Inspecting an object
 * @param params.show_hidden {Boolean} [show_hidden=false] Show an objects non enumerable properties.
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 * @protected
 */
function inspectTask(params, status, logger) {

    params = params || {};

    params.depth = params && params.depth || 2;
    params.show_hidden = params && params.show_hidden || false;

    if (params && params.header) {
        console.log(params.header);
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

    if (params && params.footer) {
        console.log(params.footer);
    }

    status.emit('complete', 'inspect', ''); // TODO: Maybe this should be the log output? the event arg
}

exports.tasks = {
    'inspect' : {
        callback: inspectTask
    }
};