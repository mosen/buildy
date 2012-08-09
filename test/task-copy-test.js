// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var fs = require('fs');
var should = require('should');
var fixtures = require('./fixtures.js');
var temp = require('temp');

describe('task:copy ', function() {

    describe('when copying a single file to a destination filename', function() {
        it('should create the destination file', function(done) {
            var temp_dest = temp.path({ suffix: '.js' });
            var q = new Queue('task:copy');


            q.task('copy', { src: [fixtures.file], dest: temp_dest }).run(function() {
                fs.existsSync(temp_dest).should.be.true;
                done();
            });
        });
    });

});
