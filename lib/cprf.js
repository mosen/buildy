/**
 * Asynchronous recursive copy, with exclusions.
 *
 * The Cprf object takes an array of source files and glob patterns to match.
 * file names and expanded glob lists are started immediately (before the glob
 * matching is finished), recursive discovery of files also happens
 * asynchronously.
 *
 * Example:
 *
 * var myCopy = new Cprf([FILE, GLOB...], DIR | FILE, Callback, { 
 *      recursive : true,
 *      excludes  : ['FILE']
 * });
 *
 * TODO: overwrite option true/false
 */
var events = require('events'),
    util   = require('util'),
    fs     = require('fs'),
    path   = require('path'),
    mkdirp = require('mkdirp').mkdirp,
    glob   = require('./glob');

/**
 * Asynchronous copy, adapted from (https://github.com/piscis). Events are only used to
 * indicate status and not drive the functionality.
 *
 * @class Copy
 * @param src {String} Source file
 * @param dst {String} Destination file
 * @param callback {Function} Callback
 * @constructor
 */
var Copy = function copy(src, dst, callback) {
    var self = this;

    if(!callback) {
        callback = function(){};
    }

    self.on('error', function(err) {
        callback(err);
    });

    /**
     * Verify that the source exists.
     *
     * @method _validateSource
     * @private
     */
    function _validateSource() {
        path.exists(src, function(src_exists) {
            if(!src_exists) {
                self.emit('error', new Error(src + ' does not exist. Nothing to be copied'));
                return;
            }

            _validateDest();
        });
    }

    /**
     * Verify that the destination exists, or create it if not.
     * TODO: option to fail if the destination does not exist
     *
     * @method _validateDest
     * @private
     */
    function _validateDest() {
        path.exists(path.dirname(dst), function(dst_exists) {
            if (!dst_exists) {
                // mkdirp refuses to use relative paths
                var pathAbs = path.resolve(path.dirname(dst));

                mkdirp(pathAbs, 0755, function(err) {
                    if (err) {
                        self.emit('error', err);
                        return;
                    }

                    _validateFiles();
                });
            } else {
                _validateFiles();
            }
        });
    }

    /**
     * Validate the source as a file. not a directory. And make sure that source and destination are not
     * identical.
     *
     * @method _validateFiles
     * @private
     */
    function _validateFiles() {
        fs.stat(src, function(err, stat) {

            if(err) {
                self.emit('error', err);
                return;
            }

            if(stat.isDirectory()) {
                self.emit('error', new Error(src + ' is a directory. It must be a file'));
                return;
            }

            if(src == dst) {
                self.emit('error', new Error(src + ' and ' + dst + 'are identical'));
                return;
            }

            _openInputFile();
        });
    }

    /**
     * Open the input file for reading.
     *
     * @method _openInputFile
     * @private
     */
    function _openInputFile() {
        fs.open(src, 'r', function(err, infd) {

            if(err) {
                self.emit('error', err);
                return;
            }

            _openOutputFile(infd);
        });
    }

    /**
     * Open the output file for writing.
     *
     * @param infd File descriptor of the input file
     * @method _openOutputFile
     * @private
     */
    function _openOutputFile(infd) {
        fs.open(dst, 'w', function(err, outfd) {

            if(err) {
                self.emit('error', err);
                return;
            }

            _sendFile(infd, outfd);
        });
    }

    /**
     * Send data from the input file to the output file.
     *
     * @param infd File descriptor of the input file.
     * @param outfd File descriptor of the output file.
     * @private
     */
    function _sendFile(infd, outfd) {
        fs.fstat(infd, function(err, stat) {

            if(err) {
                self.emit('error', err);
                return;
            }

            fs.sendfile(outfd, infd, 0, stat.size, function() {
                _closeFiles([infd, outfd]);
                callback();
            });
        });
    }

    /**
     * Close both file descriptors.
     *
     * @param fds {Array} Array of file descriptors open from the copy operation.
     * @private
     */
    function _closeFiles(fds) {
        fds.forEach(function(fd) {
            fs.close(fd, function(err) {
                if (err) { return self.emit('error', err); }
            });
        });

        self.emit('done', src, dst);
    }

    // Kick off the copy process with source validation
    _validateSource();
};

util.inherits(Copy, events.EventEmitter);

/**
 * Copy a single file to a destination
 *
 * @method copy
 * @param src {String} source file
 * @param dst {String} destination file
 * @param callback {Function} callback
 * @return {Object} Instance of the copy object, which is an EventEmitter.
 * @public
 * @static
 */
exports.copy = function(src, dst, callback) {
    return new Copy(src, dst, callback);
};


/**
 * Copy source to destination recursively, using the Copy object.
 * Individual file copy operations are completed asynchronously.
 *
 * @class Cprf
 * @constructor
 * @param callback {Function} Callback which will be executed upon completion.
 * @param options {Object} Copy options
 */
function Cprf(callback, options) {

    var self = this; // Necessary to correct scope inside async functions without using .call .apply
    events.EventEmitter.call(this);

    /**
     * List of copy operations pending.
     *
     * @property _pendingOperations
     * @type {Array}
     */
    this._pendingOperations = [];

    /**
     * Callback executed on completion.
     *
     * @property _callback
     * @type {Function}
     */
    this._callback = callback = callback || function(){};

    /**
     * Options
     *
     * excludes : [], An array of path and filename exclusions, these will not be copied.
     * recursive : true | false, Whether to traverse subdirectories when copying.
     *
     * @property _options
     * @type {Object}
     */
    this._options = options = options || { excludes: [], recursive: false };


    /**
     * Results of copy operations
     *
     * @property results
     * @type {Object} with 2 properties 'failed' : [], 'complete' : []
     */
    this.results = { failed: [], complete: [] };

    /**
     * Error event
     *
     * @event error
     * @param err {Error} Error object
     */
    self.on('error', function(err) {
        callback(err);
    });
}

util.inherits(Cprf, events.EventEmitter);

/**
 * Check a file or directory against the exclusion list, used with Array.map
 *
 * @method isNotExcluded
 * @param filename {String} File or directory name
 * @return {Boolean} true if the file does NOT exist in the exclusion list
 */
Cprf.prototype.isNotExcluded = function isNotExcluded(filename) {
    return (this._options.excludes.indexOf(filename) === -1);
};

/**
 * Parse a list of source files, directories and globs and add copy tasks for
 * each to the given destination.
 *
 * @todo make sure single file copy works here
 * @method parse
 * @param sources {Array} filenames, directories and globs/wildcards
 * @param destination {String} destination directory
 */
Cprf.prototype.parse = function parse(sources, destination) {
    var self = this,
        isNotExcluded = function(item) { return self.isNotExcluded.call(self, item); };

    sources.forEach(function eachCopyItem(item) {

        // Generate listing of files to copy
        if (/(^!|^#|[?*])/.test(item)) {
            // Globs currently not supported
            //throw new TypeError('Globs are currently not supported');

            var newGlob = glob.glob(item);

            newGlob.on('data', function(filename) {
                self.add([filename], destination);
            });

            newGlob.on('error', function(err) {
                self.emit('warning', err);
            });

            newGlob.on('end', function(pattern) {

            });
        } else {
            if (isNotExcluded(item)) {
                this.add([item], destination);
            }
        }

    }, this);

    // TODO: does not take into account async globs returning late
    /**
     * @event parseDone
     */
    this.emit('parseDone');
};

/**
 * Add a file or directory to the copy queue.
 *
 * @todo Check that destination can be single file
 *
 * @method add
 * @param fs_items {Array} Array of source dirs and files.
 * @param dest {String} Destination directory
 */
Cprf.prototype.add = function add(fs_items, dest) {
    var self = this;

    fs_items.forEach(function eachFile(fs_item) {
        if (self.isNotExcluded(fs_item)) {
            fs.stat(fs_item, function callbackStat(err, stat) {
                if (err) { // If we cant even stat, just disregard the file with warning.
                    return self.emit('warning', err);
                }

                if (stat.isDirectory()) {
                    /**
                     * @event traversed
                     * @param {String} fs_item Directory being traversed
                     */
                    self.emit('traversed', fs_item);

                    fs.readdir(fs_item, function(err, files) {
                        var appendDir = function appendDir(child) {
                            return path.join(fs_item, child);
                        };

                        if (err) {
                            return self.emit('warning', err);
                        }

                        if (files.length > 0) {
                            self.add(files.map(appendDir), path.join(dest, path.basename(fs_item)));
                        }
                        // TODO: consider mkdir even on empty dirs?
                    });
                } else {
                    self.copy(fs_item, path.join(dest, path.basename(fs_item)));
                }
            });
        } else {
            /**
             * @event excluded
             * @param {String} fs_item Directory or file that was excluded
             */
            self.emit('excluded', fs_item);
        }
    });
};

/**
 * Copy a single item from source to destination
 *
 * @method copy
 * @param source {String} absolute filename of source
 * @param destination {String} absolute filename of destination
 */
Cprf.prototype.copy = function copy(source, destination) {

    var copyPromise = new events.EventEmitter(),
        self = this;

    copyPromise.on('complete', function() { self._onTaskComplete.apply(self, [false, copyPromise, source, destination]); });
    copyPromise.on('failed', function() { self._onTaskComplete.apply(self, [true, copyPromise, source, destination]); });

    this._pendingOperations.push(copyPromise);

    /**
     * @event fileStart
     * @param source {String} absolute filename
     * @param destination {String} absolute filename
     */
    this.emit('fileStart', source, destination);

    var operation = new Copy(source, destination, function onCopied(err) {
        if (err) {
            copyPromise.emit('failed', err);
        } else {
            copyPromise.emit('complete');
        }
    });
};

/**
 * Handle the completion of a copy task by removing it from the queue
 *
 * @method _onTaskComplete
 * @param status {Boolean} Whether the copy task completed or failed. true|false
 * @param status {EventEmitter} copy task status that has fired complete.
 * @param source {String} Absolute path to source file
 * @param destination {String} Absolute path to destination file
 * @protected
 */
Cprf.prototype._onTaskComplete = function _onTaskComplete(err, status, source, destination) {
    this._pendingOperations.splice(this._pendingOperations.indexOf(status), 1);

    if (err) {
        /**
         * @event fileFailed
         * @param source {String} absolute filename
         * @param destination {String} absolute filename
         */
        this.emit('fileFailed', source, destination);

        this.results.failed.unshift({ source: source, destination: destination });
    } else {
        /**
         * @event fileComplete
         * @param source {String} absolute filename
         * @param destination {String} absolute filename
         */
        this.emit('fileComplete', source, destination);

        this.results.complete.unshift({ source: source, destination: destination });
    }

    this._checkOperationsDone();
};

/**
 * Check if all of the pending operations have finished.
 *
 * @method _checkOperationsDone
 */
Cprf.prototype._checkOperationsDone = function _checkOperationsDone() {
    var numOperations = this._pendingOperations.length;

    /**
     * @event operationCount
     * @param numOperations {Integer} number of operations pending
     */
    this.emit('operationCount', numOperations);

    if (numOperations === 0) {
        this.emit('complete');
        this._callback(null, this.results);
    }
};

/**
 * Copy a list of sources to a destination
 *
 * @method cprf
 * @param sources {Array} Array of filenames, directories, and glob patterns.
 * @param destination {String} Destination directory
 * @param callback {Function} Callback function which takes err, results['complete'] = [ { source:, destination: } ], results['failed'] = ...
 * @param options {Object} Hash of copy options
 * @return {Cprf} Cprf object which emits events at various stage through the copy process.
 * @public
 * @static
 */
exports.cprf = function cprf(sources, destination, callback, options) {
    var cprf = new(Cprf)(callback, options);
    cprf.parse(sources, destination);

    return cprf;
};