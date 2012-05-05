/**
 * CSSLint the input using stubbornella/csslint (nzakas et al)
 *
 * https://github.com/stubbornella/csslint
 *
 * @module tasks
 * @submodule csslint
 */

var State = require('../state'),
    fs = require('fs');

/**
 * CSSLint source file using csslint
 *
 * @todo change callback signature to standard err,data
 * @method cssLint
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js', options : { [CSSLint Options] }, encoding: 'utf8' }
 * @param callback {Function} Callback function which receives one value, the result of csslint.
 */
function cssLint(o, callback) {
    var csslint = require('csslint').CSSLint,
        opts = o.options || {},
        encoding = o.encoding || 'utf8',
        result;

    if (o.source && o.source.length > 0) {
        result = csslint.verify(o.source, opts);
        callback(false, result);

    } else if (o.sourceFile && o.sourceFile.length > 0) {
        fs.readFile(o.sourceFile, encoding, function(err, data) {

            if (err) {
                callback(err);
            } else {
                data = data.toString(encoding);

                result = csslint.verify(data, opts);
                callback(false, result);
            }
        });
    } else {
        callback('No source or sourcefile was paramsified to be css linted.');
    }
}



/**
 * CSSLint task handler
 *
 * @param params {Object} CSSLint task configuration
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 */
function csslintTask(params, status, logger) {
    var lintOptions = params || {},
        errors = 0,
        completed = 0,
        self = this;

    function logResults(prefix, result) {
        if (result.messages.length > 0) {
            logger.log('info', prefix + result.messages.map(function(m) {return m.message;}).join("\n"));
        }
        return result.messages.length;
    }

    switch (this._state.get().type) {
        case State.TYPES.FILES:
            this._state.get().value.forEach(function(f) {
                cssLint({sourceFile: f, options: lintOptions}, function(err, result) {
                    errors += logResults('Lint errors found in ' + f + ':\n', result);

                    if (++completed === self._state.get().value.length) {
                        if (!errors) {
                            status.emit('complete', 'csslint', 'lint ok');
                        }
                        else {
                            status.emit('complete', 'csslint', errors + ' lint errors');
                        }
                    }
                });
            });
            break;

        case State.TYPES.STRING:
            cssLint({source: this._state.get().value, options: lintOptions}, function(err, result) {
                errors += logResults('Lint errors found:\n', result);
        
                if (!errors) {
                    status.emit('complete', 'csslint', 'lint ok');
                }
                else {
                    status.emit('complete', 'csslint', errors + ' lint errors');
                }
            });
            break;

        case State.TYPES.STRINGS:
            this._state.get().value.forEach(function(s) {
                cssLint({source: s, options: lintOptions}, function(err, result) {
                    errors += logResults('Lint errors found:\n', result);

                    if (++completed === self._state.get().value.length) {
                        if (!errors) {
                            status.emit('complete', 'csslint', 'lint ok');
                        }
                        else {
                            status.emit('complete', 'csslint', errors + ' lint errors');
                        }
                    }
                });
            });
            break;

        default:
            status.emit('failed', 'csslint', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'csslint' : {
        callback: csslintTask
    }
};