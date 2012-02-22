/**
 * Minify the javascript input using uglify-js
 *
 * https://github.com/mishoo/uglifyjs
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Minify the input files, stores them as strings.
 *  TODO: for file->file tasks, establish a destination dir convention. no task should be destructive to the source file.
 *
 *  - STRINGS
 *  Minify the strings in place.
 *
 *  - STRING
 *  Minify the string in place.
 *
 *  - UNDEFINED
 *  Fails the task.
 *
 * OUTPUT:
 *
 *  - FILES|STRINGS|STRING
 *  Minified versions of the inputs.
 * ---
 */

var State = require('../state'),
    fs = require('fs');

/**
 * Process the given string input using UglifyJS
 *
 * @param data {String} Javascript code to process
 * @param filename {String} [optional] Originating filename, can be zero length string for in-memory code.
 * @param options {Object} options given to the jsminifyTask function
 * @param callback {Function} callback which takes err, data, filename as parameters.
 */
function uglify(data, filename, options, callback) {
    var parser = require("uglify-js").parser,
        pro = require("uglify-js").uglify,
        ast, // parsed AST
        uglified = "";

    try {
        ast = parser.parse(data, options.parse_strict_semicolons);

        if (options.lift_variables === true) {
            ast = pro.ast_lift_variables(ast);
        }

        if (options.mangle === true) {
            ast = pro.ast_mangle(ast, options.mangle_options);
        }

        if (options.squeeze === true) {
            ast = pro.ast_squeeze(ast, options.squeeze_options);
        }

        uglified = pro.gen_code(ast, options.options);
        callback(null, uglified, filename); // Callback with uglified version.

    } catch (e) {
        // Uglify doesn't usually give descriptive errors if the parser fails.
        callback('The minify task failed, usually this means the source file was unparseable. Please check your syntax. Exception:' + e.message);
    }
}

/**
 * Minify the input (JavaScript)
 *
 * Several of the task options are directly derived from UglifyJS' README. Please see
 * that readme for more information about those options.
 *
 * @method jsminify
 * @param params {Object} Minify task options/paramsification
 * @param params.encoding {String} [encoding='utf8'] Encoding used for files and strings.
 * @param params.parse_strict_semicolons {Boolean} [parse_strict_semicolons=false] Throw an error when semicolon is not found
 * @param params.mangle {Boolean} [mangle=true] Mangle variable and function names
 * @param params.mangle_options {Object} [mangle_options={}] Options for ast_mangle, see UglifyJS @ github.
 * @param params.lift_variables {Boolean} [lift_variables=false] Hoist variable declarations to the top of their scope.
 * @param params.squeeze {Boolean} [squeeze=true] Perform compression using various optimizations
 * @param params.squeeze_options {Object} [squeeze_options={}] Options for ast_squeeze, see UglifyJS @ github.
 * @param params.options {Object} [options={}] Options for the code generator, see UglifyJS @ github.
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 * @protected
 */
function jsminifyTask(params, status, logger) {
    var self = this,
        default_options = {
            /* Default options for UglifyJS, all possible options are listed here,
               see UglifyJS README for more information. */
            encoding : 'utf8',
            parse_strict_semicolons : false,
            mangle : true,
            mangle_options : { toplevel: false, except: [], defines: {} },
            lift_variables : false,
            squeeze : true,
            squeeze_options : { make_seqs: true, dead_code: true },
            options : {
                beautify: false,
                indent_start: 0,
                indent_level: 4,
                quote_keys: false,
                space_colon: false,
                ascii_only: false,
                inline_script: false
            }
        },
        prop;

    // Merge params options
//    for (prop in params) {
//        if (params.hasOwnProperty(prop)) {
//            default_options[prop] = params[prop];
//        }
//    }

    switch (this._state.get().type) {
        case State.TYPES.STRING:
            uglify(this._state.get().value, '', default_options, function(err, data) {
                if (err) {
                    status.emit('failed', 'jsminify', 'failed to minify string: ' + err);
                } else {
                    self._state.set(State.TYPES.STRING, data);
                    status.emit('complete', 'jsminify', 'minified string');
                }
            });
            break;

        case State.TYPES.STRINGS:
            var stringCount = stringCountTotal = this._state.get().value.length,
                uglified_strings = [];

            function uglifyStringBatchDone(stringcontents) {
                self._state.set(State.TYPES.STRINGS, stringcontents);
                status.emit('complete', 'jsminify', 'minified ' + stringCountTotal + ' string(s).');
            }

            function uglifyStringDone(err, data, filename) {
                if (err) {
                    uglified_strings.unshift(data);
                    status.emit('failed', 'Error minifying string: ' + err);
                } else {
                    uglified_strings.unshift(data);
                    if (!--stringCount) {
                        uglifyStringBatchDone(uglified_strings);
                    }
                }
            }

            this._state.get().value.forEach(function(str) {
                uglify(str, '', default_options, uglifyStringDone);
            });
            break;

        case State.TYPES.FILES:
            var fileCount = this._state.length,
                uglified_files = {};

            function uglifyBatchDone(filecontents) {
                // TODO: output to files?
                self._state.set(State.TYPES.STRINGS, filecontents);
                status.emit('complete', 'minify', 'Finished minifying');

            }

            function uglifyDone(err, data, filename) {
                // TODO: fail on error?
                uglified_files[filename] = data;
                if (!--fileCount) {
                    uglifyBatchDone(uglified_files);
                }
            }

            this._state.get().value.forEach(function(filename) {
                fs.readFile(filename, default_options.encoding, function(err, data) {
                    if (err) {
                        // Add file to fail listing
                        status.emit('failed', 'minify', err);
                    } else {
                        uglify(data, filename, default_options, uglifyDone);
                    }
                });
            });
            break;

        default:
            status.emit('failed', 'minify', 'unrecognised input type: ' + this._state.get().type);
            break;
    }
}

exports.tasks = {
    'jsminify' : {
        callback: jsminifyTask
    }
};