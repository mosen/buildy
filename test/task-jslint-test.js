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

describe('task:jslint ', function() {

    describe('when linting an example file', function() {
        it('should not callback with an error', function(done) {

            var q = new Queue('task:jslint', {
                state: new State([{ name: fixtures.file, file: fixtures.file }])
            });

            q.task('jslint').run(function(err) {
                should.not.exist(err);
                done();
            });

        });
    });

});
