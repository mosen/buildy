/**
 * Built in task test case - files
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    path = require('path'),
    State = require('../lib/buildy/state'),
    fixtures = {
        string : './test/fixtures/test1.js',
        file : ['./test/fixtures/test1.js'],
        files : ['./test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js'],
        expected : ['./test.fixtures.test1.js', './test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js']
    };

module.exports = {

    // Smoke test

    'test files (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-files');

        q.task('files', fixtures.file);
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState.toString(), fixtures.file.toString(), 'assert state contains specified filename');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    // Test all input types

    'test files input files' : function(beforeExit, assert) {
        var q = new Queue('test-files-input-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('files', fixtures.file);
        q.run();

        //console.log(q._state.get().value);

        //assert.equal(q._state.get().value, fixtures.expected, 'assert state contains expected combined file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test files input strings' : function(beforeExit, assert) {
        var q = new Queue('test-files-input-strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.files);

        q.task('files', fixtures.file);
        q.run();

        //console.log(q._state.get().value);

        //assert.deepEqual(q._state.get().value, expectedOutput, 'assert state contains appended file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test files input string' : function(beforeExit, assert) {
        var q = new Queue('test-files-input-string');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('files', fixtures.files);
        q.run();

        //console.log(q._state.get().value);

        //assert.deepEqual(q._state.get().value, expectedOutput, 'assert state contains appended file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test files input null with filespec' : function(beforeExit, assert) {
        var q = new Queue('test-files-input-spec');

        q.task('files', fixtures.file);
        q.run();

        //console.log(q._state.get().value);

        //assert.deepEqual(q._state.get().value, expectedOutput, 'assert state contains appended file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    }

    // Test specific functionality

}