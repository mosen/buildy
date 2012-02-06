/**
 * Copy the input to a destination
 *
 * Uses cprf/node-glob-async
 */

var cprf      = require('buildy/lib/cprf').cprf,
    State     = require('buildy/lib/state');

/**
 * Copy a number of sources to a destination
 * (Supports wildcard matching and exclusion list)
 *
 * params {
 *  src : [ 'file', 'directory', 'file.*', 'directory/*' ],
 *  dest : '/absolute/or/relative/path',
 *  recursive : true, false
 *  excludes : [ 'excludedfile', 'excluded/directory/' ] - wildcards currently not supported
 * }
 *
 * @method copy
 * @param params {Object} task paramsification
 * @param status {EventEmitter} task status
 */
function copyTask(params, status) {
    var source = params && params.src || null,
        destination = params && params.dest || null,
        recursive = params && params.recursive || true,
        excludes = params && params.excludes || [],
        self = this;

    switch (this._state.get().type) {

        case State.TYPES.FILES:
            if (source === null) {
                source = this._state.get().value;
            }
            break;

        case State.TYPES.STRINGS:
            if (source === null) {
                source = this._state.get().value;
            }
            break;

        case State.TYPES.STRING:
            if (source === null) {
                source = [];
                source.push( this._state.get().value );
            }
            break;

        default:
            break;
    }

    cprf(source, destination, function(err, results) {
        var copied = [];

        results.complete.forEach(function(copyResult) {
            copied.unshift(copyResult.destination);
        });

        self._state.set(State.TYPES.FILES, copied);

        status.emit('complete', 'copy', copied.join(', '));
    }, {
        recursive : recursive,
        excludes  : excludes
    });
}

exports.tasks = {
    'copy' : {
        callback: copyTask
    }
};