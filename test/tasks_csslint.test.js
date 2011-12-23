/**
 * Built in task test case - csslint
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');

module.exports = {
    'test csslint (smoke test)' : function(beforeExit, assert) {
        var q = new queue.Queue('test-csslint');

        q.task('files', ['./test/fixtures/test1.css']).task('csslint');
        q.run();
    }
};

//    // csslint (ASYNC)
//
//    'test cssLint with source file does not return an error' : function(beforeExit, assert) {
//        utils.cssLint({
//            sourceFile : './test/fixtures/test1.css'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test cssLint with source string does not return an error' : function(beforeExit, assert)  {
//        utils.cssLint({
//            source : 'root { display: block; }'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test cssLint with invalid source file returns an error' : function(beforeExit, assert) {
//        utils.cssLint({
//            sourceFile : './test/fixtures/invalid_dir/testabc.css'
//        }, function(err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test cssLint with no parameters returns an error' : function(beforeExit, assert) {
//        utils.cssLint({}, function(err, data) {
//            assert.ok(err);
//        });
//    },