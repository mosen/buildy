var util = require('util');

/**
 * Inspect the output of the previous task.
 * This can be used to debug the build chain or provide extra output in the build process.
 *
 * @method log
 * @param spec {Object} .message - message to prefix the current state.
 * @param promise {EventEmitter}
 * @protected
 */
function inspectTask(spec, promise) {

    if (spec && spec.hasOwnProperty('message')) {
        util.log(spec.message);
    }

    if (this._state) {
        util.log(this._state);
    } else {
        util.log('No output to log from previous task');
    }

    promise.emit('complete', 'log', ''); // TODO: Maybe this should be the log output? the event arg
}

exports.tasks = {
    'inspect' : {
        callback: inspectTask
    }
};