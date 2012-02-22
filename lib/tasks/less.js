/**
 * supporting tasks for cloudhead/less.js (alexis sellier)
 *
 * https://github.com/cloudhead/less.js
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Minify CSS in all of the files listed.
 *
 *  - STRINGS
 *  Minify CSS in strings
 *
 *  - STRING
 *  Minify CSS in the input string.
 *
 *  - UNDEFINED
 *  Fail task.
 *
 * OUTPUT:
 *
 *  - STRINGS
 *  A collection of minified CSS file contents.
 * ---
 */

var State = require('../state'),
    fs = require('fs');

/**
 * Process the given string input using less.js
 *
 * @param data {String} less/css to process
 * @param filename {String} [optional] Originating filename, can be zero length string for in-memory string.
 * @param options {Object} options given to less.js
 * @param options.paths {Array} paths to be searched for LESS import directives.
 * @param callback {Function} callback which takes err, data, filename as parameters.
 */
function less(data, filename, options, callback) {
    var less = require('less'),
        encoding = options.encoding,
        paths = options.paths || [],
        parser = new less.Parser({ paths: paths, filename: filename });

    parser.parse(data, function(err, tree) {
        if (err) {
            callback(err);
        } else {
            callback(null, tree.toCSS({ compress: true }), filename);
        }
    });
}


/**
 * Process the input CSS through less.js and attempt to compress it.
 *
 * @method cssminifyTask
 * @param params {Object} task options
 * @param params.paths {Array} paths to be searched for LESS import directives.
 * @param params.encoding {String} [encoding='utf8'] Encoding to use for strings and files.
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 * @public
 */
function cssminifyTask(params, status, logger) {
    var self = this;

    params = params || {};
    params.encoding = params.encoding || 'utf8';

    switch (this._state.get().type) {
        case State.TYPES.FILES:
            var filesToProcess = filesToProcessTotal = this._state.get().value.length,
                filecontents = {};

            function fileBatchMinified(contents) {
                var fcprop,
                    contents_array = [];

                for (fcprop in filecontents) { // Convert to array, but may retain filenames in future with STRINGS type
                   contents_array.unshift(filecontents[fcprop]);
                }

                self._state.set(State.TYPES.STRINGS, contents_array);
                status.emit('complete', 'cssminify', 'Minified ' + filesToProcessTotal + ' file(s).');
            }

            function fileMinified(err, data, filename) {
                filecontents[filename] = data;

                if (!--filesToProcess) { // Check if all done
                    fileBatchMinified(filecontents);
                }
            }

            this._state.get().value.forEach(function(filename) {
                fs.readFile(filename, params.encoding, function(err, data) {
                    if (err) {
                        // TODO: fail task?
                        fileMinified('Couldnt minify file: ' + filename + ', reason: ' + err);
                    } else {
                        less(data, filename, params, fileMinified);
                    }
                });
            });
            break;

        case State.TYPES.STRINGS:
            var stringsToProcess = stringsToProcessTotal = this._state.get().value.length,
                stringContents = [];

            function stringBatchMinified(contents) {
                self._state.set(State.TYPES.STRINGS, contents);
                status.emit('complete', 'cssminify', 'Minified ' + stringsToProcessTotal + ' string(s).');
            }

            function stringMinified(err, data) {
                if (err) {
                    // TODO: notify failure
                } else {
                    stringContents.push(data);
                }

                if (!--stringsToProcess) {
                    stringBatchMinified(stringContents);
                }
            }

            this._state.get().value.forEach(function(str) {
                less(str, '', params, stringMinified);
            });
            break;

        case State.TYPES.STRING:
            less(this._state.get().value, '', params, function(err, data) {
                self._state.set(State.TYPES.STRING, data);
                status.emit('complete', 'cssminify', 'Minified CSS string.');
            });
            break;

        default:
            status.emit('failed', 'cssminify', 'unrecognised input type: ' + this._state.get().type);
            break;
    }
}

exports.tasks = {
    // Less + Compress
    'cssminify' : {
        callback: cssminifyTask
    }
    // Just process through less.js
//    , 'lesstocss' : {
//        callback: lessTask
//    }
};