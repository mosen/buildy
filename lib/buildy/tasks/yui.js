/**
 * Perform build tasks closely related to YUI module production.
 *
 * Requires uglify-js to parse and extract module metadata.
 *
 * @module tasks
 * @submodule yui
 */

var State = require('../state'),
    util = require('util');

/**
 * Design notes:
 *
 * There were several options for extracting parameters from YUI.add() inside existing modules:
 * - node.js vm.runInContext vm.*withContext etc would be a good choice.
 * - eval() in-scope would be really bad as it could mess with the current scope (and globals).
 * - Function object constructor would restrict scope but MDN warns against this usage of Function.
 *
 * An AST parser was selected because of the ability to extract the information without executing code which might
 * otherwise clobber some variables.
 */

/**
 * Create a function that will match calls to yuivar.add()
 *
 * @param {String} [yuivar] The desired YUI global var, normally 'YUI'
 * @return {Function} Function that will match calls to yuivar.add()
 */
function makeYuiAddMatcher(yuivar) {

    yuivar = yuivar || 'YUI';

    /**
     * Used to determine whether an AST call structure is to YUIVAR.add().
     *
     * @method astIsYuiAddCall
     * @private
     * @param {Object} ast_object The abstract syntax tree, parsed for us by uglify-js
     * @return {Boolean} True if the value passed was a call to YUI.add
     */
    return function astIsYuiAddCall(ast_object) {

        return ast_object !== null &&
            ast_object !== undefined &&
            ast_object.length === 3 &&
            ast_object[0] == 'call' &&
            ast_object[1][0] == 'dot' &&
            ast_object[1][1][1] == yuivar &&
            ast_object[1][2] == 'add';
    }
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
    // TODO: our own AST walker which will generate an object instead of a string here.
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
 * @param {Function} fnCallIsMatching Function that returns true when the current ast structure matches its criteria.
 * @param {Function} fnMatchCallback Callback which will be called for each result.
 */
function astSearch(ast, fnCallIsMatching, fnMatchCallback) {
    ast.forEach(function eachAstObject(ast_object) {
        if (fnCallIsMatching(ast_object)) {
            fnMatchCallback(ast_object);
        } else {
            if (util.isArray(ast_object)) {
                astSearch(ast_object, fnCallIsMatching, fnMatchCallback);
            }
        }
    });
}

/**
 * Extract metadata from a string containing possible calls to YUI.add()
 *
 * @param {Object} params Parameters
 * @param {Function} params.matcher Function that will return true when the current AST structure matches a call
 * @param {String} params.source Javascript source to be processed
 * @param {Function} callback Callback as function(err, metadata)
 * @private
 */
function _yuiMetadataFromString(params, callback) {
    var parser = require("uglify-js").parser,
        ast, // parsed AST
        modules = [],
        matcher = params.matcher || makeYuiAddMatcher(),
        callbackMatch = function(ast_match) {
            var metadata = astMatchToObject(ast_match);
            modules.push(metadata);
        };

    try {
        ast = parser.parse(params.source);
        astSearch(ast, matcher, callbackMatch);

        callback(null, modules);

    } catch (e) {
        callback('Failed to parse AST, Exception:' + e.message);
    }
}

function yuiMetadataToJSON(metadata) {
    var json_strings = [];

    metadata.forEach(function eachMeta(module) {
        var loadstr = '"' + module.name + '" : ' + module.details;
        json_strings.push(loadstr);
    });

    return json_strings.join("\n");
}

/**
 * The main yui-meta task function
 *
 * @method yuiMetadataTask
 * @public
 * @param {Object} params Task parameters
 * @param {EventEmitter} status Task status emitter
 * @param {winston.Logger} logger instance
 */
function yuiMetadataTask(params, status, logger) {
    var yuivar = (params && params.yuivar) ? params.yuivar : 'YUI';
    var self = this;

    switch (this._state.get().type) {
        case State.TYPES.STRING:
            _yuiMetadataFromString({
                source: this._state.get().value,
                matcher: makeYuiAddMatcher(yuivar)
            }, function(err, data) {
                if (err) {
                    status.emit('failed', 'yui-meta', err);
                } else {
                    self._state.set(State.TYPES.STRING, yuiMetadataToJSON(data));
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