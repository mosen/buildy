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

vows.describe('Copying batches of directories recursively').addBatch({
    'when copying a file to an existing directory' : {
        topic: function() {
            fixtures.temp_directory = temp.mkdirSync();
            copy_recursive([fixtures.file], fixtures.temp_directory, this.callback);
        },
        'the callback does not receive an error': function(err, results) {
            assert.ok(!err);
        },
        'the source file is copied to the directory' : function(err, results) {
            assert.ok(path.existsSync(path.join(fixtures.temp_directory, fixtures.file)));
        }
    }
    , 'when supplied a single source file, and a destination file that does not exist' : {
        topic : function() {
            fixtures.temp_directory_b = temp.mkdirSync();
            copy_recursive([fixtures.file], path.join(fixtures.temp_directory_b, 'non-existent-filename'), this.callback);
        },
        'the file exists at the destination with the new name' : function() {
            assert.ok(path.existsSync(path.join(fixtures.temp_directory_b, 'non-existent-filename')));
        }
    }
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
