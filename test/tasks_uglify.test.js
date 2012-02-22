/**
 * Built in task test case - jsminify
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

    'test jsminify (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-jsminify');

        q.on('taskFailed', function(result) {
            assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
        });

        q.task('files', fixtures.files).task('jsminify');
        q.run();
    },

    // Test all input types

    'test jsminify input files' : function(beforeExit, assert) {
        var q = new Queue('test-jsminify-input-files');

        q.on('taskFailed', function(result) {
            assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
        });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('jsminify').run();

        assert.equal(q._state.get().value, fixtures.files, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    },

    'test jsminify input strings' : function(beforeExit, assert) {
        var q = new Queue('test-jsminify-input-strings');

        q.on('taskFailed', function(result) {
            assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
        });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('jsminify').run();

        //assert.equal(q._state.get().value, fixtures.strings, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.STRINGS, 'assert state is type:strings');
    },

    'test jsminify input string' : function(beforeExit, assert) {
        var q = new Queue('test-jsminify-input-string');

        q.on('taskFailed', function(result) {
            assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
        });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('jsminify').run();

        //assert.equal(q._state.get().value, fixtures.string, 'assert state is unchanged');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test jsminify input undefined' : function(beforeExit, assert) {
        var q = new Queue('test-jsminify-input-undefined'),
            taskFailed = false;

        q.on('taskFailed', function(result) {
            taskFailed = true;
        });

        // Mock state
        q._state = new State();

        q.task('jsminify').run();

        beforeExit(function() {
            assert.equal(q._state.get().type, State.TYPES.UNDEFINED, 'assert state is type:undefined');
            assert.ok(taskFailed, 'assert jsminify fails with undefined input');
        });
    }

    // Test specific functionality

//
//    'test minify with source file does not error, and returns minified string' : function(beforeExit, assert) {
//        utils.minify({
//            sourceFile : './test/fixtures/test1.js'
//        }, function (err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test minify with source string does not error, and returns minified string' : function(beforeExit, assert) {
//        utils.minify({
//            source : 'var x = 1;'
//        }, function (err, data) {
//            assert.ok(!err);
//            assert.isDefined(data);
//        });
//    },
//
//    'test minify source to destination file does not error, and the file exists' : function(beforeExit, assert) {
//        var testfile = './test/temp/testminify1.js';
//
//        utils.minify({
//            source : 'var x = 1;',
//            destFile : testfile
//        }, function (err, data) {
//            assert.ok(!err);
//            assert.ok(path.existsSync(testfile));
//        });
//
//        beforeExit(function() {
//            fs.unlinkSync(testfile);
//        });
//    },
//
//    'test minify with invalid dest file returns an error' : function(beforeExit, assert) {
//        utils.minify({
//            source : 'var x = 1;',
//            destFile : './test/temp/invalid_dir/testabc.js'
//        }, function (err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test minify with invalid source file returns an error' : function(beforeExit, assert) {
//        utils.minify({
//            sourceFile : './test/fixtures/testabc.js'
//        }, function (err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test minify with unparseable code returns an error' : function(beforeExit, assert) {
//        utils.minify({
//            source : 'var x(1) = ^43function;;1'
//        }, function (err, data) {
//            assert.ok(err);
//        });
//    },
//
//    'test minify with no parameters returns an error' : function(beforeExit, assert) {
//        utils.minify({}, function(err, data) {
//            assert.ok(err);
//        });
//    },
};