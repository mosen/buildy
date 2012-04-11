/**
 * Perform build tasks closely related to YUI module production
 *
 * @module tasks
 * @submodule yui
 */

var State = require('../state'),
    util = require('util');

/**
 * Used to determine whether an AST call structure is to YUIVAR.add().
 *
 * @method astIsYuiAddCall
 * @private
 * @param {Object} ast_object The abstract syntax tree, parsed for us by uglify-js
 * @return {Boolean} True if the value passed was a call to YUI.add
 */
function astIsYuiAddCall(ast_object) {
    var yuiVar = 'YUI';

    return ast_object !== null &&
           ast_object !== undefined &&
           ast_object.length === 3 &&
           ast_object[0] == 'call' &&
           ast_object[1][0] == 'dot' &&
           ast_object[1][1][1] == yuiVar &&
           ast_object[1][2] == 'add';
}

/**
 * Convert an AST call structure containing a YUI.add call to an object containing metadata properties.
 *
 * @method astMatchToObject
 * @private
 * @param {Object} ast_match Matching AST call structure
 * @return {Object} Object containing metadata properties
 */
function astMatchToObject(ast_match) {
    var call_params = ast_match[2],
        metadata = {
            name: call_params[0][1],
            version: call_params[2][1], // Note: parameters are in pairs of [ type, value ] hence the [1]
            details: {}
        },
        call_params_details = call_params[3][1];

    var pro = require("uglify-js").uglify;

    // Details should be produced via the same method as uglify-js' pro.gen_code in order to preserve all possible
    // properties.

    // For the moment we use an uglify generated string for all details.
    // TODO: our own AST walker which will generate an object.
    metadata.details = pro.gen_code(call_params[3], { beautify: true });

    return metadata;
}

/**
 * Search the syntax tree for calls to YUI.add.
 *
 * This function is called recursively to walk the tree. This ensures that
 * nested YUI.add calls are picked up.
 *
 * @param {Object} ast Abstract syntax tree from uglify-js parser.
 * @param {Function} fnMatchCallback Callback which will be called for each result.
 */
function astSearch(ast, fnMatchCallback) {
    ast.forEach(function eachAstObject(ast_object) {
        if (astIsYuiAddCall(ast_object)) {
            fnMatchCallback(ast_object);
        } else {
            if (util.isArray(ast_object)) {
                astSearch(ast_object, fnMatchCallback);
            }
        }
    });
}

function _yuiMetadataFromString(source, callback) {
    var parser = require("uglify-js").parser,
        ast, // parsed AST
        modules = [],
        callbackMatch = function(ast_match) {
            var metadata = astMatchToObject(ast_match);
            modules.push(metadata);
        };

    try {
        ast = parser.parse(source);
        astSearch(ast, callbackMatch);

        callback(null, modules);

    } catch (e) {
        callback('Failed to parse AST Exception:' + e.message);
    }
}

function yuiMetadataTask(params, status, logger) {
    switch (this._state.get().type) {
        case State.TYPES.STRING:
            _yuiMetadataFromString(this._state.get().value, function(err, data) {
                if (err) {
                    status.emit('failed', 'yui-meta', err);
                } else {
                    status.emit('complete', 'yui-meta', 'Got YUI metadata');
                }
            });
            break;

        default:
            status.emit('failed', 'yui-meta', 'unrecognised input type: ' + this._state.get().type);
            break;
    }
}

var tasks = module.exports.tasks = {
    'yui-meta' : {
        callback: yuiMetadataTask
    }
};