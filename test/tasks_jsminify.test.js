/**
 * Built in task test case - jsminify
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');


module.exports = {
    'test jsminify' : function(beforeExit, assert) {
        var q = new queue.Queue('test-jsminify');

        q.task('files', ['./test/fixtures/test1.js']).task('jsminify');
        q.run();
    }
};


//
//    'test minify with source file does not error, and returns minified string' : function(beforeExit, assert) {
//        utils.minify({
//            sourceFile : './test/fixtures/test1.js'
//        }, function (err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test minify with source string does not error, and returns minified string' : function(beforeExit, assert) {
//        utils.minify({
//            source : 'var x = 1;'
//        }, function (err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test minify source to destination file does not error, and the file exists' : function(beforeExit, assert) {
//        var testfile = './test/temp/testminify1.js';
//
//        utils.minify({
//            source : 'var x = 1;',
//            destFile : testfile
//        }, function (err, data) {
//            assert.ok(!err);
//            assert.ok(path.existsSync(testfile));
//        });
//
//        beforeExit(function() {
//            fs.unlinkSync(testfile);
//        });
//    },
//
//    'test minify with invalid dest file returns an error' : function(beforeExit, assert) {
//        utils.minify({
//            source : 'var x = 1;',
//            destFile : './test/temp/invalid_dir/testabc.js'
//        }, function (err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test minify with invalid source file returns an error' : function(beforeExit, assert) {
//        utils.minify({
//            sourceFile : './test/fixtures/testabc.js'
//        }, function (err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test minify with unparseable code returns an error' : function(beforeExit, assert) {
//        utils.minify({
//            source : 'var x(1) = ^43function;;1'
//        }, function (err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test minify with no parameters returns an error' : function(beforeExit, assert) {
//        utils.minify({}, function(err, data) {
//            assert.ok(err);
//        });
//    },