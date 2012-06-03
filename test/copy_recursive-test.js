"use strict";

/**
 * vows js test suite
 */

var vows = require('vows');
var assert = require('assert');
var temp = require('temp');
var path = require('path');
var fs = require('fs');
var fixtures = require('./fixtures.js');

var copy_recursive = require('../lib/buildy/copy_recursive');

function _attachConsole(o, prefix) {
    prefix = prefix || '';

    o.on('copy', function (src, dst) {
        console.log(prefix + ' copy: ' + src + ' ' + dst);
    });

    o.on('success', function (src, dst) {
        console.log(prefix + ' done: ' + src + ' ' + dst);
    });
}

vows.describe('Copying batches of directories recursively').addBatch({
    'when copying a file to a new temp directory' : {
        topic : function () {
            fixtures.temp_directory = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.file], fixtures.temp_directory, this.callback);
            _attachConsole(cpr, 'when copying a file to a new temp...');
        },
        'the callback does not receive an error' : function (err, results) {
            console.log(err);
            assert.ok(!err);
        },
        'the source file is copied to the directory' : function (err, results) {
            var destination = path.join(fixtures.temp_directory, path.basename(fixtures.file));
            assert.ok(path.existsSync(destination));
        }
    }, 'when supplied a single source file, and a destination file that does not exist' : {
        topic : function () {
            fixtures.temp_directory_b = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.file], path.join(fixtures.temp_directory_b, 'non-existent-filename'), this.callback);
            _attachConsole(cpr, 'when supplied a single source file...');
        },
        'the destination is created' : function (err, results) {
            assert.ok(path.existsSync(path.join(fixtures.temp_directory_b, 'non-existent-filename')));
        },
        'the destination is a file and not a directory' : function(err, results) {
            var stats = fs.statSync(path.join(fixtures.temp_directory_b, 'non-existent-filename'));
            assert.ok(stats.isFile(), 'destination stats isFile() returns true');
        }
    }
    , 'when supplied a single existing source directory, without a trailing slash, and a destination directory' : {
        topic : function () {
            fixtures.temp_directory_c = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.directory], fixtures.temp_directory_c, this.callback);
            _attachConsole(cpr);
        },
        'the source directory is copied as a child of the destination directory' : function (err, results) {
            var expectedDest = path.join(fixtures.temp_directory_c, path.basename(fixtures.directory));
            assert.ok(path.existsSync(expectedDest), 'Expected to exist: ' + expectedDest);
        }
//        'the contents of the destination directory match the contents of the source directory' : function () {
//
//        }
    }
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
