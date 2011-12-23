/**
 * Built in task test case - cssminify
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');

module.exports = {
    'test cssminify (smoke test)' : function(beforeExit, assert) {
        var q = new queue.Queue('test-cssminify');

        q.task('files', ['./test/fixtures/test1.css'])
         .task('cssminify')
         .task('inspect');

        q.run();
    }
}


//
//    // cssminify (ASYNC)
//
//    'test cssMinify with source file does not return an error' : function(beforeExit, assert) {
//        utils.cssMinify({
//            sourceFile : './test/fixtures/test1.css'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test cssMinify with source string does not return an error' : function(beforeExit, assert) {
//        utils.cssMinify({
//            source : 'root { display: block; }'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test cssMinify with invalid source file returns an error' : function(beforeExit, assert) {
//        utils.cssMinify({
//            sourceFile : './test/fixtures/invalid_dir/testabc.css'
//        }, function(err, data) {
//            assert.ok(err);
//        });
//    },
//
////    'test cssMinify with unparseable css returns an error' : function(beforeExit, assert) {
////        utils.cssMinify({
////            source : 'root { \. isplay; __ //}'
////        }, function(err, data) {
//////            console.log('This is the error' + err);
//////            console.log('This is the data ' + data);
////            //assert.isDefined(err, 'Error is defined');
//////            assert.ok(err);
////            //assert.ok(true);
////        });
////    },
//
//    'test cssMinify with destination file does not return an error' : function(beforeExit, assert) {
//        utils.cssMinify({
//            source : 'root { display: block; }',
//            destFile : './test/temp/cssminify1.css'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.ok(path.existsSync('./test/temp/cssminify1.css'));
//        });
//    },
//
//    'test cssMinify with invalid destination file returns an error' : function(beforeExit, assert) {
//        utils.cssMinify({
//            source : 'root { display: block; }',
//            destFile : './test/temp/invalid_dir/cssminifyabc.css'
//        }, function(err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test cssMinify with no parameters returns an error' : function(beforeExit, assert) {
//        utils.cssMinify({}, function(err, data) {
//            assert.ok(err);
//        });