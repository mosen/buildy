/**
 * Built in task test case - replace
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    State = require('../lib/buildy/state'),
    fixtures = {
        files : ['./test/fixtures/test1.js'],
        string : 'Y.log("a");',
        strings : ['Y.log("a");\n', 'console.log("test");'],
        regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
//        regex : 'Y.log',
        replacement : '',
        flags : 'mg'
    },
    handleTaskFailure = function(result, assert) {
        assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
    };


module.exports = {

    // Smoke test

    'test replace (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-replace');
        q.task('files', ['./test/fixtures/test1.js'])
            .task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags });
        q.run();
    },

    // Test all input types

    'test replace input files' : function(beforeExit, assert) {
        var q = new Queue('test-replace-input-files');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        assert.equal(q._state.get().value, fixtures.files, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test replace input strings' : function(beforeExit, assert) {
        var q = new Queue('test-replace-input-strings');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        console.log(q._state.get().value[0]);
        assert.equal(q._state.get().value[0], '', 'assert strings have been replaced with zero length strings');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    },

    'test replace input string' : function(beforeExit, assert) {
        var q = new Queue('test-replace-input-string');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        assert.equal(q._state.get().value, fixtures.string, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test replace input undefined fails' : function(beforeExit, assert) {
        var q = new Queue('test-replace-input-undefined'),
            didfail = false;

        q.on('taskFailed', function(result) { didfail = true; });

        // Mock state
        q._state = new State();

        q.task('replace', { regex: fixtures.regex, replace: fixtures.replacement, flags: fixtures.flags }).run();

        assert.equal(q._state.get().value, null, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.UNDEFINED, 'assert state is type:undefined');

        beforeExit(function() {
            assert.ok(didfail, 'assert replace undefined causes the task to fail');
        });
    }

    // Test specific functionality
};