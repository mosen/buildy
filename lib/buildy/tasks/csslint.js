/**
 * CSSLint the input
 *
 * @module tasks
 * @submodule csslint
 */
var State = require('../state');

function _csslint(params, status, logger) {
    var csslint = require('csslint').CSSLint;

    this.state.forEach(function(name, o) {

        this.state.read(o, function(err, data) {
            if (err) {
                return status.emit('failure', 'csslint', 'failed to read: ' + err);
            }

            // TODO: Emulate csslint cli.js gatherRules(params), to supply options to this task via parameters

            var result = csslint.verify(data);
            status.emit('results', 'csslint', result);

            status.emit('complete', 'csslint');
        }, this);

    }, this);
}

exports.tasks = {
    csslint: _csslint
};