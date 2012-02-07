/**
 * Log a message.
 *
 * ---
 * INPUTS:
 *
 * - ALL
 * Passed to the next task
 *
 * OUTPUT:
 *
 *  - FILES|STRINGS|STRING
 *  Same data as the input, untouched.
 * ---
 */

/**
 * Log an arbitrary message
 *
 * @param params {Object}
 * @param params.message {String} Message to be logged
 * @param params.loglevel {String} Loglevel of the message, see winston loglevel documentation.
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 */
function logTask(params, status, logger) {
    var logLevel = params && params.loglevel || 'info';

    if (params && params.message) {
        logger.log(logLevel, params.message);
    }

    status.emit('complete', 'log', '');
}


exports.tasks = {
    'log' : {
        callback: logTask
    }
};