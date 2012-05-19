"use strict";

var fs   = require('fs');
var path = require('path');

/**
 * The purpose of the Filelist module is to expand mixed lists of globs and filenames into an array.
 *
 * @class Filelist
 * @constructor
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
    this._options = options || {};

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

    this._items.forEach(function(item) {
        this.add(item, function _itemDoneCallback(err, results) {
            if (err) {
                self._callback(err);
            } else {
                self._addResults(results);
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
        console.log('Not implemented: globbing');
        //self._addGlob(item, self.handleGlobDone);
    } else {
        fs.stat(item, function(err, stats) {
            if (err) {
               callback('Failed to stat: ' + err);
               return;
            }

            if (stats.isDirectory()) {
                fs.readdir(item, function(err, files) {
                    if (err) {
                        callback('Failed to read directory: ' + item + ', reason: ' + err);
                        return;
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
                                        self._addResults(results);
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
                return;
            }

            // TODO: warning, specified item does not exist
        });
    }
};

/**
 * Add a generated result to the results list.
 *
 * @param {String} req
 * @private
 */
Filelist.prototype._addResults = function(results) {
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
 * Generate an expanded file listing from a list of files, directories and glob patterns.
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