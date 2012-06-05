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
function concatFilesSync(destfile, sourcefiles, encoding) {
    var content  = '',
        encoding = encoding || 'utf8';

    try {
        sourcefiles.forEach(function(f) {
            // Sometimes the file contains nothing, which is substituted with a zero-length string.
            // We use synchronous file reading because usually the author intends to keep the ordering.
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
}

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
function concatTask(params, status, logger) {
    var destination = params && params.dest || null,
        encoding    = this.state.meta('encoding') || 'utf8';

    switch (this.state.type()) {

        case 'STRING':
            if (this.state.length() === 1) {
                status.emit('complete', 'concat', 'did not attempt to concatenate single string.');
            } else {
                this.state.set(this.state.value().join(''));
                status.emit('complete', 'concat', 'concatenated ' + stateItemCount + ' item(s).');
            }
            break;

        case 'FILE':
            if (this.state.length() === 1) {
                status.emit('complete', 'concat', 'did not attempt to concatenate a single file.');
            } else {
                var concatenated = concatFilesSync(destination, this.state.value(), this.state.meta('encoding'));
                this.state.set(concatenated);
                status.emit('complete', 'concat', 'concatenated ' + stateItemCount + 'file(s).');
            }
            break;
    }
}

exports.tasks = {
    'concat' : {
        'STRING' : concatTask,
        'FILE' : concatTask
    }
};