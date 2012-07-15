// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var should = require('should');
var fixtures = require('./fixtures.js');

describe('task:copy ', function() {

    describe('when run with a single file', function() {
        it('should not raise an error', function(done) {

            var q = new Queue('task:copy', {
                state: new State(fixtures.file, State.TYPES.FILE, {})
            });

            q.task('copy', { dest: 'C:\acdef.js' }).run();
            q.state.length().should.eql(1);
            done();
        });
    });

});
