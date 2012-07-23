// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var path = require('path');
var should = require('should');
var fixtures = require('./fixtures.js');
var temp = require('temp');

describe('task:copy ', function() {

    describe('when copying a single file to a destination filename', function() {
        it('should create the destination file', function(done) {
            var temp_dest = temp.path({ suffix: '.js' });
            var q = new Queue('task:copy', {
                state: new State(fixtures.file, State.TYPES.FILE, {})
            });

            q.on('taskComplete', function() { console.log('task complete'); });
            q.on('taskFailed', function() { console.log('task failed'); });

            q.task('copy', { dest: temp_dest }).run();
            path.existsSync(temp_dest).should.be.true;
            done();
        });
    });

});
