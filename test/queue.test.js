var assert = require('assert'),
    Queue = require('../lib/queue'),
    fs = require('fs'),
    path = require('path');

module.exports = {
    'smoke test single task queue' : function(beforeExit, assert) {
        var q = new Queue('test1');
        q.task('inspect');
        q.run();
    }
}