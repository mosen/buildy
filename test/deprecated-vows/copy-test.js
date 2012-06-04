/**
 * vows js test suite
 */

var vows = require('vows');
var assert = require('assert');
var temp = require('temp');

var path = require('path');
var copy = require('../../lib/buildy/copy');

var fixtures = {
    nonexistent: './fixtures/non-existent-dir/non-existent-file',
    file: path.join(__dirname, 'fixtures', 'test1.js'),
    directory: path.join(__dirname, 'fixtures', 'dir')
};

vows.describe('Copying a single file').addBatch({
    'when the source does not exist': {
        topic: function() {
            copy(fixtures.nonexistent, '', this.callback);
        },
        'the callback receives an error': function(err, source, dest) {
            assert.notEqual(null, err);
        }
    },

    'when the destination directory does not exist, and mkdir is false': {
        topic: function() {
            copy(fixtures.file, fixtures.nonexistent, this.callback, { mkdir: false });
        },
        'the callback receives an error': function(err, source, dest) {
            assert.notEqual(null, err);
        }
    },

    'when the destination directory does not exist, and mkdir is true': {
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
            copy(fixtures.directory, temp.path(), this.callback);
        },
        'the callback receives an error': function(err, source, dest) {
            assert.notEqual(null, err);
        }
    },

    'when the source is identical to the destination': {
        topic: function() {
            copy(fixtures.file, fixtures.file, this.callback);
        },
        'the callback receives an error': function(err, source, dest) {
            assert.notEqual(null, err);
        }
    }
}).export(module);