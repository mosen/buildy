/*global describe, it*/
// Mocha test suite
var State = require('../lib/buildy/state.js');
var should = require('should');

describe('State', function() {

    var state = new State([{ name: 'string test', string: 'String contents' }]);

    describe('when constructing a state with a string', function() {

        it('should have a length of 1', function() {
            state.length().should.equal(1);
        });

        it('should contain a single value equal to "String contents"', function() {
            state.get('string test').string.should.equal('String contents');
        });
    });
});

describe('State', function() {

    var state = new State([
        { name: 'file1.js', file: 'file1.js' },
        { name: 'file2.js', file: 'file2.js' },
        { name: 'file3.js', file: 'file3.js' }
    ]);

    describe('when constructing a state with an array of filenames', function() {

        it('should have a length of 3', function() {
            state.length().should.equal(3);
        });

        it('should contain file1.js', function() {
            state.get('file1.js').file.should.eql('file1.js');
        });

        it('should contain file2.js', function() {
            state.get('file2.js').file.should.eql('file2.js');
        });

        it('should contain file3.js', function() {
            state.get('file3.js').file.should.eql('file3.js');
        });

        it('should allow us to iterate with each 3 times', function() {
            var iterations = 0;

            state.forEach(function(name, o) {
                iterations++;
            }, this);

            iterations.should.equal(3);
        });
    });
});