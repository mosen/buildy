/*global describe, it*/
// Mocha test suite
var copy = require('../lib/buildy/copy');
var temp = require('temp');
var path = require('path');
var fs = require('fs');
var should = require('should');
var fixtures = require('./fixtures');
var copy_recursive = require('../lib/buildy/copy_recursive');

// Log custom events to the console
var logging_enabled = false;

function _attachConsole(o, prefix) {
    prefix = prefix || '';

    if (logging_enabled) {
        o.on('copy', function (src, dst) {
            console.log(prefix + ' copy: ' + src + ' ' + dst);
        });

        o.on('copied', function (src, dst) {
            console.log(prefix + ' copied: ' + src + ' ' + dst);
        });

        o.on('success', function (src, dst) {
            console.log(prefix + ' done: ' + src + ' ' + dst);
        });
    }
}

describe('copy recursive:', function() {

    describe('when copying a file to a directory', function() {
        it('the file should exist in that directory', function(done) {
            var tempdir = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.file], tempdir, function(err, results) {
                fs.existsSync(path.join(tempdir, path.basename(fixtures.file))).should.be.true;
                done(err);
            });
            _attachConsole(cpr, 'file:');
        });
    });

    describe('when copying a file to a destination filename that doesnt exist', function() {
        it('should create the destination file', function(done) {
            var tempdir = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.file], path.join(tempdir, 'non-existent-filename'), function(err, results) {
                fs.existsSync(path.join(tempdir, 'non-existent-filename')).should.be.true;
                done(err);
            });
            _attachConsole(cpr, 'destnotexist:');
        });
    });

    describe('when copying from a directory without trailing slash', function() {
        it('should copy the directory as a child of the destination', function(done) {
            var tempdir = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.directory], tempdir, function(err, results) {
                fs.existsSync(path.join(tempdir, path.basename(fixtures.directory))).should.be.true;
                done(err);
            });
            _attachConsole(cpr, 'fromdirnoslash:');
        });
    });

    describe('when copying from a directory with a trailing slash', function() {
        it('should not copy the source directory as a child of the destination', function(done) {
            var tempdir = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.directory + '/'], tempdir, function(err, results) {
                fs.existsSync(path.join(tempdir, path.basename(fixtures.directory))).should.be.false;
                done(err);
            });
            _attachConsole(cpr, 'fromdirslash:');
        });
    });

    describe('regression when copying a directory with more than one item', function() {
        it('should not call back more than once (race condition)', function(done) {
            var tempdir = temp.mkdirSync();
            var callbacks = 0;
            var cpr = copy_recursive([fixtures.directory], tempdir, function(err, results) {
                callbacks++;
                callbacks.should.not.equal(2);
                done(err);
            });
            _attachConsole(cpr, 'regressioncallbacks:');
        });
    });
});