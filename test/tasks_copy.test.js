/**
 * Built in task test case - copy
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    path = require('path'),
    fs = require('fs'),
    State = require('../lib/buildy/state'),
    fixtures = {
        destination : __dirname + '/temp',
        files : ['./test/fixtures/test1.js', './test/fixtures/test2.js']
    };

module.exports = {

    // Smoke test

    'test copy (smoke test with copy spec)' : function(beforeExit, assert) {
        var q = new Queue('test-copy');

        q.task('copy', { src: fixtures.files, dest: fixtures.destination });
        q.run();

        beforeExit(function() {
            fixtures.files.forEach(function(filename) {
                var filepath = path.join(fixtures.destination, filename);

                fs.stat(filepath, function(err, stats) {
                    assert.ok(err, 'stat a copied file didnt callback with an error');
                    assert.ok(stats.isFile(), 'destination name is a file');

                    fs.unlinkSync(filepath);
                });
            });
        });
    },

    // Test all input types

    'test copy input files' : function(beforeExit, assert) {
        var q = new Queue('test-copy-files');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('copy', { dest: fixtures.destination });
        q.run();

        //assert.equal(q._state.get().value, 'ab', 'assert state contains concatenated string output');

        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');

        beforeExit(function() {
            fixtures.files.forEach(function(filename) {
                var filepath = path.join(fixtures.destination, filename);

                fs.stat(filepath, function(err, stats) {
                    assert.ok(err, 'stat a copied file didnt callback with an error');
                    assert.ok(stats.isFile(), 'destination name is a file');

                    fs.unlinkSync(filepath);
                });
            });
        });
    },

    'test copy input strings' : function(beforeExit, assert) {
        var q = new Queue('test-copy-strings');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.files);

        q.task('copy', { dest: fixtures.destination });
        q.run();

        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');

        beforeExit(function() {
            fixtures.files.forEach(function(filename) {
                var filepath = path.join(fixtures.destination, filename);

                fs.stat(filepath, function(err, stats) {
                    assert.ok(err, 'stat a copied file didnt callback with an error');
                    assert.ok(stats.isFile(), 'destination name is a file');

                    fs.unlinkSync(filepath);
                });
            });
        });
    },

    'test copy input string' : function(beforeExit, assert) {
        var q = new Queue('test-copy-string');

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.files[0]);

        q.task('copy', { dest: fixtures.destination });
        q.run();

        //assert.equal(q._state.get().value, 'ab', 'assert state contains concatenated string output');
        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');

        beforeExit(function() {
            fixtures.files.forEach(function(filename) {
                var filepath = path.join(fixtures.destination, filename);

                fs.stat(filepath, function(err, stats) {
                    assert.ok(err, 'stat a copied file didnt callback with an error');
                    assert.ok(stats.isFile(), 'destination name is a file');

                    fs.unlinkSync(filepath);
                });
            });
        });
    },

    'test copy input undefined' : function(beforeExit, assert) {
//        var q = new Queue('test-copy-spec');
//
//        q.task('copy', { dest: fixtures.destination });
//        q.run();
//
//        //assert.equal(q._state.get().value, 'ab', 'assert state contains concatenated string output');
//        assert.equal(q._state.get().type, State.TYPES.FILES, 'assert state is type:files');
    }
}