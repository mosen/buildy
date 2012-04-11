/**
 * Write the input to the paramsified file
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Write the list of files to the paramsified file (line feed after each filename).
 *
 *  - STRINGS
 *  Write the strings (concatenated) to the paramsified file.
 *
 *  - STRING
 *  Write the string to the paramsified file.
 *
 *  - UNDEFINED
 *  Touch the file.
 *
 * OUTPUT:
 *
 *  - FILES
 *  The filename that was written.
 * ---
 *
 * @module tasks
 * @submodule write
 */

var State  = require('../state'),
    path   = require('path'),
    mkdirp = require('mkdirp').mkdirp,
    fs     = require('fs');

/**
 * Write out the input to the destination filename.
 *
 * This can only apply to single string inputs.
 *
 * @method writeTask
 * @param options {Object} Write task options
 * @param options.name {String} Filename to write to.
 * @param options.encoding {String} [default='utf8'] Encoding to use when writing the file
 * @param options.mkdir {Boolean} [default=true] Make destination directory if it does not exist
 * @param options.dirmode {String} [default='0755'] Create new directories with this mode (chmod)
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 * @return {undefined}
 * @public
 */
function writeTask(options, status, logger) {
    var self = this,
        pathname = path.resolve(path.dirname(options.name)),
        name = options.name,
        encoding = options && options.encoding || 'utf8',
        mkdir = options && options.mkdir || true,
        dirmode = options && options.dirmode || '0755';

    // Write the content to the specified file.
    function writeFile(filename, data) {
        fs.writeFile(filename, data, encoding, function(err) {
            if (err) {
                status.emit('failed', 'write', 'error writing destination file: ' + err);
            } else {
                self._state.set(State.TYPES.FILES, [ filename ]);
                status.emit('complete', 'write', 'wrote ' + filename);
            }
        });
    }

    // Create the paramsified path if it does not exist.
    function mkdirIfNotExist(filename, callback) {
        path.exists(filename, function(exists) {
            if (!exists) {
                if (mkdir === true) {
                    mkdirp(filename, dirmode, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
                } else {
                    callback('tried to write a file to a non-existing directory and mkdir is false');
                }
            } else {
                callback(null);
            }
        });
    }

    switch (this._state.get().type) {
        case State.TYPES.FILES:
            mkdirIfNotExist(pathname, function(err) {
                if (err) {
                    status.emit('failed', 'write', 'error creating destination directory: ' + err);
                } else {
                    writeFile(name, self._state.get().value.join("\n"));
                }
            });
            break;

        case State.TYPES.STRING:
            mkdirIfNotExist(pathname, function(err) {
                if (err) {
                    status.emit('failed', 'write', 'error creating destination directory: ' + err);
                } else {
                    writeFile(name, self._state.get().value);
                }
            });
            break;

        case State.TYPES.STRINGS:
            mkdirIfNotExist(pathname, function(err) {
                if (err) {
                    status.emit('failed', 'write', 'error creating destination directory: ' + err);
                } else {
                    writeFile(name, self._state.get().value.join(""));
                }
            });
            break;

        case State.TYPES.UNDEFINED:
            mkdirIfNotExist(pathname, function(err) {
                if (err) {
                    status.emit('failed', 'write', 'error creating destination directory: ' + err);
                } else {
                    writeFile(name, "");
                }
            });
            break;

        default:
            status.emit('failed', 'write', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'write' : {
        callback: writeTask
    }
};