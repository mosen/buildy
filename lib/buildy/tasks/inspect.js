/**
 * Inspect the output from the previous task.
 *
 * Dumps a human readable representation of the value produced by the previous task.
 * You may want to use this task to see more information about the build process, or to aid in debugging a problem.
 *
 * @module tasks
 * @submodule inspect
 */

var util = require('util'),
    State = require('../state');

function _inspect(params, status) {

    if (params && params.header) {
        console.log(params.header);
    }

    // this context currently resolves to `undefined`
    this.state.forEach(function(name, value) {
        console.log('name: ' + name);
        console.log('value: ');
        console.log(util.inspect(value));
    });

    if (params && params.footer) {
        console.log(params.footer);
    }

    status.emit('complete', 'inspect', '');
}

exports.tasks = {
    'inspect' : _inspect
};