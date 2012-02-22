/**
 * Built in task test case - jslint
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    path = require('path'),
    State = require('../lib/buildy/state'),
    fixtures = {
        files : ['./test/fixtures/test1.js'],
        string : 'function a() {}',
        strings : ['function a() {}', 'var x = 1;']
    };


module.exports = {

    // Smoke test

    'test jslint (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-jslint');

        q.task('files', fixtures.files).task('jslint');
        q.run();
    },

    // Test all input types

    'test jslint input files' : function(beforeExit, assert) {
        var q = new Queue('test-jslint-input-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('jslint').run();

        assert.equal(q._state.get().value, fixtures.files, 'assert state remains as same file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test jslint input strings' : function(beforeExit, assert) {
        var q = new Queue('test-jslint-input-strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('jslint').run();

        assert.equal(q._state.get().value, fixtures.strings, 'assert state remains as same strings');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    },

    'test jslint input string' : function(beforeExit, assert) {
        var q = new Queue('test-jslint-input-string');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('jslint').run();

        assert.equal(q._state.get().value, fixtures.string, 'assert state remains as same string');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test jslint input undefined' : function(beforeExit, assert) {
        var q = new Queue('test-jslint-input-string');

        // Mock state
        q._state = new State();

        q.task('jslint').run();

        assert.equal(q._state.get().value, null, 'assert state remains as same undefined');
        assert.equal(q._state.get().type, State.TYPES.UNDEFINED, 'assert state is type:undefined');
    }

    // Test specific functionality

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

}

