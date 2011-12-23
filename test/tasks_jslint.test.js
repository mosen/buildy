/**
 * Built in task test case - jslint
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');


module.exports = {
    'test jslint' : function(beforeExit, assert) {
        var q = new queue.Queue('test-jslint'),
            r = new Registry(),
            b = new buildy.Buildy();

        r.load(__dirname + '/../lib/tasks');

        b._registry = r;
        q.task('files', ['./test/fixtures/test1.js']).task('jslint');
        q.run(b);
    }
}

//
//    // utils.lint (ASYNC)
//
//    'test lint with source file' : function(beforeExit, assert) {
//        utils.lint({
//           sourceFile : './test/fixtures/test1.js'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test lint with source string' : function(beforeExit, assert) {
//        utils.lint({
//           source : 'var x = 1;'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test lint with invalid file input returns error' : function(beforeExit, assert) {
//        utils.lint({
//           sourceFile : './test/fixtures/testxyz.js'
//        }, function(err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test lint with no valid parameters returns error' : function(beforeExit, assert) {
//        utils.lint({}, function(err, data) {
//            assert.ok(err);
//        });
//    },