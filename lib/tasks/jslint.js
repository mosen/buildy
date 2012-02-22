/**
 * JSLint the input using reid/node-jslint (reid burke/douglas crockford)
 *
 * https://github.com/reid/node-jslint
 *
 * Options can be found at http://www.jslint.com/lint.html under "Options"
 *
 * TODO: needs alternate output eg. to json file.
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Read and output lint results, printing a file heading before each lint output
 *
 *  - STRINGS
 *  Lint each string successively
 *
 *  - STRING
 *  Lint the string
 *
 *  - UNDEFINED
 *  Fails the task.
 *
 * OUTPUT:
 *
 *  - FILES|STRINGS|STRING
 *  Same data as the input, untouched.
 * ---
 */

var State = require('../state'),
    fs = require('fs');

/**
 * Process the supplied string using node-jslint
 *
 * @method lint
 * @param data {String} Javascript source to lint.
 * @param filename {String} [filename=''] Optional filename associated with the lint process.
 * @param options {Object} [options={}] Options passed to jslint, see JSLint documentation.
 * @param callback {Function} Callback function taking err, results, filename
 */
function lint(data, filename, options, callback) {
    var linter = require('jslint/lib/linter.js'),
        result;

    filename = filename || '';
    options = options || {};

    if (data && data.length > 0) {
        result = linter.lint(data, options);
        callback(null, result, filename);
    } else {
        // Dont fail empty lints
        callback(null, {}, filename);
    }
}

/**
 * JSLint the input
 *
 * This task can be performed on a string, or strings or files
 * The task will return immediately and produces no output for the following
 * task.
 *
 * @param params {Object} jslint task configuration
 * @param params.encoding [params.encoding='utf8'] Encoding used for strings and files.
 * @param params.* Lint options
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 */
function jslintTask(params, status, logger) {
    var options = params || {},
        self = this,
        reporter = require('jslint/lib/reporter.js');

    options.encoding = options.encoding || 'utf8';

    switch (this._state.get().type) {

        case State.TYPES.FILES:
            this._state.get().value.forEach(function(filename) {
                fs.readFile(filename, options.encoding, function(err, data) {
                    if (err) {
                        // TODO: fail task?
                    } else {
                        lint(data, filename, options, function(err, results, filelinted) {
                            reporter.report(filelinted, results);
                        });
                    }
                });
            });

            status.emit('complete', 'jslint', 'Started linting ' + this._state.get().value.length + ' file(s).');
            break;

        case State.TYPES.STRING:
            lint(this._state.get().value, '', options, function(err, results) {
                reporter.report('jslint', results);
            });

            status.emit('complete', 'jslint', 'string linted.'); // Who cares, its async by nature
            break;

        case State.TYPES.STRINGS:
            this._state.get().value.forEach(function(str) {
                lint(str, '', options, function(err, results) {
                    reporter.report('jslint', results);
                });
            });

            status.emit('complete', 'jslint', 'strings linted.');
            break;

        default:
            status.emit('failed', 'jslint', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'jslint' : {
        callback: jslintTask
    }
};