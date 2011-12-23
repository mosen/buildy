var Buildy = require('buildy/lib/buildy').Buildy,
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

    switch (this._type) {
        case Buildy.TYPES.STRING:
            outputString = this._state.replace(oregex, replace);
            this._state = outputString;
            promise.emit('complete', 'replace', 'replaced regex in input string');
            break;

        case Buildy.TYPES.STRINGS:
            var outputStrings = [];

            this._state.forEach(function(s) {
                outputStrings.push(s.replace(oregex, replace));
            });
            this._state = outputStrings;
            promise.emit('complete', 'replace', 'replaced regex in ' + this._state.length + ' strings');
            break;

        default:
            promise.emit('failed', 'replace', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'replace' : {
        callback: replaceTask
    }
};