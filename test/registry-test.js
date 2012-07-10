/*global describe, it*/
// Mocha test suite
var Registry = require('../lib/buildy/registry');

var should = require('should');

describe('registry:', function() {

    describe('when loading a single task "concat"', function() {
        it('should contain a tasks object with a "concat" property', function() {
            var r = new Registry({ autoload: false });
            r.load(__dirname + '/../lib/buildy/tasks/concat.js'); // TODO: stub task
            r._tasks.should.have.property('concat');
        });
    });

    describe('when loading a directory containing tasks', function() {
        it('should contain more than zero tasks', function() {
            var r = new Registry();
            r.load(__dirname + '/../lib/buildy/tasks');
            Object.keys(r._tasks).should.not.be.empty;
        });
    });

    describe('when getting a task by name', function() {
        it('should return an object with accepted types as properties', function() {
            var r = new Registry({ autoload: true });
            var concat_task = r.task('concat');
            Object.keys(concat_task).forEach(function(acceptedType) {
                ['STRING','FILE'].should.include(acceptedType);
            });
        });
    });

});
