/**
 * Built in task test case - cssminify
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path'),
    State = require('../lib/state'),
    fixtures = {
        files : ['./test/fixtures/test1.css'],
        string : '.empty {}',
        strings : ['.empty {}', 'div { width: 100% }']
    };

module.exports = {

    // Smoke test

    'test cssminify (smoke test)' : function(beforeExit, assert) {
        var q = new queue.Queue('test-cssminify');

        q.task('files', fixtures.files)
         .task('cssminify')
         .task('inspect');

        q.run();
    },

    // Test all input types

    'test cssminify input files' : function(beforeExit, assert) {
        var q = new queue.Queue('test-cssminify-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('cssminify');
        q.run();

        //assert.equal(q._state.get().value, 'ab', 'assert state contains concatenated string output');
        //assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test cssminify input strings' : function(beforeExit, assert) {
        var q = new queue.Queue('test-cssminify-input-strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('cssminify');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState, fixtures.strings, 'assert state contains same strings');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    },

    'test cssminify input string' : function(beforeExit, assert) {
        var q = new queue.Queue('test-cssminify-input-string');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('cssminify');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState, fixtures.string, 'assert state contains same string');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test cssminify input undefined' : function(beforeExit, assert) {

    }

    // Test specific functionality

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
}