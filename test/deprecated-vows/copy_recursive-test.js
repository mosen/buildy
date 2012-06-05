"use strict";

/**
 * vows js test suite
 */

var vows = require('vows');
var assert = require('assert');
var temp = require('temp');
var path = require('path');
var fs = require('fs');
var fixtures = require('./../fixtures.js');

var copy_recursive = require('../../lib/buildy/copy_recursive');

var logging_enabled = false;

function _attachConsole(o, prefix) {
    prefix = prefix || '';

    if (logging_enabled) {
        o.on('copy', function (src, dst) {
            console.log(prefix + ' copy: ' + src + ' ' + dst);
        });

        o.on('success', function (src, dst) {
            console.log(prefix + ' done: ' + src + ' ' + dst);
        });
    }
}

vows.describe('Copying files and directories recursively').addBatch({
    'when copying a file to a directory' : {
        topic : function () {
            fixtures.temp_directory = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.file], fixtures.temp_directory, this.callback);
            _attachConsole(cpr, 'when copying a file to a new temp...');
        },
        'the callback does not receive an error' : function (err, results) {
            assert.isNull(err);
        },
        'the source file is copied to the directory' : function (err, results) {
            var destination = path.join(fixtures.temp_directory, path.basename(fixtures.file));
            assert.ok(path.existsSync(destination), 'The copy exists at ' + destination);
        }
    }, 'when copying a file to a destination file that doesnt exist' : {
        topic : function () {
            fixtures.temp_directory_b = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.file], path.join(fixtures.temp_directory_b, 'non-existent-filename'), this.callback);
            _attachConsole(cpr, 'when supplied a single source file...');
        },
        'the destination file is created' : function (err, results) {
            var destination = path.join(fixtures.temp_directory_b, 'non-existent-filename');
            assert.ok(path.existsSync(path.join(fixtures.temp_directory_b, 'non-existent-filename')), 'destination file was created at ' + destination);
        },
        'the destination is a file because the source was a single file' : function(err, results) {
            var stats = fs.statSync(path.join(fixtures.temp_directory_b, 'non-existent-filename'));
            assert.ok(stats.isFile(), 'destination stats isFile() returns true');
        }
    }
    , 'when copying from a directory with no trailing slash in the path' : {
        topic : function () {
            fixtures.temp_directory_c = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.directory], fixtures.temp_directory_c, this.callback);
            _attachConsole(cpr, 'no trailing slash');
        },
        'the source directory is copied as a child of the destination directory' : function (err, results) {
            var expectedDest = path.join(fixtures.temp_directory_c, path.basename(fixtures.directory));
            assert.ok(path.existsSync(expectedDest), 'Expected to exist: ' + expectedDest);
        }
    }
    , 'when copying from a directory with a trailing slash in the path' : {
        topic : function() {
            fixtures.temp_directory_d = temp.mkdirSync();
            var cpr = copy_recursive([fixtures.directory + '\\'], fixtures.temp_directory_d, this.callback);
            _attachConsole(cpr, 'trailing slash');
        },
        'the source directory is not created as a child of the destination directory' : function() {
            var expectedDest = path.join(fixtures.temp_directory_c, path.basename(fixtures.directory));
            assert.ok(path.existsSync(expectedDest), 'Expected not to exist: ' + expectedDest);
        }
    }
}).export(module);
