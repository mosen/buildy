/**
 * Buildy copy task
 *
 * @module tasks
 * @submodule copy
 */
var copy_recursive = require('../copy_recursive');
var State = require('../state');

/**
 * Copy a number of sources to a destination
 * (Supports wildcard matching and exclusion list)
 *
 * @param {Object} params Task parameters
 * @param {Array} params.src Array of file sources, directories, and globs
 * @param {String} params.dest Destination relative or absolute path
 * @param {Array} params.excludes Array of substrings to exclude files from being copied.
 */

function _copy(params, status, logger) {
    var sources = params.src;
    var destination = params.dest || null;
    var excludes = params.excludes || [];

    copy_recursive(sources, destination, function (err, results) {
        // TODO: Error if failed.
        // TODO: Emit results.

        status.emit('complete', 'copy', 'Files copied');
    }, {
        exclude : excludes,
        context : this
    });
}

exports.tasks = {
    'copy' : _copy
};