/**
 * Built in task test case - concat
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');

module.exports = {
    'test concat (smoke test)' : function(beforeExit, assert) {
        var q = new queue.Queue('test-concat');
        q.task('files', ['./test/fixtures/test1.js', './test/fixtures/test2.js']).task('concat');
        q.run();
    }
};

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