/*global describe, it*/
var State = require('../lib/buildy/state.js');
var should = require('should');

describe('State', function() {
    describe('constructing a state', function() {
        it('should accept a string value as the only parameter', function() {
            var testState = new State('String contents');
        });

        it('should have a type of State.TYPES.STRING when the type parameter is omitted', function() {
            var testState = new State('String contents');
            testState.type().should.equal(State.TYPES.STRING);
        });
    });


});