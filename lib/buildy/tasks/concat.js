/**
 * Concatenate files or strings.
 *
 * @module tasks
 * @submodule concat
 */
var State     = require('../state.js'),
    fs        = require('fs');

/**
 * Concatenate one or more files to a destination file or string.
 *
 * @method concatFilesSync
 * @private
 * @param destfile {null|String} A null value will return the output instead of writing it to a filename.
 * @param sourcefiles {Array} array of files to read and concatenate.
 * @param encoding {String} source file encoding (default "utf8")
 * @return {String} Concatenated output
 */

/**
 * Concatenate the input
 *
 * This task can be performed on files or strings.
 * Asynchronous concatenation is never performed, because you would lose the intended ordering.
 *
 * The default output type is string, because it is better and
 * easier to work with the in-memory representation of the concat output.
 *
 * @method concatTask
 * @public
 * @param params {Object} [optional] containing "dest" property if an output file is desired. "encoding" property if not using utf8
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 */


function _concatString(params, status, logger) {
    var encoding = this.state.meta('encoding') || 'utf8';

    if (this.state.length() === 1) {
        status.emit('complete', 'concat', 'did not attempt to concatenate single string.');
    } else {
        this.state.set(null, this.state.values().join('') , State.TYPES.STRING);
        status.emit('complete', 'concat', 'concatenated ' + stateItemCount + ' item(s).');
    }
}

function _concatFile(params, status, logger) {
    var destination = params && params.dest || null,
        encoding    = this.state.meta('encoding') || 'utf8';

    if (this.state.length() === 1) {
        status.emit('complete', 'concat', 'did not attempt to concatenate a single file.');
    } else {
        // destfile, sourcefiles, encoding
        var content  = ''; // Use a string to hold concatenated content, one caveat is that memory allocated = size of files

        try {
            this.state.forEach(function(key, value, meta) {
                // Sometimes the file contains nothing, which is substituted with a zero-length string.
                // We use synchronous file reading because usually the author intends to keep the ordering.
                content += fs.readFileSync(value, encoding) || '';
            });
        } catch(e) {
            status.emit('failed', 'concat', 'Could not read the files to be concatenated : ' + this.state.value().join(', ') + ' ' + e);
        }

        try {
            if (destination === null) {
                this.state.set(null, content, State.TYPES.STRING);
            } else {
                fs.writeFileSync(destination, content, encoding);
                this.state.set(null, destination, State.TYPES.FILE);
            }
        } catch(e) {
            status.emit('failed', 'concat', 'Could not write the file to be concatenated :' + destination);
        }

        status.emit('complete', 'concat', 'concatenated ' + stateItemCount + 'file(s).');
    }
}

exports.tasks = {
    'concat' : {
        'STRING' : _concatString,
        'FILE' : _concatFile
    }
};