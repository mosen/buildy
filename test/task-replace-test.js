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

describe('task:replace ', function() {

    describe('when replacing an existing state with a zero length string', function() {

        it('should contain a zero length string', function(done) {

            var q = new Queue('task:replace', {
                state: new State([{ name: 'string-value', string: 'foobar' }])
            });

            q.task('replace', { regex: 'foobar' }).run(function(err) {
                should.not.exist(err);
                this.state.get('string-value').should.have.property('string');
                this.state.get('string-value').string.should.equal('');
                done();
            });

        });
    });
});
