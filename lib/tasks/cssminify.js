/**
 * Minify the CSS input using cloudhead/less.js (alexis sellier)
 *
 * https://github.com/cloudhead/less.js
 *
 * TODO: only operates on single string at the moment.
 */

var State = require('buildy/lib/state'),
    fs = require('fs');

/*
 * Minify a css source file or string to a destination file or string using less.
 *
 * TODO: could also employ less in its intended usage, as a new task.
 *
 * @method cssMinify
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js', destFile: 'Filename.js' || no destination returns string value }
 * @param callback {Function}
 * @public
 */
function cssMinify(o, callback) {
    var less = require('less'),
        encoding = o.encoding || 'utf8',
        lessParser = new less.Parser,
        fnCssFileResult = function fnCssFileResult(err, data) {
            if (err) {
                callback(err); // Cant read CSS file
            } else {
                lessParser.parse(data, function(err, tree) {

                    if (err) {
                        callback(err); // Cant parse CSS file
                    } else {
                        var cssCompressed = tree.toCSS({compress: true});

                        if (o.destFile) {
                            fs.writeFile(o.destFile, cssCompressed, encoding, function(err) {
                                if (err) {
                                    callback(err); // Cant write CSS file
                                } else {
                                    callback(false, o.destFile);
                                }
                            });
                        } else {
                            callback(false, cssCompressed);
                        }
                    }
                });
            }
        };

    if (!(o.source || o.sourceFile)) {
        callback('No source or sourcefile was specified to be css minified.');

    } else {
        if (o.sourceFile) {
            fs.readFile(o.sourceFile, encoding, fnCssFileResult);
        } else if (o.source) {
            fnCssFileResult(false, o.source);
        }
    }
};

/**
 * CSS Minification task handler
 *
 * @todo support multiple strings
 * @method cssminify
 * @param spec {Object} CSS minify task configuration
 * @param promise {EventEmitter}
 * @protected
 */
function cssminifyTask(spec, promise) {
    var self = this;

    switch (this._state.get().type) {
        case State.TYPES.STRING:
            var fnMinifyCallback = function(err, data) {

                if (err) {
                    promise.emit('failed', 'cssminify', err);
                } else {
                    self._state.set(State.TYPES.STRING, data);
                    promise.emit('complete', 'cssminify', 'minified css string');
                }
            };

            cssMinify({ source: this._state.get().value }, fnMinifyCallback);
            break;

        default:
            promise.emit('failed', 'cssminify', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'cssminify' : {
        callback: cssminifyTask
    }
};