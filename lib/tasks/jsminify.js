var Buildy = require('buildy/lib/buildy').Buildy,
    fs = require('fs');

/**
 * Minify the input using uglify
 *
 * @method minify
 * @param o {Object} Minify parameters:
 *  o.source - source code as string
 *  o.sourceFile - source filename
 *  o.destFile - destination file to be written, otherwise the first argument to the complete
 *  o.encoding - file encoding [default 'utf8']
 *  event will be the output string.
 * @param callback {Function} Callback when done
 */
function jsminify(o, callback) {

    var min = function(o, callback) {

        var jsp = require("uglify-js").parser,
            pro = require("uglify-js").uglify,
            encoding = o.encoding || 'utf8',
            ast;

        try {
            ast = jsp.parse(o.source); // parse into syntax tree
            ast = pro.ast_mangle(ast);
            ast = pro.ast_squeeze(ast);
        } catch (e) {
            callback('The minify task failed, most likely the source file was unparseable. Please check your syntax. Error: ' + e.message);
            return;
        }

        if (!o.destFile) {
            callback(false, pro.gen_code(ast));
        } else {
            fs.writeFile(o.destFile, pro.gen_code(ast), encoding, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(false, o.destFile);
                }
            });
        }
    };

    if (o.sourceFile) {
        fs.readFile(o.sourceFile, encoding, function(err, data) {
            if (err) {
                callback(err);
            } else {
                delete o.sourceFile;
                o.source = data;
                min(o, callback);
            }
        });
    } else if (o.source) {
        min(o, callback);
    } else {
        callback('No source or sourcefile was specified to be minified.');
    }
};

/**
 * Minify the input (JavaScript)
 *
 * @method minify
 * @param spec {Object} Minify task configuration
 * @param promise {EventEmitter}
 * @protected
 */
function jsminifyTask(spec, promise) {
    var self = this;

    switch (this._type) {
        case Buildy.TYPES.STRING:
            var fnMinifyCallback = function(err, output) {
                if (err) {
                    promise.emit('failed', 'minify', err);
                } else {
                    self._state = output;
                    promise.emit('complete', 'minify', 'string minified');
                }
            }

            jsminify({source: this._state}, fnMinifyCallback);
            break;

        case Buildy.TYPES.STRINGS:
            var stringsLeft = this._state.length,
                outputStrings = [],
                fnMinifyCallback = function(err, output) {
                    if (err) {
                        promise.emit('failed', 'minify', err);
                    } else {
                        outputStrings.push(output);
                        stringsLeft--;

                        if (stringsLeft < 1) {
                            self._state = outputStrings;
                            promise.emit('complete', 'minify', 'minified ' + this._state.length + ' strings');
                        }
                    }
                };

            this._state.forEach(function(s) {
                utils.minify({source: s}, fnMinifyCallback);
            });
            break;

        case Buildy.TYPES.FILES:
            var fileCount = this._state.length,
                fileDone = 0;

            this._state.forEach(function(f) {
                utils.minify({sourceFile: f}, function(err, output) {
                    if (err) {
                        promise.emit('failed', 'minify', err);
                    } else {
                        fileDone++;
                        if (fileDone == fileCount) {
                            promise.emit('complete', 'minify', this._state.join(', '));
                        }
                    }
                });
            });
            break;

        default:
            promise.emit('failed', 'minify', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'minify' : {
        callback: jsminifyTask
    }
};