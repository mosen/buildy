
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

/**
 * Start the recursive copy process.
 */
CopyRecursive.prototype.initialize = function() {
    this._initDestination();

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

CopyRecursive.prototype._initDestination = function() {

    var stats = fs.statSync(this._destination);
    if (stats.isDirectory()) {
        this._isDestDir = true;
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

    // TODO: currently not dealing with absolute source paths
    // attempts to append entire path to destination

//    var _mapDestPath = function (source) {
//        if (self._isDestDir) {
//            return path.join(self._destination, source);
//        } else {
//            return self._destination;
//        }
//    };

    // if the destination exists, and is a directory, then the real destination is destination + filename
    // if the destination does not exist, or is a file, copy file to file
    sources.forEach(function _forEachSource(src) {
        // TODO: source is always absolute due to filelist implementation
        // we cant know exactly whether the item was generated as a result of traversing
        // sub directories of a supplied source item. Therefore, filelist must be
        // capable of generating relative paths in order to deal with this.
//        copy(src, _mapDestPath(src), function _itemDone() {
//            self._handleCopyDone.apply(self, arguments);
//        });
    }, this);
};

CopyRecursive.prototype._handleCopyDone = function(err, src, dst) {
    console.log(err);
    console.log('Copied ' + src + ' to ' + dst);
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
 * @return {Cprf} Cprf object which emits events at various stage through the copy process.
 * @public
 * @static
 */
var copy_recursive = module.exports = function copy_recursive(sources, destination, callback, options) {
    return new CopyRecursive(sources, destination, callback, options);
};