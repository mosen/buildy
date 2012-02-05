/**
 * Replace contents in the file or string(s) using a regular expression.
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Replace the content of the given files, applying the regex to each file in turn.
 *
 *  - STRINGS
 *  Replace the content of each string.
 *
 *  - STRING
 *  Replace the content of the string using the regex.
 *
 *  - UNDEFINED
 *  Emits an error
 *
 * OUTPUT:
 *
 *  - FILES|STRINGS|STRING
 *  Same type as the input, with the regex and replacement applied.
 * ---
 */

var State = require('buildy/lib/state'),
    fs = require('fs');

/**
 * Replace the content of the input by applying the string.replace method.
 *
 * @method replace
 * @param spec {Object} task options/specification
 * @param spec.regex {String} Regular expression which will be used to find matches to replace.
 * @param spec.replace {String} [replace=''] The string to replace matches with.
 * @param spec.flags {String} [flags='mg'] Regular expression flags, see string.replace()
 * @param spec.encoding {String} [encoding='utf8'] Encoding to use with files and strings.
 * @param status {EventEmitter}
 * @protected
 */
function replaceTask(spec, status) {
    var replace  = spec.replace || '',
        flags    = spec.flags || 'mg',
        regex    = new RegExp(spec.regex, flags),
        encoding = spec.encoding || 'utf8',
        output   = "";

    function replaceContents(data, callback) {
        var output_string = data.replace(regex, replace);
        callback(null, '');
    }

    switch (this._state.get().type) {
        case State.TYPES.FILES:
            var fileCount = fileCountTotal = this._state.get().value.length;

            function fileDone(err, filename) {
                if (err) {
                    // mark file as failed.
                    status.emit('failed', 'replace', 'could not replace regex in ' + filename + ' because: ' + err);
                }

                if (!--fileCount) {
                    status.emit('complete', 'replace', 'replaced regex in ' + fileCountTotal + ' files');
                }
            }

            this._state.get().value.forEach(function(filename) {
                fs.readFile(filename, encoding, function(err, data) {
                    if (err) {
                        fileDone(err, filename);
                    } else {
                        replaceContents(data, fileDone);
                    }
                });
            });
            break;


        case State.TYPES.STRING:
            output = this._state.get().value.replace(regex, replace);
            this._state.set(State.TYPES.STRING, output);
            status.emit('complete', 'replace', 'replaced regex in input string');
            break;

        case State.TYPES.STRINGS:
            var outputs = [];

            this._state.get().value.forEach(function(s) {
                outputs.push(s.replace(regex, replace));
            });
            this._state.set(State.TYPES.STRINGS, outputs);
            status.emit('complete', 'replace', 'replaced regex in ' + this._state.get().value.length + ' strings');
            break;

        default:
            status.emit('failed', 'replace', 'unrecognised input type: ' + this._state.get().type);
            break;
    }
}

exports.tasks = {
    'replace' : {
        callback: replaceTask
    }
};