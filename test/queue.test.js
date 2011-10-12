var assert = require('assert'),
    queue = require('queue'),
    buildy = require('buildy'),
    fs = require('fs'),
    path = require('path');

module.exports = {
    'smoke test single task queue' : function(beforeExit, assert) {
        var q = new queue.Queue('test1');
        q.task('log');
        q.run(new buildy.Buildy());
    }
}