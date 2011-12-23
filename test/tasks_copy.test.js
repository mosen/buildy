/**
 * Built in task test case - copy
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');

module.exports = {
    // TODO: this is still failing with no assertion tested.
    'test copy' : function(beforeExit, assert) {
        var q = new queue.Queue('test-copy')
            destDir = __dirname + '/temp';

        q.task('copy', { src: [ __dirname + '/fixtures/*' ], dst: destDir });
        q.run();

        beforeExit(function() {
            path.exists(destDir, function(exists) {
                assert.ok(exists);
            });
        });
    }
}