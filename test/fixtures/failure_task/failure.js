
function _failure(params, status, logger) {
    status.emit('failed', 'failure', 'This task is designed to fail');
}


exports.tasks = {
    'failure' : _failure
};