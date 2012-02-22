/**
 * Built in task test case - less
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    path = require('path'),
    State = require('../lib/buildy/state'),
    fixtures = {
        files : ['./test/fixtures/test1.css'],
        string : '.empty {}',
        strings : ['.empty {}', 'div { width: 100% }']
    },
    handleTaskFailure = function(result, assert) {
        assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
    };

module.exports = {

    // Smoke test

    'test less (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-less');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        q.task('files', fixtures.files)
         .task('cssminify')
         .task('inspect');

        q.run();
    },

    // Test all input types

    'test less input files' : function(beforeExit, assert) {
        var q = new Queue('test-less-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        q.task('cssminify');
        q.run();

        //assert.equal(q._state.get().value, 'ab', 'assert state contains concatenated string output');
        //assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test less input strings' : function(beforeExit, assert) {
        var q = new Queue('test-less-input-strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        q.task('cssminify');
        q.run();

        var outputState = q._state.get().value;

        //assert.equal(outputState, fixtures.strings, 'assert state contains same strings');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    },

    'test less input string' : function(beforeExit, assert) {
        var q = new Queue('test-less-input-string');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        q.task('cssminify');
        q.run();

        var outputState = q._state.get().value;

        //assert.equal(outputState, fixtures.string, 'assert state contains same string');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test less input undefined' : function(beforeExit, assert) {

    }

    // Test specific functionality

//
//    // less (ASYNC)
//
//    'test less with source file does not return an error' : function(beforeExit, assert) {
//        utils.less({
//            sourceFile : './test/fixtures/test1.css'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test less with source string does not return an error' : function(beforeExit, assert) {
//        utils.less({
//            source : 'root { display: block; }'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test less with invalid source file returns an error' : function(beforeExit, assert) {
//        utils.less({
//            sourceFile : './test/fixtures/invalid_dir/testabc.css'
//        }, function(err, data) {
//            assert.ok(err);
//        });
//    },
//
////    'test less with unparseable css returns an error' : function(beforeExit, assert) {
////        utils.less({
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
//    'test less with destination file does not return an error' : function(beforeExit, assert) {
//        utils.less({
//            source : 'root { display: block; }',
//            destFile : './test/temp/less1.css'
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.ok(path.existsSync('./test/temp/less1.css'));
//        });
//    },
//
//    'test less with invalid destination file returns an error' : function(beforeExit, assert) {
//        utils.less({
//            source : 'root { display: block; }',
//            destFile : './test/temp/invalid_dir/lessabc.css'
//        }, function(err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test less with no parameters returns an error' : function(beforeExit, assert) {
//        utils.less({}, function(err, data) {
//            assert.ok(err);
//        });
}