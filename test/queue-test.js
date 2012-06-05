/*global describe, it*/
// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var winston = require('winston');
var should = require('should');

describe('queue:', function() {

    describe('when run with a single task', function() {
        it('should not throw an error', function(done) {
            var q = new Queue('when run with a single task');
            q.task('inspect').run();
            done();
        });
    });
});
