/**
 * Built in task test case - replace
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');


module.exports = {
    'test replace' : function(beforeExit, assert) {
        var q = new queue.Queue('test-replace');
        q.task('files', ['./test/fixtures/test1.js'])
            .task('replace', { regex: '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n', replace: '', flags: 'mg' });
        q.run();
    }
};