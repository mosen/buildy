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
}).export(module);