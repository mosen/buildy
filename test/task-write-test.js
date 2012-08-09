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
var fs = require('fs');

describe('task:write ', function() {

    describe('when writing multiple items to a specified destination', function() {
        it('should not callback with an error', function(done) {
            var tempDir = temp.mkdirSync();
            var q = new Queue('task:writemulti', {
                state: new State([
                    { name: fixtures.cssfile, string: 'fixtures.cssfile' },
                    { name: fixtures.file, string: 'fixtures.file' }
                ])
            });

            q.task('write', { dest: tempDir }).run(function(err) {
                should.not.exist(err);

                fs.readdir(tempDir, function(err, files) {
                    console.log(files);
                    done();
                });
            });

        });
    });

});
