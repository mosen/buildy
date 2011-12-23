var Buildy    = require('buildy/lib/buildy').Buildy,
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
 * @param spec {Object} [optional] containing "dest" property if an output file is desired.
 * @param promise {EventEmitter}
 */
function concatTask(spec, promise) {
    switch (this._type) {

        case Buildy.TYPES.STRINGS:
            this._state = this._state.join();
            this._type = Buildy.TYPES.STRING;
            promise.emit('complete', 'concat', this._state.length + ' characters.');
            break;

        case Buildy.TYPES.FILES:
            var concatString = concatFilesSync(null, this._state, 'utf8');
            this._state = concatString;
            this._type = Buildy.TYPES.STRING;
            promise.emit('complete', 'concat', 'concatenated files');
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