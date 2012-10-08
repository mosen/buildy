
function _nothing(params, status, logger) {
    status.emit('complete', 'nothing', 'This task is designed to do nothing at all.');
}


exports.tasks = {
    'nothing' : _nothing
};