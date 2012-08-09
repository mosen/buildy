/**
 * Concatenate files or strings.
 *
 * @module tasks
 * @submodule concat
 */
var State = require('../state.js'),
    fs = require('fs');

/**
 * Concatenate two or more items
 *
 * @param {Object} params Task parameters
 * @param {EventEmitter} status Task status object
 * @param {Object} logger Logger
 * @param status
 * @param logger
 * @private
 */
function _concat(params, status, logger) {

    var content = '';
    var namejoin = '';

    this.state.forEach(function(name, o) {

        this.state.readSync(o, function(err, data) {
            if (err) {
                return status.emit('failure', 'concat', 'Failed to read file: ' + err);
            }

            content += data;
            namejoin += (name + '-');
        }, this);

    }, this);

    this.state.reset([{ name: namejoin + 'concat', string: content }]);

    status.emit('complete', 'concat');
}

exports.tasks = {
    'concat' : _concat
};