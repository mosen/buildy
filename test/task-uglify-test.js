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

describe('task:uglify ', function() {

    describe('when processing a .js file', function() {
        it('should not callback with an error', function(done) {

            var q = new Queue('task:uglify', {
                state: new State([{ name: fixtures.file, file: fixtures.file }])
            });

            q.task('uglify').run(function(err) {
                should.not.exist(err);
                done();
            });

        });
    });

});
