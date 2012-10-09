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
        it('should not callback with an error', function(done) {

            // TODO: Stub module csslint?
            var q = new Queue('task:csslint', {
                state: new State([{ name: fixtures.cssfile, file: fixtures.cssfile }])
            });

            q.task('csslint').run(function(err) {
                should.not.exist(err);
                done();
            });

        });
    });

});