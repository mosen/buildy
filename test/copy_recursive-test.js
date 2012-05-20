"use strict";

/**
 * vows js test suite
 */

var vows     = require('vows');
var assert   = require('assert');
var temp     = require('temp');
var path     = require('path');
var fixtures = require('./fixtures.js');

var copy_recursive = require('../lib/buildy/copy_recursive');

vows.describe('Copy recursive module').addBatch({
    'when supplied a single source file, and a destination directory' : {
        topic: function() {
            copy_recursive([fixtures.file], './fixtures/dir/somewhere', this.callback);
        },
        'the callback does not receive an error': function(err, results) {
            assert.ok(!err);
        },
        'the source file is copied to the directory' : function(err, results) {
            assert.ok(path.existsSync('./fixtures/dir/somewhere'));
        },
        'the source file retains its original name' : function(err, results) {

        }
    }
//    , 'when supplied a single source file, and a destination file that does not exist' : {
//        topic : function() {
//
//        },
//        'the file exists at the destination with the new name' : function() {
//
//        }
//    }
//    , 'when supplied a single source directory (no trailing slash), and a destination directory' : {
//        topic : function() {
//
//        },
//        'the source directory is copied as a child of the destination directory' : function() {
//
//        },
//        'the contents of the destination directory match the contents of the source directory' : function() {
//
//        }
//    }
//    , 'when supplied a single source directory (trailing slash), and a destination directory' : {
//        topic : function() {
//
//        },
//        'the source directory is not created as a child of the destination directory' : function() {
//
//        },
//        'the contents of the destination directory match the contents of the source directory' : function() {
//
//        }
//    }
}).export(module);
