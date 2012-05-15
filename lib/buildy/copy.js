/**
 * Extras related to dealing with the filesystem
 */
var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');
var mkdirp = require('mkdirp').mkdirp;


/**
 * Asynchronous copy, adapted from (https://github.com/piscis). Events are only used to
 * indicate status and not drive the functionality.
 *
 * This object only emits 'error' when the copy is aborted, and 'done' when a copy is done (but before the callback)
 *
 * The options parameter is an object containing the following possible properties:
 * - mkdir {Boolean}: Whether or not to create directories that do not exist, default is true
 * - mode {Integer}: When creating directories, which posix permissions to use.
 *
 * @class Copy
 * @namespace buildy
 * @param {String} src Source file
 * @param {String} dst Destination file
 * @param {Function} callback Callback function(err, source, dest)
 * @param {Object} options Copy options
 * @constructor
 */
function Copy(src, dst, callback, options) {
    var self = this;

    if (!callback) {
        callback = function(){};
    }

    /**
     * Verify that the source exists.
     *
     * @method _validateSource
     * @private
     */
    function _validateSource() {
        path.exists(src, function(src_exists) {
            if (!src_exists) {
                callback('Source ' + src + ' does not exist. Nothing to be copied');
                return;
            }

            _validateDest();
        });
    }

    /**
     * Verify that the destination exists, or create it if not.
     *
     * @method _validateDest
     * @private
     */
    function _validateDest() {
        path.exists(path.dirname(dst), function(dst_exists) {
            if (!dst_exists) {
                if (options && options.mkdir === false) {
                    callback('Destination ' + dst + ' does not exist, and mkdir is false. aborting copy');
                    return;
                } else {

                    // mkdirp refuses to use relative paths
                    var pathAbs = path.resolve(path.dirname(dst));
                    var permissions = 0755;

                    if (options && options.permissions) {
                        permissions = options.permissions;
                    }

                    mkdirp(pathAbs, permissions, function(err) {
                        if (err) {
                            callback('Could not create destination directory: ' + err)
                            return;
                        }

                        _validateFiles();
                    });
                }
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

            if (err) {
                callback(err);
                return;
            }

            if (stat.isDirectory()) {
                callback('Source ' + src + ' is a directory. It must be a file');
                return;
            }

            if (src === dst) {
                callback('Source ' + src + ' and destination ' + dst + ' are identical');
                return;
            }

            if (stat.isFile()) {
                _openInputFile();
            } else {
                callback('Copying of sockets, pipes, and devices is not supported: ' + src);
            }
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

            if (err) {
                callback('Error opening source file for read: ' + err);
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
                callback('Error opening destination for write: ' + err);
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
                callback(err)
                return;
            }

            // TODO: check validity of using sendfile/util.pump etc from v0.4 upto v0.6
            fs.sendfile(outfd, infd, 0, stat.size, function() {
                _closeFiles([infd, outfd]);
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
                if (err) {
                    callback(err);
                    return;
                }
            });
        });

        self.emit('done', src, dst);
        callback(null, src, dst);
    }

    // Kick off the copy process with source validation
    _validateSource();
}

util.inherits(Copy, events.EventEmitter);

/**
 * Copy a single file to a destination.
 *
 * @method copy
 * @param src {String} source file
 * @param dst {String} destination file
 * @param callback {Function} callback
 * @return {Object} Instance of the copy object, which emits events related to copy status.
 * @public
 * @static
 */
var copy = module.exports = function copy(src, dst, callback, options) {
    return new Copy(src, dst, callback, options);
};