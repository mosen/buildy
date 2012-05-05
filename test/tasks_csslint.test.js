/**
 * Built in task test case - csslint
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    State = require('../lib/buildy/state'),
    path = require('path'),
    fixtures = {
        files : ['./test/fixtures/test1.css'],
        string : '.empty {}',
        strings : ['.empty {}', 'div { width: 100% }'],
        invalid_files : ['./test/fixtures/test1.css', './test/fixtures/test2.css'],
        invalid_string: '%%%%%',
        invalid_strings : ['.empty {}', '%%%%%']
    };

module.exports = {

    // Smoke test

    'test csslint (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-csslint');

        q.task('files', fixtures.sourcefiles)
         .task('concat')
         .task('csslint');
        q.run();
    },

    // Test all input types

    'test csslint input files' : function(beforeExit, assert) {
        var q = new Queue('test-csslint-input-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('csslint');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState.toString(), fixtures.files.toString(), 'assert state contains same filename');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test csslint input invalid files' : function(beforeExit, assert) {
        var q = new Queue('test-csslint-input-invalid_files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.invalid_files);

        q.task('csslint');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState.toString(), fixtures.invalid_files.toString(), 'assert state contains same filename');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test csslint input strings' : function(beforeExit, assert) {
        var q = new Queue('test-csslint-input-strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('csslint');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState, fixtures.strings, 'assert state contains same strings');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    },

    'test csslint input string' : function(beforeExit, assert) {
        var q = new Queue('test-csslint-input-string');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('csslint');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState, fixtures.string, 'assert state contains same string');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test csslint input invalid string' : function(beforeExit, assert) {
        var q = new Queue('test-csslint-input-invalid_string');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.invalid_string);

        q.task('csslint');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState, fixtures.invalid_string, 'assert state contains same string');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test csslint input invalid strings' : function(beforeExit, assert) {
        var q = new Queue('test-csslint-input-invalid_strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.invalid_strings);

        q.task('csslint');
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState, fixtures.invalid_strings, 'assert state contains same strings');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    }

    // test csslint specific functionality

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
};

