/**
 * Built in task test case - replace
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    State = require('../lib/state'),
    fixtures = {
        files : ['./test/fixtures/test1.js'],
        string : 'Y.log("a");',
        strings : ['Y.log("a");', 'console.log("test");'],
        regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
        replacement : '',
        flags : 'mg'
    },
    handleTaskFailure = function(result, assert) {
        assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
    };


module.exports = {

    // Smoke test

    'test replace (smoke test)' : function(beforeExit, assert) {
        var q = new queue.Queue('test-replace');
        q.task('files', ['./test/fixtures/test1.js'])
            .task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags });
        q.run();
    },

    // Test all input types

    'test replace input files' : function(beforeExit, assert) {
        var q = new queue.Queue('test-replace-input-files');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        assert.equal(q._state.get().value, fixtures.files, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test replace input strings' : function(beforeExit, assert) {
        var q = new queue.Queue('test-replace-input-strings');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        assert.equal(q._state.get().value, fixtures.strings, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    },

    'test replace input string' : function(beforeExit, assert) {
        var q = new queue.Queue('test-replace-input-string');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        assert.equal(q._state.get().value, fixtures.string, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test replace input undefined' : function(beforeExit, assert) {
        var q = new queue.Queue('test-replace-input-undefined');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        assert.equal(q._state.get().value, null, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.UNDEFINED, 'assert state is type:undefined');
    }

    // Test specific functionality
};