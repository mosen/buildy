/**
 * Built in task test case - write
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    State = require('../lib/buildy/state'),
    fs = require('fs'),
    path = require('path'),
    fixtures = {
        files : ['./test/fixtures/test_concat_a.js'],
        output : './test/temp/test-write.js',
        output_files : './test/temp/test-write-files.js',
        output_strings : './test/temp/test-write-strings.js',
        output_string : './test/temp/test-write-string.js',
        output_undefined : './test/temp/test-write-undefined.js',
        string : 'foo',
        strings : ['foo', 'bar']
    },
    handleTaskFailure = function(result, assert) {
        assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
    },
    tearDown = function(filename) {
        return fs.unlinkSync(filename);
    };

module.exports = {

    // Smoke test

    'test write (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-write');

        q.task('files', fixtures.files)
         .task('concat')
         .task('write', { name : fixtures.output });
        q.run();

        beforeExit(function() {
            assert.ok(path.existsSync(fixtures.output), 'assert file has been written');
            tearDown(fixtures.output);
        });
    },

    // Test all input types

    'test write input files' : function(beforeExit, assert) {
        var q = new Queue('test-write-input-files');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('write', { name: fixtures.output_files }).run();

        beforeExit(function() {

            assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:string ' + q._state.get().type);
            assert.equal(q._state.get().value[0], fixtures.output_files, 'assert state is output file' + q._state.get().value[0]);
            assert.ok(path.existsSync(fixtures.output_files), 'assert file has been written');
            tearDown(fixtures.output_files);
        });
    },

    'test write input strings' : function(beforeExit, assert) {
        var q = new Queue('test-write-input-strings');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('write', { name: fixtures.output_strings }).run();

        beforeExit(function() {

            assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:string ' + q._state.get().type);
            assert.equal(q._state.get().value[0], fixtures.output_strings, 'assert state is output file' + q._state.get().value[0]);
            assert.ok(path.existsSync(fixtures.output_strings), 'assert file has been written');
            tearDown(fixtures.output_strings);
        });
    },

    'test write input string' : function(beforeExit, assert) {
        var q = new Queue('test-write-input-string');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('write', { name: fixtures.output_string }).run();

        beforeExit(function() {

            assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:string ' + q._state.get().type);
            assert.equal(q._state.get().value[0], fixtures.output_string, 'assert state is output file' + q._state.get().value[0]);
            assert.ok(path.existsSync(fixtures.output_string), 'assert file has been written');
            tearDown(fixtures.output_string);
        });
    },

    'test write input undefined' : function(beforeExit, assert) {
        var q = new Queue('test-write-input-undefined');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        assert.equal(q._state.get().type, State.TYPES.UNDEFINED, 'assert state begins as undefined');

        q.task('write', { name: fixtures.output_undefined }).run();

        beforeExit(function() {

            assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:string ' + q._state.get().type);
            assert.equal(q._state.get().value[0], fixtures.output_undefined, 'assert state is output file' + q._state.get().value[0]);
            assert.ok(path.existsSync(fixtures.output_undefined), 'assert file has been written');
            tearDown(fixtures.output_undefined);
        });
    }

    // Test specific functionality.

    // Old Tests

    //    'test write' : function(beforeExit, assert) {
//        var q = new Queue('test-write'),
//            r = new Registry(),
//            b = new buildy.Buildy();
//
//        r.load(__dirname + '/../lib/buildy/tasks');
//
//        b.registry = r;
//        q.task('files', ['./test/fixtures/test1.js']).task('concat').task('write');
//        q.run(b);
//    }
}