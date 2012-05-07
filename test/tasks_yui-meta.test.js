/**
 * Built in task test case - YUI metadata generation
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    State = require('../lib/buildy/state'),
    fs = require('fs'),
    path = require('path'),
    fixtures = {
        files : ['./test/fixtures/test_concat_a.js'],
        string : 'foo',
        strings : ['foo', 'bar'],
        string_yui : "YUI.add('my-module', function(Y){}, '0.0.1', { requires: ['node', 'event'], skinnable: true });",
        string_yui_arbitrary : "YUI.add('my-module', function(Y){}, '0.0.1', { foo: 'bar', one: false });"
    },
    handleTaskFailure = function(result, assert) {
        assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
    },
    tearDown = function(filename) {
        return fs.unlinkSync(filename);
    };

module.exports = {
    // Test printing AST from string_yui, this is to determine whether AST would be valid

    'test details are parsed and extracted by AST generator' : function(beforeExit, assert) {
        var q = new Queue('test-print-ast');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string_yui);

        q.task('yui-meta').task('inspect').run();
    },

    'test arbitrary key values are parsed and extracted by AST generator' : function(beforeExit, assert) {
        var q = new Queue('test-print-ast-any');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string_yui_arbitrary);

        q.task('yui-meta').task('inspect').run();
    }

}