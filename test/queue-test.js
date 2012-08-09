/*global describe, it*/
// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var winston = require('winston');
var should = require('should');
var path = require('path');

describe('queue:', function() {

    // Failing due to inspect task being called in the context of 'undefined'

    describe('when run with a single task', function() {
        it('should not throw an error', function(done) {
            var q = new Queue('when run with a single task');
            q.task('inspect').run();
            done();
        });
    });

    describe('regression when instantiating a queue', function() {
        it('should have a state property which is an instance of State', function(done) {
            var q = new Queue('state property');
            q.should.have.property('state');
            q.state.should.be.an.instanceOf(State);
            done();
        });
    });

    describe('regression when run with a task that emits failure', function() {
        it('should not timeout due to the callback never being called', function(done) {
            var q = new Queue('failure');
            q.registry.load(path.join(__dirname, '/fixtures/failure_task/failure.js'));

            q.task('failure').run(function(err) {
                done();
            });
        });
    });

    describe('when supplied a callback', function() {
        it('should call in the context of the queue object', function(done) {
            var q = new Queue('when run with a single task');
            q.task('inspect').run(function(err) {

                this.should.eql(q);
                done();
            });
        });
    });
});
