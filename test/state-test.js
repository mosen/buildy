/*global describe, it*/
// Mocha test suite
var State = require('../lib/buildy/state.js');
var should = require('should');

describe('State', function() {

    var state = new State('String contents');

    describe('when constructing a state with a string', function() {

        it('should have a type equal to State.TYPES.STRING', function() {
            state.type().should.equal(State.TYPES.STRING);
        });

        it('should have a length of 1', function() {
            state.length().should.equal(1);
        });

        it('should contain an object with a single property', function() {
            Object.keys(state.value()).should.have.lengthOf(1);
        });

        it('should contain a single value equal to "String contents"', function() {
            state.value()[0].should.equal('String contents');
        });
    });
});

describe('State', function() {

    var state = new State([
        'file1.js',
        'file2.js',
        'file3.js'
    ], State.TYPES.FILE);

    describe('when constructing a state with an array of filenames', function() {

        it('should have a type equal to State.TYPES.FILE', function() {
            state.type().should.equal(State.TYPES.FILE);
        });

        it('should have a length of 3', function() {
            state.length().should.equal(3);
        });

        it('should contain an object with three unique properties', function() {
            var values = state.value();

            values[0].should.not.equal(values[1]);
            values[0].should.not.equal(values[2]);
            values[1].should.not.equal(values[2]);
        });

        it('should give values of [file1.js, file2.js, file3.js]', function() {
            var values = state.value();

            values.should.include('file1.js');
            values.should.include('file2.js');
            values.should.include('file3.js');
        });

        it('should populate the metadata with the filenames given', function() {
            state.meta('file1.js').should.include({ filename: 'file1.js', encoding: 'utf8' });
            state.meta('file2.js').should.include({ filename: 'file2.js', encoding: 'utf8' });
            state.meta('file3.js').should.include({ filename: 'file3.js', encoding: 'utf8' });
        });

        it('should allow us to iterate with forEach 3 times', function() {
            var iterations = 0;

            state.forEach(function(key, value, meta) {
                iterations++;
            }, this);

            iterations.should.equal(3);
        });
    });
});