"use strict";

var fs   = require('fs');
var path = require('path');
var glob = require('./glob');

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
    this._items = items;

    /**
     * Callback function
     * @type {Function}
     * @private
     */
    this._callback = callback;

    /**
     * File list generating options
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

    this._items.forEach(function(item) {
        this.add(item, function _itemDoneCallback(err, results) {
            if (err) {
                self._callback(err);
            } else {
                self._addResults(item, results);
                self.handleItemFinished(item);
            }
        });
    }, this);
};

/**
 * Add an item to be processed.
 *
 * Self recursing until the result evaluates to a filename, or until it resolves to nothing.
 *
 * @param item {String} The item to add
 * @param callback {Function} callback function
 */
Filelist.prototype.add = function(item, callback) {
    var self = this;

    if (/(^!|^#|[?*])/.test(item)) {

        var globber = glob.glob(item);

        globber.on('data', function _globberAddFilename(filename) {

            self.add(filename, function _itemDoneCallback(err, results) {
                if (err) {
                    self._callback(err);
                } else {
                    self._addResults(item, results);
                    self.handleItemFinished(filename);
                }
            });
        });

        globber.on('error', function _globberHandleError(err) {
            callback(err, []);
        });

        globber.on('end', function _globberHandleEnd(pattern) {
            callback(null, []);
        });
    } else {
        if (this.isExcluded(item)) {
            // TODO: feature that records excluded files.
            callback(null, []);
        } else {
            fs.stat(item, function(err, stats) {
                if (err) {
                   callback('Failed to stat: ' + err);
                   return;
                }

                if (stats.isDirectory()) { // TODO: dont traverse, just add dir
                    fs.readdir(item, function(err, files) {
                        if (err) {
                            callback('Failed to read directory: ' + item + ', reason: ' + err);
                        } else {
                            var _mapParentDirectory = function _mapParentDirectory(filename) {
                                return path.join(item, filename);
                            };

                            if (files.length > 0) {
                                files.map(_mapParentDirectory).forEach(function(subItem) {
                                    // Each subdirectory item starts a new item for processing
                                    this._items.push(subItem);
                                    this.add(subItem, function _itemDoneCallback(err, results) {
                                        if (err) {
                                            self._callback(err);
                                        } else {
                                            self._addResults(item, results);
                                            self.handleItemFinished(item);
                                        }
                                    });
                                }, self);
                                // TODO: Note that callback gets called before the entire directory is processed
                                // Consider a different design where the callback is only called upon completion of all
                                // subdirectory items.
                                callback(null, []);
                            } else {
                                callback(null, []);
                            }
                        }
                    });
                    return;
                }

                if (stats.isFile()) {
                    callback(null, [item]);
                }

                // TODO: warning, specified item does not exist
            });
        }
    }
};

/**
 * Add a generated result to the results list.
 *
 * @param request {String} Original source item
 * @param results {Array} File listing returned for that item
 * @private
 */
Filelist.prototype._addResults = function(request, results) {
    results.forEach(function(result) {
        this._results.push(result);
    }, this);
};

/**
 * Handler for when a requested item has finished processing
 * @param item {String} The requested item to parse
 */
Filelist.prototype.handleItemFinished = function(item) {
    var itemIndex = this._items.indexOf(item);

    this._items.splice(itemIndex, 1);

    if (this._items.length === 0) {
        this._callback(null, this._results);
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