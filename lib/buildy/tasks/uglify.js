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
 *
 * @module tasks
 * @submodule uglify
 */

var State = require('../state'),
    fs = require('fs');

var parser = require("uglify-js").parser,
    pro = require("uglify-js").uglify;

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
 * @method _uglify
 * @param params {Object} Minify task options
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
function _uglify(params, status) {
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
        };

    var options = params || default_options; // TODO: Merge defaults
    var todo = this.state.length();

    this.state.forEach(function(name, value) {
        this.state.read(value, function(err, data) {
            if (err) {
                return status.emit('failed', 'uglify', 'Could not read: ' + err);
            }

            var uglified = null;

            try {
                var ast = parser.parse(data, options.parse_strict_semicolons);

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
            } catch (e) {
                return status.emit('failed', 'uglify', 'Failed generating minified version, usually a syntax error: ' + e.message);
            }

            if (uglified) {
                this.state.set(name, { string: uglified });
            }

            if (!--todo) {
                return status.emit('complete', 'uglify', 'uglify complete');
            }

        }, this);
    }, this);
}

exports.tasks = {
    'jsminify' : _uglify, // Backwards compat.
    'uglify' : _uglify
};