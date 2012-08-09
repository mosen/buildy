/**
 * JSLint the input using reid/node-jslint (reid burke/douglas crockford)
 *
 * https://github.com/reid/node-jslint
 *
 * Options can be found at http://www.jslint.com/lint.html under "Options"
 *
 * @module tasks
 * @submodule jslint
 */

var State = require('../state'),
    fs = require('fs');

function _jslint(params, status, logger) {
    var options = params || { encoding: 'utf8' };
    var self = this;
    var linter = require('jslint/lib/linter.js');
    var todo = this.state.length();

    // TODO: Use node-async to make sure all of these execute in parallel or consider forEachAsync wrapper
    this.state.forEach(function(name, value) {

        self.state.read(value, function(err, data) {

            if (err) {
                return status.emit('failed', 'jslint', 'Error reading file: ' + err);
            }

            if (data) {
                status.emit('results', 'jslint', linter.lint(data, options));
            }

            if (!--todo) {
                return status.emit('complete', 'jslint', 'Finished linting items.');
            }
        });
    });
}

exports.tasks = {
    'jslint' : _jslint
};