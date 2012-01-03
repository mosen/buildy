/**
 * Built in task test case - files
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path'),
    State = require('../lib/state');


module.exports = {

    // Smoke test

    'test files (smoke test)' : function(beforeExit, assert) {
        var q = new queue.Queue('test-files'),
            fileFixture = ['./test/fixtures/test1.js'];

        q.task('files', fileFixture);
        q.run();

        var outputState = q._state.get().value;

        assert.equal(outputState.toString(), fileFixture.toString(), 'assert state contains specified filename');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    // Test all input types to ensure the main task function doesn't throw an exception

    'test files input files' : function(beforeExit, assert) {
        var q = new queue.Queue('test-files-input-files'),
            fileFixture = ['./test/fixtures/test1.js'],
            fileFixtureState = ['./test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js'],
            expectedOutput = ['./test.fixtures.test1.js', './test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js'];

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fileFixtureState);

        q.task('files', fileFixture);
        q.run();

        //console.log(q._state.get().value);

        //assert.deepEqual(q._state.get().value, expectedOutput, 'assert state contains appended file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test files input strings' : function(beforeExit, assert) {
        var q = new queue.Queue('test-files-input-strings'),
            fileFixture = ['./test/fixtures/test1.js'],
            fileFixtureState = ['./test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js'],
            expectedOutput = ['./test.fixtures.test1.js', './test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js'];

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fileFixtureState);

        q.task('files', fileFixture);
        q.run();

        //console.log(q._state.get().value);

        //assert.deepEqual(q._state.get().value, expectedOutput, 'assert state contains appended file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test files input string' : function(beforeExit, assert) {
        var q = new queue.Queue('test-files-input-string'),
            fileFixture = ['./test/fixtures/test1.js'],
            fileFixtureState = './test/fixtures/test_concat_a.js',
            expectedOutput = ['./test.fixtures.test1.js', './test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js'];

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fileFixtureState);

        q.task('files', fileFixture);
        q.run();

        //console.log(q._state.get().value);

        //assert.deepEqual(q._state.get().value, expectedOutput, 'assert state contains appended file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test files input null with filespec' : function(beforeExit, assert) {
        var q = new queue.Queue('test-files-input-spec'),
            fileFixture = ['./test/fixtures/test1.js'];

        q.task('files', fileFixture);
        q.run();

        //console.log(q._state.get().value);

        //assert.deepEqual(q._state.get().value, expectedOutput, 'assert state contains appended file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    }

}