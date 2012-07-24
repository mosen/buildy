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
        logger.log('info', 'csslint: ' + name);

        this.state.read(o, function(err, data) {
            if (err) {
                logger.log('error', 'Error trying to read: ' + err);
                return;
            }

            var result = csslint.verify(data);
            logger.log('info', "results:\n" + console.dir(result));

            status.emit('complete', 'csslint');
        }, this);

    }, this);
}

exports.tasks = {
    csslint: _csslint
};