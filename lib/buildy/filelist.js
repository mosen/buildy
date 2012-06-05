var fs   = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');
var glob = require('glob');

/**
 * The purpose of the Filelist module is to expand mixed lists of globs, directories and filenames into an array of
 * directories and filenames.
 *
 * @class Filelist
 * @constructor
 * @param items {Array} Items to process (globs, filenames, directories)
 * @param callback {Function} Callback function
 * @param options {Object} Filelist options
 */
function Filelist(items, callback, options) {

    /**
     * Items to process
     * @type {Array}
     * @private
     */
    this._pending = items instanceof Array ? items : [items];
    this._done = [];
    /**
     * Callback function
     * @type {Function}
     * @private
     */
    this._callback = callback;

    /**
     * File list generating options
     *
     * NOTE: Watch out for exclusions not being platform agnostic.
     * @type {Object}
     * @private
     */
    this._options = options || { "exclude" : [] };

    /**
     * File listing results
     * @type {Array}
     * @private
     */
    this._results = [];

    this.initialize();
}

util.inherits(Filelist, events.EventEmitter);

/**
 * Start generating the file listing.
 *
 * @method initialize
 */
Filelist.prototype.initialize = function() {
    var self = this;

    if (this._options.context) {
        this._originalCallback = this._callback;
        this._callback = function _fnAdjustContext() { this._originalCallback.apply(self._options.context, arguments); };
    }

    this._pending.forEach(function _eachPendingItem(fsitem) {
        this.add(fsitem, function _cbPendingItemDone(err, results) {
            if (err) {
                self._callback(err);
            } else {
                self._done.push(fsitem);
                self._results.push.apply( self._results, results);

                if (self._done.length === self._pending.length) {
                    self._callback(null, self._results);
                }
            }
        });
    }, this);
};

/**
 * Add an item to be processed.
 *
 * Self recursing until the result evaluates to a filename, or until it resolves to nothing.
 *
 * @param item String The filesystem item to add, which may be recursed
 * @param callback {Function} callback function
 */
Filelist.prototype.add = function(fsitem, callback) {
    var self = this;

    this.emit('add', fsitem);

    if (this.isExcluded(fsitem)) {
        this.emit('excluded', fsitem);
        callback(null, []);
    } // Item has been excluded explicitly or via regex.

    if (/(^!|^#|[?*])/.test(fsitem)) { // It's a glob

        this.emit('glob', fsitem);

        glob(fsitem, {}, function _cbGlobDone(err, matches) {
            if (err) {
                callback('failed to glob: ' + fsitem + ', reason: ' + err);
            } else {
                var matchCount = matches.length;
                var matchResults = [];

                matches.forEach(function _eachGlobMatch(m) {

                    self.add(m, function _cbMatchesAdded(err, results) {
                        matchResults.push.apply(matchResults, results);

                        if (!--matchCount) {
                            callback(null, matchResults);
                        }
                    });
                }, this);
            }
        });
    } else {
        fs.stat(fsitem, function(err, stats) {
            if (err) {
               callback('failed to stat: ' + fsitem + ', reason: ' + err);
               return;
            }

            if (stats.isDirectory()) {

                self.emit('dir', fsitem);

                fs.readdir(fsitem, function(err, files) {
                    if (err) {
                        callback('failed to read directory: ' + fsitem + ', reason: ' + err);
                    } else {
                        var fileCount = files.length;
                        var fileResults = [];

                        files.forEach(function _eachFileInDir(f) {
                            self.add( path.join(fsitem, f), function _cbFileInDirDone(err, results) {

                                fileResults.push.apply(fileResults, results);

                                if (!--fileCount) {
                                    callback(null, fileResults );
                                }
                            });
                        });
                    }
                });
                return;
            }

            if (stats.isFile()) {
                self.emit('file', fsitem);
                callback(null, [fsitem]);
            }
        });
    }
};

/**
 * Determine whether a given path has been specified as an exclusion.
 *
 * @param item {String} Path
 * @public
 */
Filelist.prototype.isExcluded = function(item) {

    var isExcluded = false;

    this._options.exclude.forEach(function _itemMatchesExclusion(excl) {
        if (excl instanceof RegExp) {
            if (excl.test(item)) {
                isExcluded = true;
            }
        } else {
            if (excl === item) {
                isExcluded = true;
            }
        }
    }, this);

    return isExcluded;
};

/**
 * Generate an expanded file listing from a list of files, directories and glob patterns.
 *
 * Options is an object with the following (optional) properties:
 *
 *   "exclude" : ["exact filename or directory name", /regexp matched against each item/]
 *   "context" : the 'this' object for the callback function
 *
 * @type {Function}
 * @param {Array} items Items that will be expanded to a complete file listing including filenames, directories and globs
 * @param {Function} callback Callback function
 * @param {Object} options (Reserved for future use)
 * @todo Options implements blacklisting
 * @public
 */
var filelist = module.exports = function filelist(items, callback, options) {
    return new Filelist(items, callback, options);
};