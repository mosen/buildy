var glob      = require('buildy/lib/glob'),
    Buildy    = require('buildy/lib/buildy').Buildy;

/**
 * files
 *
 * A task for collecting a list of files to be processed by the build tool.
 * Typically this is the first task in a chain.
 */

/**
 * Generate a list of files using a combination of names and globs
 *
 * @todo abstract the recursive globbing of Cprf to share with this
 *
 * @method filesTask
 * @param filespec {Array} Array of literal filenames or globs
 * @param promise {EventEmitter}
 * @protected
 */
function filesTask(filespec, promise) {
    var files = [],
        self = this,
        globsToProcess = [],
        itemsToProcess = filespec.length,
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
                self._type = Buildy.TYPES.FILES;
                self._state = files;

                promise.emit('complete', 'files', self._state.join(', '));
            }
        };

    filespec.forEach(function(f) {

        if (/(^!|^#|[?*])/.test(f)) { // Test for Glob

            var newGlob = glob.glob(f);
            globsToProcess.push(newGlob);

            newGlob.on('data', function(filename) {
                files.push.apply(files, [filename]);
            });

            newGlob.on('error', function(err) {
                // TODO: fail queue on glob error? or proceed?
                promise.emit('failed', 'files', err);
            });

            newGlob.on('end', function(pattern) {
                fnGlobFinished(this, pattern);
            });

        } else { // Resolved path
            fnAddFile([f]);
        }
    });
}

// This is where we export the tasks we created
exports.tasks = {
    "files" : {
        callback: filesTask
    }
};