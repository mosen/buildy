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
 * Default file rename function, renames the list of input items
 * before writing them according to the given rule(s).
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

// Task defaults
var defaults = {
    dest: null,
    prefix: '',
    suffix: '',
    fnRename: fnDefaultRename
};


function _write(params, status) {

    var task_parameters = {};

    if (!params) {
        task_parameters = defaults;
    } else {
        Object.keys(defaults).forEach(function(param) {
            task_parameters[param] = params[param] || defaults[param];
        });
    }

    if (this.state.length() === 1) { // Destination is assumed to be a filename. Unless it already exists and is a directory
        var item = this.state.item(0);
        var self = this;

        function doWrite() {
            self.state.write(task_parameters.dest, item, function(err) {
                if (err) {
                    return status.emit('failure', 'write', 'Could not write: ' + err);
                }

                return status.emit('complete', 'write', 'Wrote ' + task_parameters.dest);
            });
        }

        if (!fs.existsSync(path.dirname(task_parameters.dest))) {
            mkdirp(path.dirname(task_parameters.dest), function(err) {
                doWrite();
            });
        } else {
            doWrite();
        }


    } else { // Destination is assumed to be a directory, all items will be written underneath.
        var todo = this.state.length();

        this.state.forEach(function(name, value) {
            var basename; // filename without path.

            if (value.file) {
                basename = task_parameters.fnRename(path.basename(value.file), task_parameters.prefix, task_parameters.suffix);
            } else {
                basename = task_parameters.fnRename(name, task_parameters.prefix, task_parameters.suffix);
            }

            if (!fs.existsSync(path.dirname(task_parameters.dest))) {
                var self = this;

                mkdirp(path.dirname(task_parameters.dest), function(err) {
                    self.state.write(path.join(task_parameters.dest, basename), value, function(err) {
                        if (err) {
                            return status.emit('failure', 'write', 'Could not write: ' + err);
                        }

                        if (!--todo) {
                            return status.emit('complete', 'write', 'Items written.');
                        }
                    }, self);
                });
            } else {
                var self = this;

                self.state.write(path.join(task_parameters.dest, basename), value, function(err) {
                    if (err) {
                        return status.emit('failure', 'write', 'Could not write: ' + err);
                    }

                    if (!--todo) {
                        return status.emit('complete', 'write', 'Items written.');
                    }
                }, self);
            }


        }, this);
    }
}

exports.tasks = {
    'write' : _write
};