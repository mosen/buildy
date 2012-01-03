/**
 * Replace contents in the file using a regular expression.
 *
 */

var State = require('buildy/lib/state'),
    fs = require('fs');

/**
 * Replace the content of the input by applying string.replace
 *
 * This operates on single or multiple strings.
 *
 * @todo replace file content using the file input
 * @method replace
 * @param spec {Object} Replace task config containing .regex .replace .flags
 * @param promise {EventEmitter}
 * @protected
 */
function replaceTask(spec, promise) {
    var replace = spec.replace || '',
        flags = spec.flags || 'mg',
        oregex = new RegExp(spec.regex, flags),
        outputString = "";

    switch (this._state.get().type) {
        case State.TYPES.STRING:
            outputString = this._state.get().value.replace(oregex, replace);
            this._state.set(State.TYPES.STRING, outputString);
            promise.emit('complete', 'replace', 'replaced regex in input string');
            break;

        case State.TYPES.STRINGS:
            var outputStrings = [];

            this._state.get().value.forEach(function(s) {
                outputStrings.push(s.replace(oregex, replace));
            });
            this._state.set(State.TYPES.STRINGS, outputStrings);
            promise.emit('complete', 'replace', 'replaced regex in ' + this._state.get().value.length + ' strings');
            break;

        default:
            promise.emit('failed', 'replace', 'unrecognised input type: ' + this._state.get().type);
            break;
    }
}

exports.tasks = {
    'replace' : {
        callback: replaceTask
    }
};