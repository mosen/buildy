/**
 * Log a message.
 *
 * @module tasks
 * @submodule log
 */

function _log(params, status, logger) {
    var logLevel = params && params.loglevel || 'info';

    if (params && params.message) {
        console.log(params.message, logLevel);
    }

    status.emit('complete', 'log', '');
}

exports.tasks = {
    'log' : _log
};