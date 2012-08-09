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

describe('task:inspect ', function() {

    describe('when run with a state containing a single string', function() {

        it('should not callback with an error', function(done) {

            var q = new Queue('task:handlebars', {
                state: new State([{ name: 'string-value', string: 'foobar' }])
            });

            q.task('inspect').run(function(err) {
                should.not.exist(err);
                done();
            });

        });
    });
});
