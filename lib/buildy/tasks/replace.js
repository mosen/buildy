/**
 * Replace contents in the file or string(s) using a regular expression.
 *
 * @module tasks
 * @submodule replace
 */

var State = require('../state'),
    fs = require('fs');

function _replace(params, status) {
    var replace  = params.replace || '',
        flags    = params.flags || 'mg',
        regex    = new RegExp(params.regex, flags);

    var todo = this.state.length();

    this.state.forEach(function(name, value) {
        this.state.read(value, function(err, data) {
            if (err) {
                return status.emit('failed', 'replace', 'could not read: ' + err);
            }

            this.state.set(name, { string: data.replace(regex, replace) });

            if (!--todo) {
                return status.emit('complete', 'replace', 'completed string replacement');
            }
        }, this);
    }, this);
}

exports.tasks = {
    'replace' : _replace
};