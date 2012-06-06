/*global describe, it*/
// Mocha test suite
var Registry = require('../lib/buildy/registry');

var should = require('should');

describe('registry:', function() {

    describe('when loading a single task "concat"', function() {
        it('should contain a tasks object with a "concat" property', function() {
            var r = new Registry({ autoload: false });
            r.load(__dirname + '/../lib/buildy/tasks/concat.js');
            r._tasks.should.have.property('concat');
        });
    });
});
