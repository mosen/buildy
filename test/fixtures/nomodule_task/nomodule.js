// This fixture task simulates a module that is completely unavailable.

function _nomodule(params, status, logger) {
    require('this_module_should_not_exist_ever');
}


exports.tasks = {
    'nomodule' : _nomodule
};