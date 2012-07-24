/**
 * Buildy copy task
 *
 * @module tasks
 * @submodule copy
 */

var copy_recursive = require('../../copy_recursive');
var State = require('../../state');

/**
 * Copy a number of sources to a destination
 * (Supports wildcard matching and exclusion list)
 *
 * params {
 *  src : [ 'file', 'directory', 'file.*', 'directory/*' ],
 *  dest : '/absolute/or/relative/path',
 *  recursive : true | false
 *  excludes : [ 'excludedfile', 'excluded/directory/' ] - wildcards currently not supported, must match exactly
 * }
 *
 * @method copy
 * @param params {Object} task parameters
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 */
function _copyTask(params, status, logger) {
    var source = params && params.src || this.state.values();
    var destination = params && params.dest || null;
    var recursive = params && params.recursive || true;
    var excludes = params && params.excludes || [];
    var self = this;

    copy_recursive(source, destination, function (err, results) {
        var copied = [];

        results.complete.forEach(function (copyResult) {
            copied.unshift(copyResult.destination);
            logger.log('info', 'copied ' + copyResult.destination);
        });

        this.state.set(State.TYPES.FILES, copied);

        status.emit('complete', 'copy', copied.join(', '));
    }, {
        exclude : excludes,
        context : this
    });
}

exports.tasks = {
    'copy' : {
        'FILE' : _copyTask
    }
};