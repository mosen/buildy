var Buildy = require('buildy/lib/buildy').Buildy,
    path = require('path'),
    mkdirp = require('mkdirp').mkdirp,
    fs = require('fs');

/**
 * Write out the input to the destination filename.
 *
 * This can only apply to single string inputs.
 *
 * @param spec {Object} options containing .name (filename)
 * @param promise {EventEmitter}
 * @return {Object} Buildy.TYPES.FILES Buildy Task
 */
function writeTask(spec, promise) {
    var self = this,
        pathAbs = path.resolve(path.dirname(spec.name)),
        fnWriteFile = function fnWriteFile() {

            fs.writeFile(spec.name, self._state, 'utf8', function(err) {
                if (err) {
                    promise.emit('failed', 'write', err);
                } else {
                    self._state = [spec.name];
                    self._type = Buildy.TYPES.FILES;

                    promise.emit('complete', 'write', self._state.join(', '));
                }
            });
        };

    switch (this._type) {
        case Buildy.TYPES.STRING:
            path.exists(pathAbs, function(exists) {

                if (!exists) {
                    mkdirp(pathAbs, '0755', function(err) {
                        if (err) {
                            promise.emit('failed', err);
                            return;
                        }

                        fnWriteFile();
                    });
                } else {
                    fnWriteFile();
                }

            });
            break;

        default:
            promise.emit('failed', 'write', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'write' : {
        callback: writeTask
    }
};