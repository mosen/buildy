/**
 * CSSLint the input using stubbornella/csslint (nzakas et al)
 *
 * https://github.com/stubbornella/csslint
 */

var State = require('buildy/lib/state'),
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
        callback('No source or sourcefile was specified to be css linted.');
    }
};



/**
 * CSSLint task handler
 *
 * @param spec {Object} CSSLint task configuration
 * @param status {EventEmitter}
 */
function csslintTask(spec, status) {
    var lintOptions = spec || {};

    switch (this._state.get().type) {
        case State.TYPES.FILES:
            this._state.get().value.forEach(function(f) {
                cssLint({sourceFile: f, options: lintOptions}, function(err, result) {
                    // TODO: user defined lint output
                    console.log(result);
                });
            });
            status.emit('complete', 'csslint', this._state.get().value.join(', '));
            break;

        case State.TYPES.STRING:
            cssLint({source: this._state.get().value, options: lintOptions}, function(err, result) {
                // TODO: user defined lint output
                console.log(result);
            });
            status.emit('complete', 'csslint', 'linted string');
            break;

        case State.TYPES.STRINGS:
            this._state.get().value.forEach(function(s) {
                cssLint({source: s, options: lintOptions}, function(err, result) {
                    // TODO: user defined lint output
                    console.log(result);
                });
            });
            status.emit('complete', 'csslint', 'linted strings');
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