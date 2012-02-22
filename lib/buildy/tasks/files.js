/**
 * files
 *
 * A task for collecting a list of files to be processed by the build tool.
 * Typically this is the first task in a chain.
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Append the input file list with the filenames resolved by this task.
 *
 *  - STRINGS
 *  Interpret each of the input strings as filenames or globs to resolve.
 *
 *  - STRING
 *  Interpret the input string as a filename or glob to resolve.
 *
 *  - UNDEFINED
 *  Generate a list of files using the filenames listed in the task options.
 *
 * OUTPUT:
 *
 *  - FILES
 *  A list of filenames that match the names supplied.
 * ---
 */

var glob      = require('../glob'),
    State    = require('../state');

/**
 * Generate a list of files using a combination of names and globs
 *
 * @todo abstract the recursive globbing of Cprf to share with this
 *
 * @method filesTask
 * @param filenames {Array} Array of literal filenames or globs
 * @param callback {EventEmitter}
 * @protected
 */
function resolveFiles(filenames, callback) {
    var files = [],
        self = this,
        globsToProcess = [],
        itemsToProcess = filenames.length,
        fnGlobFinished = function(globEnded, pattern) {
            globsToProcess = globsToProcess.filter(function(v) {
                return (v === globEnded) ? false : true;
            });
            itemsToProcess--;

            fnIsDone();
        },
        fnAddFile = function(filenames) {
            files.push.apply(files, filenames);
            itemsToProcess--;

            fnIsDone();
        },
        fnIsDone = function() {
            if (itemsToProcess == 0 && globsToProcess.length == 0) {
                callback(null, files);
            }
        };

    filenames.forEach(function(f) {

        if (/(^!|^#|[?*])/.test(f)) { // String contains a glob, attempt to expand

            var newGlob = glob.glob(f);
            globsToProcess.push(newGlob);

            newGlob.on('data', function(filename) {
                files.push.apply(files, [filename]);
            });

            newGlob.on('error', function(err) {
                // TODO: fail queue on glob error? or proceed?
                callback(err);
            });

            newGlob.on('end', function(pattern) {
                fnGlobFinished(this, pattern);
            });

        } else { // Resolved path
            fnAddFile([f]);
        }
    });
}

/**
 * Gather a list of files.
 *
 * This task can be used to generate a list of files by providing filenames or globs to match.
 *
 * If the input type is string or strings, then these will be used to match filenames if possible. (useful if you
 * are reading a list of files to operate on from a file itself).
 *
 * @param params {Array} Array of relative or absolute filenames, and/or globs to match.
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 */
function filesTask(params, status, logger) {
    var filenames = params || [],
        self = this;

    switch (this._state.get().type) {

        // Append these strings as filenames
        case State.TYPES.STRINGS:
            this._state.get().value.forEach(function(filename) {
                filenames.push(filename);
            });
            break;

        // Append files to files
        case State.TYPES.FILES:
            this._state.get().value.forEach(function(filename) {
                filenames.push(filename);
            });
            break;

        // Append this filename to files listing.
        case State.TYPES.STRING:
            filenames.push(this._state.get().value);
            break;

        // Just generate files listing from supplied params.
        default:
            break;
    }

    resolveFiles(filenames, function(err, files) {
        if (err) {
            status.emit('failed', 'files', err);
        } else {
            self._state.set(State.TYPES.FILES, files);
            status.emit('complete', 'files', files.join(', '));
        }
    });
}

// This is where we export the tasks we created
exports.tasks = {
    "files" : {
        callback: filesTask
    }
};