var State     = require('../state.js'),
    fs        = require('fs');

/**
 * Concatenate one or more files to a destination file or string.
 *
 * @param destfile {null|String} A null value will return the output instead of writing it to a filename.
 * @param sourcefiles {Array} array of files to read and concatenate.
 * @param encoding {String} source file encoding (default "utf8")
 * @return {String} Concatenated output
 */
function concatFilesSync(destfile, sourcefiles, encoding) {
    var content  = '',
        encoding = encoding || 'utf8';

    try {
        sourcefiles.forEach(function(f) {
            content += fs.readFileSync(f, encoding) || '';
        });
    } catch(e) {
        throw new Error('Could not read the files to be concatenated : ' + sourcefiles.toString() + ' ' + e);
    }

    try {
        if (destfile === null) {
            return content;
        } else {
            fs.writeFileSync(dest, content, encoding);
        }
    } catch(e) {
        throw new Error('Could not write the file to be concatenated :' + destfile);
    }
};

/**
 * Concatenate the input
 *
 * This task can be performed on files or strings.
 * Asynchronous concatenation is never performed, because you would lose the intended ordering.
 *
 * The default output type is string, because it is better and
 * easier to work with the in-memory representation of the concat output.
 *
 * @param spec {Object} [optional] containing "dest" property if an output file is desired. "encoding" property if not using utf8
 * @param promise {EventEmitter}
 */
function concatTask(spec, promise) {
    var destination = spec && spec.dest || null,
        encoding = spec && spec.encoding || 'utf8';

    switch (this._state.get().type) {

        case State.TYPES.STRINGS:
            this._state.set(State.TYPES.STRING, this._state.get().value.join(''));

            promise.emit('complete', 'concat', this._state.get().value.length + ' characters.');
            break;

        case State.TYPES.FILES:
            var concatString = concatFilesSync(destination, this._state.get().value, encoding);
            this._state.set(State.TYPES.STRING, concatString);

            promise.emit('complete', 'concat', 'concatenated files');
            break;

        case State.TYPES.STRING:
            promise.emit('complete', 'concat', 'did not concatenate single string');
            break;

        default:
            promise.emit('failed', 'concat', 'unrecognised input type: ' + this._type);
            break;
    }
}

// Export the task
exports.tasks = {
    'concat' : {
        callback: concatTask
    }
};