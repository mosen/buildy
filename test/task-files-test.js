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

describe('task:files ', function() {

        describe('when run with the fixtures directory', function() {

            it('should contain three items in the state object', function(done) {
                var q = new Queue('task:files');

                q.task('files', [fixtures.directory]).run(function() {
                    this.state.length().should.equal(3);
                    done();
                });
            });

            it('should contain test1.css');
//                var q = new Queue('task:files');
//
//                q.task('files', [fixtures.directory]).run(function() {
//                    should.exist(this.state.get('test1.css'));
//                    done();
//                });
//            });
        });
});
