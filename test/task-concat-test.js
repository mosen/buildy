// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var should = require('should');
var fixtures = require('./fixtures.js');

describe('task:concat ', function() {

    describe('when run with a state that contains 2 strings', function() {
        it('should only contain one value', function(done) {

            var q = new Queue('task:concat', {
                state: new State(['foo', 'bar'], 'STRING', {})
            });

            q.task('concat').run();
            q.state.length().should.eql(1);
            done();
        });

        it('should contain those strings concatenated', function(done) {
            var q = new Queue('task:concat', {
                state: new State(['foo', 'bar'], 'STRING', {})
            });

            q.task('concat').run();
            q.state.value().should.eql('foobar');
            done();
        });
    });

    describe('when run with two files', function() {
        it('should only contain one value', function(done) {

            var q = new Queue('task:concat', {
                state: new State(['foo', 'bar'], 'STRING', {})
            });

            q.task('concat').run();
            q.state.length().should.eql(1);
            done();
        });

        it('should contain those files concatenated', function(done) {
            var q = new Queue('task:concat', {
                state: new State([fixtures.file, fixtures.file], 'FILE', {})
            });

            q.task('concat').run();
            q.state.value().should.eql('foobar');
            done();
        });
    });
});
