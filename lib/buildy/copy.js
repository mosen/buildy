var fs     = require('fs');
var path   = require('path');
var events = require('events');
var util   = require('util');
var mkdirp = require('mkdirp').mkdirp;

/**
 * Asynchronous copy, adapted from (https://github.com/piscis). Events are only used to
 * indicate status and not drive the functionality.
 *
 * The options parameter is an object containing the following possible properties:
 * - mkdir {Boolean}: Whether or not to create directories that do not exist, default is true
 * - mode {Integer}: When creating directories, which posix permissions to use.
 *
 * @class Copy
 * @constructor
 * @param {String} source Source file
 * @param {String} destination Destination file
 * @param {Function} callback Callback function(err, source, dest)
 * @param {Object} options Copy options
 */
function Copy(source, destination, callback, options) {
    var self = this;
    var mkdir = (options && options.mkdir === true) ? true : false;
    var chmod = (options && options.permissions) ? options.permissions : 0755;

    if (source === destination) {
        return callback('Source and destination are identical.');
    }

    fs.stat(source, function(err, sourceStats) {
        if (err) {
            return callback(err);
        }

        if (sourceStats.isDirectory()) {
            return callback('Source must be a full path to a file, not a directory.');
        }

        if (fs.existsSync(destination)) {
            self.transfer(source, destination, {}, callback);
        } else {
            var parent_directory = path.resolve(path.dirname(destination)); // mkdirp refuses to use relative paths

            if (!fs.existsSync(parent_directory) && mkdir === false) {
                callback('Destination does not exist and mkdir is false.');

            } else {
                var pathAbs = path.resolve(path.dirname(destination)); // mkdirp refuses to use relative paths

                mkdirp(pathAbs, chmod, function (err) {
                    if (err) {
                        callback('Could not create destination directory: ' + err, false, destination);
                        return;
                    }

                    self.transfer(source, destination, {}, callback);
                });
            }
        }
    });
}

util.inherits(Copy, events.EventEmitter);

/**
 * Pipe the contents of the source to the destination.
 *
 * @param {String} source The source filename.
 * @param {String} destination The destination filename.
 * @param {Object} options Options for the read and write streams.
 * @param {Function} callback The callback function (err, src, dst)
 */
Copy.prototype.transfer = function(source, destination, options, callback) {

    // TODO: Options passed to stream options
    var source_stream = fs.createReadStream(source);
    var destination_stream = fs.createWriteStream(destination);

    destination_stream.on('close', function() {
        callback(null, source, destination);
    });

    source_stream.pipe(destination_stream);
};

/**
 * Copy a single file to a destination.
 *
 * @method copy
 * @param source {String} source file
 * @param destination {String} destination file
 * @param callback {Function} callback
 * @return {Object} Instance of the copy object, which emits events related to copy status.
 * @public
 * @static
 */
var copy = module.exports = function copy(source, destination, callback, options) {
    return new Copy(source, destination, callback, options);
};