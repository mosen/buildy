var Buildy = require('buildy/lib/buildy').Buildy,
    fs = require('fs');

/**
 * Run JSLint|JSHint on a string or file.
 *
 * @method lint
 * @param o {Object} Object containing properties .source | .sourceFile, string or file to lint respectively,
 * .options {Object} JSLint options, .encoding {String} Encoding for files [default 'utf8']
 * @param callback {Function} Callback function when lint has finished.
 */
function jslint(o, callback) {

    var linter = require('jslint/lib/linter.js'),
        reporter = require('jslint/lib/reporter.js'),
        result;

    options = o.options || {};
    encoding = o.encoding || 'utf8';

    if (o.source && o.source.length > 0) {
        result = linter.lint(o.source, options);
        callback(false, result);
    } else if (o.sourceFile && o.sourceFile.length > 0) {
        fs.readFile(o.sourceFile, encoding, function(err, data) {
            if (err) {
                callback(err);
            } else {
                result = linter.lint(data.toString(encoding), options);
                // TODO: report results in builder output, not here in utils
                //reporter.report(o.sourceFile, result);
                callback(false, result);
            }
        });
    } else {
        callback(true);
    }
};


/**
 * JSLint the input
 *
 * This task can be performed on a string, or strings or files
 * The task will return immediately and produces no output for the following
 * task.
 *
 * @param spec {Object} jslint task configuration
 * @param promise {EventEmitter}
 */
function jslintTask(spec, promise) {
    var lintOptions = spec || {};

    switch (this._type) {

        case Buildy.TYPES.FILES:
            this._state.forEach(function(f) {
                jslint({sourceFile: f, options: lintOptions}, function(err, result) {
                    var reporter = require('jslint/lib/reporter.js');
                    reporter.report(f, result);

                    // TODO: user defined lint output file or json or console ?
                });

            });
            // Don't care about the exit status or timing of lint jobs
            promise.emit('complete', 'jslint', this._state.join(', '));
            break;

        case Buildy.TYPES.STRING:

           jslint({source: this._state, options: lintOptions}, function(err, result) {
                var reporter = require('jslint/lib/reporter.js');
                reporter.report('buildy', result);

            });
            promise.emit('complete', 'jslint', 'string linted.'); // Who cares, its async by nature
            break;

        case Buildy.TYPES.STRINGS:

            this._state.forEach(function(f) {
                jslint({source: f, options: lintOptions}, function(err, result) {
                    var reporter = require('jslint/lib/reporter.js');
                    reporter.report('buildy', result);

                });
            });
            promise.emit('complete', 'jslint', 'strings linted.');
            break;

        default:
            promise.emit('failed', 'jslint', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'jslint' : {
        callback: jslintTask
    }
};