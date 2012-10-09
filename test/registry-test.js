/*global describe, it*/
// Mocha test suite
var Registry = require('../lib/buildy/registry');
var path = require('path');
var should = require('should');

describe('registry:', function() {

    describe('when loading a directory containing tasks', function() {
        it('should contain more than zero tasks', function() {
            var r = new Registry();
            r.load(__dirname + '/../lib/buildy/tasks');
            Object.keys(r._tasks).should.not.be.empty;
        });
    });

    describe('regression when loading a task that refers to a module that is unavailable', function() {
        it('should continue with a warning and not throw an exception', function() {
            var r = new Registry();
            r.load(path.join(__dirname, 'test', 'fixtures', 'nomodule_task', 'nomodule.js'));
        });
    });

});
