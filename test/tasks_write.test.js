/**
 * Built in task test case - write
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');


module.exports = {
    'test nothing' : function() {}
}

//    'test write' : function(beforeExit, assert) {
//        var q = new queue.Queue('test-write'),
//            r = new Registry(),
//            b = new buildy.Buildy();
//
//        r.load(__dirname + '/../lib/tasks');
//
//        b._registry = r;
//        q.task('files', ['./test/fixtures/test1.js']).task('concat').task('write');
//        q.run(b);
//    }