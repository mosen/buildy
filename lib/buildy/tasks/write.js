/**
 * Write the input to the specified output.
 *
 * @module tasks
 * @submodule write
 */

var State  = require('../state'),
    path   = require('path'),
    mkdirp = require('mkdirp').mkdirp,
    fs     = require('fs');

/**
 * Default file rename function, called when the input is a list of items.
 *
 * @param {String} name Filename without full path
 * @param {String} prefix [optional] File prefix
 * @param {String} suffix [optional] File suffix, before the extension
 */
var fnDefaultRename = function(name, prefix, suffix) {
    var extname = path.extname(name);
    var basename = path.basename(name, extname);

    return (prefix + basename + suffix + extname);
};

function _write(params, status) {

    var destination = params && params.dest || null;
    var prefix = params && params.prefix || '';
    var suffix = params && params.suffix || '';
    var fnRename = params && params.fnRename || fnDefaultRename; // fnRename overrides suffix and prefix settings

    if (this.state.length() === 1) { // Destination is assumed to be a filename. Unless it already exists and is a directory
        var item = this.state.item(0);

        this.state.write(destination, item, function(err) {
            if (err) {
                return status.emit('failure', 'write', 'Could not write: ' + err);
            }

            return status.emit('complete', 'write', 'Wrote ' + destination);
        });
    } else { // Destination is assumed to be a directory, all items will be written underneath.
        var todo = this.state.length();

        this.state.forEach(function(name, value) {
            var basename; // filename without path.

            if (value.file) {
                basename = fnRename(path.basename(value.file), prefix, suffix);
            } else {
                basename = fnRename(name, prefix, suffix);
            }

            this.state.write(path.join(destination, basename), value, function(err) {
                if (err) {
                    return status.emit('failure', 'write', 'Could not write: ' + err);
                }

                if (!--todo) {
                    return status.emit('complete', 'write', 'Items written.');
                }
            }, this);
        }, this);
    }
}

exports.tasks = {
    'write' : _write
};