/**
 * Concatenate files or strings.
 *
 * @module tasks
 * @submodule concat
 */
var State     = require('../../state.js'),
    fs        = require('fs');

/**
 * Concatenate input string(s)
 *
 * @param params
 * @param status
 * @param logger
 * @private
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

/**
 * Concatenate input file(s)
 *
 * @param params
 * @param status
 * @param logger
 * @private
 */
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
                this.state.set(null, destination, State.TYPES.FILE, { filename: destination });
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