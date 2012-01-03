var State = require('buildy/lib/state').State,
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
 * @return {Object} State.TYPES.FILES State Task
 */
function writeTask(spec, promise) {
    var self = this,
        pathAbs = path.resolve(path.dirname(spec.name)),
        fnWriteFile = function fnWriteFile() {

            fs.writeFile(spec.name, self._state.get().value, 'utf8', function(err) {
                if (err) {
                    promise.emit('failed', 'write', err);
                } else {
                    self._state.set(State.TYPES.FILES, [ spec.name ]);
                    promise.emit('complete', 'write', self._state.get().value.join(', '));
                }
            });
        };

    switch (this._state.get().type) {
        case State.TYPES.STRING:
            path.exists(pathAbs, function(exists) {

                if (!exists) {
                    mkdirp(pathAbs, '0755', function(err) {
                        if (err) {
                            promise.emit('failed', 'write', err);
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