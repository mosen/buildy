var cprf      = require('buildy/lib/cprf').cprf;

/**
 * Copy a number of sources to a destination
 * (Supports wildcard matching and exclusion list)
 *
 * spec {
 *  src : [ 'file', 'directory', 'file.*', 'directory/*' ],
 *  dest : '/absolute/or/relative/path',
 *  recursive : true, false
 *  excludes : [ 'excludedfile', 'excluded/directory/' ] - wildcards currently not supported
 * }
 *
 * @method copy
 * @param spec {Object} task specification
 * @param promise {EventEmitter} task promise
 */
function copyTask(spec, promise) {
    cprf(spec.src, spec.dest, function() {
        promise.emit('complete', 'copy', spec);
    }, {
        recursive : spec.recursive || false,
        excludes  : spec.excludes || []
    });
}

exports.tasks = {
    'copy' : {
        callback: copyTask
    }
};