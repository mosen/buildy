
var filelist = require('./filelist');
var copy     = require('./copy');

/**
 * Copy a list of items recursively to a specified destination.
 *
 * @class CopyRecursive
 * @namespace buildy
 * @param sources {Array} Array of filenames, directories, and/or glob patterns.
 * @param destination {String} Destination directory
 * @param callback {Function} Callback function (err, results)
 * @param options {Object} Copy options
 * @constructor
 */
function CopyRecursive(sources, destination, callback, options) {

    /**
     * Items that can be parsed to generate filenames (globs, filenames, directories).
     *
     * @type {Array}
     * @private
     */
    this._sources = sources;

    /**
     * Destination item (directory, or single file).
     *
     * @type {String}
     * @private
     */
    this._destination = destination;

    /**
     * Callback function
     *
     * @type {Function}
     * @private
     */
    this._callback = callback;

    /**
     * Copy options, such as file exclusions.
     *
     * @type {Object}
     * @private
     */
    this._options = options || { exclude: [] };

    this.initialize();
}

/**
 * Start the recursive copy process.
 */
CopyRecursive.prototype.initialize = function() {
    filelist(this._sources, this._handleFileListing, this._options);
};

/**
 * Handle a file listing returned by the filelist module.
 * Starts processing of files.
 *
 * @param err
 * @param results
 * @private
 */
CopyRecursive.prototype._handleFileListing = function(err, results) {
    if (err) {
        this._callback(err);
    } else {
        this._callback('asd');
    }
};


/**
 * Copy a list of items recursively to a specified destination.
 *
 * @method copy_recursive
 * @param sources {Array} Array of filenames, directories, and/or glob patterns.
 * @param destination {String} Destination directory
 * @param callback {Function} Callback function (err, results)
 * @param options {Object} Copy options
 * @return {Cprf} Cprf object which emits events at various stage through the copy process.
 * @public
 * @static
 */
var copy_recursive = module.exports = function copy_recursive(sources, destination, callback, options) {
    "use strict";
    return new CopyRecursive(sources, destination, callback, options);
};