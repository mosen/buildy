var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');
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
     * @todo option to overwrite
     */
    this._options = options || { exclude: [] };

    this.initialize();
}

util.inherits(CopyRecursive, events.EventEmitter);

/**
 * Start the recursive copy process.
 */
CopyRecursive.prototype.initialize = function() {
    filelist(this._sources, this._handleFileListing, {
        exclude : this._options.exclude,
        context : this
    });
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
        this._initCopies(results, this._destination);
    }
};

/**
 * Start copying files that were returned from the file listing.
 *
 * @param sources {Array} source filenames
 * @param destination {String} destination directory or filename
 * @private
 */
CopyRecursive.prototype._initCopies = function(sources, destination) {
    var self = this;

    function _destPath(src, dst) {
        var path = require('path');
        var destinationExists = path.existsSync(dst);

        // Copy into dest dir
        // Copy over dest file
        if (destinationExists) {
            var destinationStats = fs.statSync(dst);

            if (destinationStats.isDirectory()) {
                return path.join(dst, path.basename(src));
            }

            if (destinationStats.isFile()) {
                // TODO: check if overwriting
                return dst;
            }
        } else {
            // if it doesnt exist and is a child of an existing directory, create file
            // if it doesnt exist and the dirname doesnt exist, mkdirp etc.
            var destinationDirExists = path.existsSync(path.dirname(dst));

            if (destinationDirExists) {
                return dst;
            } else {
                // TODO: mkdirp
            }
        }
    }

    sources.forEach(function _eachSource(source) {
        this.emit('copy', source, destination);
        copy(source, _destPath(source, destination), function _cbCopyDone() {
            self._handleCopyDone.apply(self, arguments);
        });
    }, this);
};

/**
 * Called when each individual item has finished copying.
 *
 * @param err {String} error object
 * @param src {String} copy source
 * @param dst {String} copy destination
 * @private
 */
CopyRecursive.prototype._handleCopyDone = function(err, src, dst) {
    this.emit('success', src, dst);
    this._callback(err, src, dst);
};



/**
 * Copy a list of items recursively to a specified destination.
 *
 * @method copy_recursive
 * @param sources {Array} Array of filenames, directories, and/or glob patterns.
 * @param destination {String} Destination directory
 * @param callback {Function} Callback function (err, results)
 * @param options {Object} Copy options
 * @return {CopyRecursive} object which emits events at various stages through the copy process.
 * @public
 * @static
 */
var copy_recursive = module.exports = function copy_recursive(sources, destination, callback, options) {
    return new CopyRecursive(sources, destination, callback, options);
};