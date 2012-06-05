/*global describe, it*/
// Mocha test suite
var copy = require('../lib/buildy/copy');
var temp = require('temp');
var path = require('path');
var should = require('should');
var fixtures = require('./fixtures');

describe('copy:', function() {
    describe('when the source doesnt exist', function() {

        it('should call back with an error', function(done) {
            copy(fixtures.nonexistent, '', function(err, src, dst) {
                should.exist(err);
                done();
            });
        });
    });

    describe('when the destination doesnt exist and mkdir is false', function() {

        it('should call back with an error', function(done) {
            copy(fixtures.file, fixtures.nonexistent, function(err, src, dst) {
                should.exist(err);
                done();
            });
        }, { mkdir: false });
    });

    describe('when the destination doesnt exist and mkdir is true', function() {

        it('should create the destination path', function(done) {
           copy(fixtures.file, temp.path({ suffix: '.js' }), function(err, src, dst) {
               should.not.exist(err);
               path.existsSync(dst).should.be.true;
               done();
           }, { mkdir: true });
        });
    });

    describe('when the source is a directory', function() {

        it('should call back with an error', function(done) {
            copy(fixtures.directory, temp.path(), function(err, src, dst) {
                should.exist(err);
                done();
            });
        });
    });

    describe('when the source is identical to the destination', function() {

        it('should call back with an error', function(done) {
            copy(fixtures.file, fixtures.file, function(err, src, dst) {
                should.exist(err);
                done();
            });
        });
    });
});