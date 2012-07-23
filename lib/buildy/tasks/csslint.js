/**
 * CSSLint the input using stubbornella/csslint (nzakas et al)
 *
 * https://github.com/stubbornella/csslint
 *
 * @module tasks
 * @submodule csslint
 */
var State = require('../state');

// Idealised task function
function _csslint(params, status, logger) {
    var csslint = require('csslint').CSSLint;

    this.state.eachAs('string', function(str, filename) {
        filename = filename || '(no filename)';

        var result = csslint.verify(str, params.options);
        logger.log('info', result.messages.join("\n"));
    }, this);
}

exports.tasks = {
    'csslint' : {
        'FILE' : _csslint,
        'STRING' : _csslint
    }
};