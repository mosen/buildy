/**
 * Built in task test case - inspect
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    path = require('path'),
    State = require('../lib/buildy/state'),
    fixtures = {
        string : 'Test inspect task string',
        strings : [ 'Test inspect string 1', 'Test inspect string 2' ],
        files : ['./test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js']
    };

module.exports = {

    // Smoke test

    'test inspect (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-inspect');

        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('inspect').run();

        var outputState = q._state.get().value;

        assert.equal(outputState, fixtures.string, 'assert state remains as same string');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    // Test all input types

    'test inspect input files' : function(beforeExit, assert) {
        var q = new Queue('test-inspect-input-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('inspect').run();

        assert.equal(q._state.get().value, fixtures.files, 'assert state remains as same file listing');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test inspect input strings' : function(beforeExit, assert) {
        var q = new Queue('test-inspect-input-strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('inspect').run();

        assert.equal(q._state.get().value, fixtures.strings, 'assert state remains as same strings');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:files');
    },

    'test inspect input undefined' : function(beforeExit, assert) {
        var q = new Queue('test-inspect-input-strings');

        // Mock state
        q._state = new State();
        assert.equal(q._state.get().type, State.TYPES.UNDEFINED, 'State type is initially undefined');

        q.task('inspect').run();

    }
}