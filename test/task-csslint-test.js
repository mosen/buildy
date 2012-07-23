// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var path = require('path');
var should = require('should');
var fixtures = require('./fixtures.js');
var temp = require('temp');
var assert = require('assert');
var util = require('util');

describe('task:csslint ', function() {

    describe('when linting an example file', function() {
        it('should log csslint results', function(done) {

            var q = new Queue('task:csslint', {
                state: new State(fixtures.cssfile, State.TYPES.FILE, {})
            });

            q.on('queueStarted', function() { console.log('queue started'); });
            q.on('taskComplete', function() { console.log('task complete'); });
            q.on('taskFailed', function() { assert.fail('task failed '); });

            q.task('csslint').run();

            done();
        });
    });

});
