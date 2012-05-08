// vows test for copy
// expresso was failing to install on win64

var vows = require('vows');
var assert = require('assert');
var temp = require('temp');


var path = require('path');
var copy = require('../lib/buildy/copy');

var fixtures = {
    nonexistent: './fixtures/non-existent-file',
    file: path.join(__dirname, 'fixtures', 'test1.js')
};

vows.describe('Copying a single file').addBatch({
    'when the source does not exist': {
        topic: function() {
            copy(fixtures.nonexistent, '', this.callback);
        },
        'the callback is executed with an error that evaluates to true': function(err, source, dest) {
            assert.ok(err);
        },
        'the callback receives an error which is an instance of Error': function(err, source, dest) {
            assert.instanceOf(err, Error);
        }
    },

    'when the destination does not exist, and mkdir is false': {
        topic: function() {
            copy(fixtures.file, fixtures.nonexistent, this.callback, { mkdir: false });
        },
        'the callback is executed with an error that evaluates to true': function(err, source, dest) {
            assert.ok(err);
        },
        'the callback receives an error which is an instance of Error': function(err, source, dest) {
            assert.instanceOf(err, Error);
        }
    },

    'when the destination does not exist, and mkdir is true': {
        topic: function() {
            copy(fixtures.file, temp.path({suffix:'.js'}), this.callback, { mkdir: true });
        },
        'the callback does not receive an error': function(err, source, dest) {
            assert.isNull(err);
        },
        'the destination directory is created': function(err, source, dest) {
            assert.ok(path.existsSync(dest));
        }
    },

    'when the source is a directory': {
        topic: function() {
            copy(temp.path(), temp.path(), this.callback);
        },
        'the callback receives an error': function(err) {
            assert.ok(err);
        },
        'the callback receives an instance of Error': function(err) {
            assert.instanceOf(err, Error);
        }
    },

    'when the source is identical to the destination': {
        topic: function() {
            copy(fixtures.file, fixtures.file, this.callback);
        },
        'the callback receives an error': function(err) {
            assert.ok(err);
        },
        'the callback receives an instance of Error': function(err) {
            assert.instanceOf(err, Error);
        }
    }
}).export(module);