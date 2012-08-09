/**
 * supporting tasks for cloudhead/less.js (alexis sellier) including:
 * - basic css compression
 * - processing of .less files
 *
 * https://github.com/cloudhead/less.js
 *
 * @module tasks
 * @submodule less
 */

var State = require('../state'),
    less = require('less'),
    fs = require('fs');

function _lesscompress(params, status) {

    var self = this;
    var todo = this.state.length();
    var params = params || {};
    var paths = params.paths || [];

    this.state.forEach(function(name, value) {
        this.state.read(value, function(err, data) {
            if (err) {
                return status.emit('failed', 'cssminify', 'failed to read: ' + err);
            }

            var parser = new less.Parser({ paths: paths, filename: name });

            parser.parse(data, function(err, tree) {
                if (err) {
                    return status.emit('failed', 'cssminify', 'failed to parse: ' + name + ', reason: ' + err);
                }

                var generated = tree.toCSS({ compress: true });
                self.state.set(name, { string: generated });

                if (!--todo) {
                    return status.emit('complete', 'cssminify', 'completed LESS+Compress');
                }
            });
        }, this);
    }, this);
}

// TODO: DRY, this is basically the previous function with compress: false
function _less(params, status, logger) {

    var self = this;
    var todo = this.state.length();
    var params = params || {};
    var paths = params.paths || [];

    this.state.forEach(function(name, value) {
        this.state.read(value, function(err, data) {
            if (err) {
                return status.emit('failed', 'cssminify', 'failed to read: ' + err);
            }

            var parser = new less.Parser({ paths: paths, filename: name });

            parser.parse(data, function(err, tree) {
                if (err) {
                    return status.emit('failed', 'cssminify', 'failed to parse: ' + name + ', reason: ' + err);
                }

                var generated = tree.toCSS({ compress: false });
                self.state.set(name, { string: generated });

                if (!--todo) {
                    return status.emit('complete', 'cssminify', 'completed LESS+Compress');
                }
            });
        }, this);
    }, this);
}

exports.tasks = {
    // Less + Compress
    'cssminify' : _lesscompress,
    'lesscompress' : _lesscompress,
    // Just process LESS to regular CSS
    'less' : _less
};