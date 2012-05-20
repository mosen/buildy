"use strict";

/**
 * vows js test suite
 */

var vows     = require('vows');
var assert   = require('assert');
var temp     = require('temp');
var path     = require('path');
var fixtures = require('./fixtures.js');

var filelist = require('../lib/buildy/filelist');

vows.describe('Generating file lists').addBatch({
    'when called with a single, existing file': {
        topic: function() {
            filelist([fixtures.file], this.callback);
        },
        'the callback does not receive an error': function(err, data) {
            assert.isNull(err);
        },
        'the callback receives an array containing the file' : function(err, data) {
            assert.equal(data.length, 1);
        },
        'the callback receives the name of the file specified' : function(err, data) {
            assert.equal(fixtures.file, data[0]);
        }
    }
    , 'when called with a single, existing directory' : {
        topic: function() {
            filelist([fixtures.directory], this.callback);
        },
        'the callback does not receive an error': function(err, data) {
            assert.isNull(err);
        },
        'the callback receives an array with more than one element' : function(err, data) {
            assert.ok(data.length > 0);
        }
    }
    , 'when called with a single, non existent file': {
        topic: function() {
            filelist([fixtures.nonexistent], this.callback);
        },
        'the callback receives an error': function(err, data) {
            assert.ok(err);
        }
    }
    , 'when called with one file that is also excluded': {
        topic: function() {
            filelist([fixtures.file], this.callback, { exclude: [fixtures.file] });
        },
        'the file is excluded from the results': function(err, data) {
            assert.equal(-1, data.indexOf(fixtures.file));
        }
    }
    , 'when called with one file that is also excluded via regex': {
        topic: function() {
            filelist([fixtures.file], this.callback, { exclude: [fixtures.fileregex] });
        },
        'the file is excluded from the results': function(err, data) {
            assert.equal(-1, data.indexOf(fixtures.file));
        }
    }
    // TODO: Globbing fails with zero items returned on windows platform, due to node-glob relying upon / character
    , 'when called with glob ./fixtures/test*.js': {
        topic: function() {
            filelist([fixtures.glob], this.callback);
        },
        'the callback does not receive an error': function(err, data) {
            assert.isNull(err);
        },
        'the result contains 2 filenames': function(err, data) {
            assert.equal(data.length, 2);
        }
    }
    , 'when called with a specified context': {
        topic: function() {
            var self = this;

            filelist([fixtures.file], function _inContextTest(err , data) {
                self.callback(err, this);
            }, { context: "test_suite_context", exclude: [] });
        },
        'the this keyword refers to that context' : function(err, context) {
            assert.equal(context, "test_suite_context");
        }
    }
}).export(module);