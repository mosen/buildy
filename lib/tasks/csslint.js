// TODO: separate constants exported to modules in a different file.
// TODO: clean up the merge of utils.* functions with task modules.
// TODO: csslint does not seem to print a report, log something even when nothing was found.
var Buildy = require('buildy/lib/buildy').Buildy,
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
 * CSSLint the input
 *
 * This can be executed on files, strings or string.
 *
 * @param spec {Object} csslint task configuration
 * @param promise {EventEmitter}
 * @protected
 */
function csslintTask(spec, promise) {
    var lintOptions = spec || {};

    switch (this._type) {
        case Buildy.TYPES.FILES:
            this._state.forEach(function(f) {
                cssLint({sourceFile: f, options: lintOptions}, function(err, result) {
                    // TODO: user defined lint output
                    //console.log(result);
                });
            });
            promise.emit('complete', 'csslint', this._state.join(', '));
            break;

        case Buildy.TYPES.STRING:
            cssLint({source: this._state, options: lintOptions}, function(err, result) {
                // TODO: user defined lint output
                //console.log(result);
            });
            promise.emit('complete', 'csslint', 'linted string');
            break;

        case Buildy.TYPES.STRINGS:
            this._state.forEach(function(s) {
                cssLint({source: s, options: lintOptions}, function(err, result) {
                    // TODO: user defined lint output
                    //console.log(result);
                });
            });
            promise.emit('complete', 'csslint', 'linted strings');
            break;

        default:
            promise.emit('failed', 'csslint', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'csslint' : {
        callback: csslintTask
    }
};