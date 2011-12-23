var Buildy = require('buildy/lib/buildy').Buildy;


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
 * Minify the input (CSS) using Less
 *
 * @todo support multiple strings
 * @method cssminify
 * @param spec {Object} CSS minify task configuration
 * @param promise {EventEmitter}
 * @protected
 */
function cssminifyTask(spec, promise) {
    var self = this;

    switch (this._type) {
        case Buildy.TYPES.STRING:
            var fnMinifyCallback = function(err, data) {

                if (err) {
                    promise.emit('failed', 'cssminify', err);
                } else {
                    self._state = data;
                    promise.emit('complete', 'cssminify', 'minified css string');
                }
            };

            cssMinify({ source: this._state }, fnMinifyCallback);
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