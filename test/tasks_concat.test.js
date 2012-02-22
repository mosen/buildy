/**
 * Built in task test case - concat
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    path = require('path'),
    State = require('../lib/buildy/state'),
    fixtures = {
        files : ['./test/fixtures/test_concat_a.js', './test/fixtures/test_concat_b.js'],
        strings : ['one', 'two'],
        string : 'three'
    };

module.exports = {

    // Smoke test

    'test concat (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-concat');
        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('concat');
        q.run();

        assert.equal(q._state.get().value, 'ab', 'assert state contains concatenated string output');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    // Test all input types

    'test concat input files' : function(beforeExit, assert) {
        var q = new Queue('test-concat-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('concat');
        q.run();

        assert.equal(q._state.get().value, 'ab', 'assert state contains concatenated string output');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test concat input strings' : function(beforeExit, assert) {
        var q = new Queue('test-concat-strings');
        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('concat');
        q.run();

        //console.log(q._state.get().value);

        assert.equal(q._state.get().value, fixtures.strings.join(''), 'assert state contains concatenated string output');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    },

    'test concat input string' : function(beforeExit, assert) {
        var q = new Queue('test-concat-string');
        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('concat');
        q.run();

        assert.equal(q._state.get().value, fixtures.string, 'assert state contains concatenated string output');
        assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string');
    }

    // Test specific functionality

//    // concat (sync)
//
//    'test concatSync with null destination returns a string with non-zero length' : function(beforeExit, assert) {
//        var output = utils.concatSync(null, ['./test/fixtures/test1.js', './test/fixtures/test2.js']);
//        assert.type(output, 'string');
//    },
//
//    'test concatSync with invalid file(s) throws an error' : function(beforeExit, assert) {
//        assert.throws(function() {
//            utils.concatSync('./test/temp/testconcat1.js', ['./test/fixtures/testx.js', './test/fixtures/testy.js'])
//        }, Error);
//    },
//
//    'test concatSync with file destination' : function(beforeExit, assert) {
//        var testfile = './test/temp/testconcat2.js';
//
//        utils.concatSync(testfile, ['./test/fixtures/test1.js', './test/fixtures/test2.js']);
//        assert.ok(path.existsSync('./test/temp/testconcat2.js'));
//
//        beforeExit(function() {
//            fs.unlinkSync(testfile);
//        });
//    },
//
//    'test concatSync with invalid file destination' : function(beforeExit, assert) {
//        assert.throws(function() {
//            utils.concatSync('./test/temp/invalid_dir/testconcat3.js', ['./test/fixtures/test1.js', './test/fixtures/test2.js']);
//        }, Error);
//    },
};

