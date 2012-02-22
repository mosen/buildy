/**
 * cprf unit tests
 */
var assert = require('assert'),
    cprf   = require('../lib/buildy/cprf'),
    temp   = require('temp'),
    path   = require('path'),
    fs     = require('fs');

module.exports = {

    /*
     * cprf.copy() tests
     */

    'smoke test copy' : function(beforeExit, assert) {
        var destFile = temp.path({ suffix: '.css' });

        cprf.copy('./test/fixtures/test1.css', destFile, function(err) {
            assert.ok(!err, "Cprf does not call back with an error");
        });

        beforeExit(function() {
           fs.unlinkSync(destFile);
        });
    },

    'copy with non-existent source calls back with error' : function(beforeExit, assert) {
        var destFile = temp.path({ suffix: '.css' });

        cprf.copy('./test/fixtures/test1abc.css', destFile, function(err) {
            assert.ok(err, "Cprf calls back with an error");
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy with directory as source calls back with error' : function(beforeExit, assert) {
        var srcDir = temp.mkdirSync('cprftest_srcdir'),
            destFile = temp.path({ suffix: '.css' });

        cprf.copy(srcDir, destFile, function(err) {
            assert.ok(err, "Cprf calls back with an error");
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy with identical source and destination calls back with error' : function(beforeExit, assert) {
        var testFile = './fixtures/test1.js';

        cprf.copy(testFile, testFile, function(err) {
            assert.ok(err, "Cprf calls back with an error");
        });
    },

    'copy with non existent destination directory and filename creates destination directories' : function(beforeExit, assert) {
        var destDir = temp.mkdirSync('cprftest_nonexistparent'),
            destFile = destDir + '/non_existent_dir/test1copy.css';

        cprf.copy('./test/fixtures/test1.css', destFile, function(err) {
            assert.ok(!err, "Cprf does not call back with an error");
            assert.ok(path.existsSync(destFile), 'Non existent destination and file are created.');
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy with non existent destination directory creates new file and directory' : function(beforeExit, assert) {
        var destDir = temp.mkdirSync('cprftest_nonexistparent'),
            destFile = destDir + '/non_existent_dir';

        cprf.copy('./test/fixtures/test1.css', destFile, function(err) {
            assert.ok(!err, "Cprf does not call back with an error");
            assert.ok(path.existsSync(destFile), 'Non existent destination directory is created.');
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy without callback does not throw error' : function(beforeExit, assert) {
        var didThrow = false;

        try {
            var destFile = temp.path({ suffix: '.css' });
            cprf.copy('./test/fixtures/test1.css', destFile);
        } catch (e) {
            didThrow = true;
        } finally {
            assert.ok(!didThrow, "Copy without a callback did not throw an Error.");
        }
        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    /*
     * cprf.cprf() tests
     */

    'smoke test cprf' : function(beforeExit, assert) {
        var destDir = temp.mkdirSync('cprftest_smoke');

        cprf.cprf(['./test/fixtures/test1.css'], destDir, function(err, results){
            assert.equal(0, results.failed.length, "None of the files in the copy list failed.");
        });
    },

    'test cprf can handle basic wildcards' : function(beforeExit, assert) {
        var destDir = temp.mkdirSync('cprftest_wildcard_simple'),
            callbackDone = false;

        // Make sure a bad set of fixtures doesn't ruin our test.
        assert.ok(path.existsSync('./test/fixtures/test_concat_a.js'), "Fixture test_concat_a.js exists.");
        assert.ok(path.existsSync('./test/fixtures/test_concat_b.js'), "Fixture test_concat_b.js exists.");

        cprf.cprf(['./test/fixtures/test_concat_*'], destDir, function(err, results) {
            callbackDone = true;

            assert.equal(0, results.failed.length, "None of the files in the copy list failed.");
            assert.equal(2, results.complete.length, "Only the two fixtures were copied.");

            assert.ok(path.existsSync(destDir + '/test_concat_a.js'), "Fixture test_concat_a.js was copied.");
            assert.ok(path.existsSync(destDir + '/test_concat_b.js'), "Fixture test_concat_b.js was copied.");
        });

        beforeExit(function() {
            assert.ok(callbackDone, "Callback was actually called.");
        });
    },

    'test cprf can handle basic exclusions from wildcard matches' : function(beforeExit, assert) {
        var destDir = temp.mkdirSync('cprftest_wildcard_exclude'),
            callbackDone = false;

        // Make sure a bad set of fixtures doesn't ruin our test.
        assert.ok(path.existsSync('./test/fixtures/test_concat_a.js'), "Fixture test_concat_a.js exists.");
        assert.ok(path.existsSync('./test/fixtures/test_concat_b.js'), "Fixture test_concat_b.js exists.");

        cprf.cprf(['./test/fixtures/test_concat_*'], destDir, function(err, results) {
            callbackDone = true;

            assert.equal(0, results.failed.length, "None of the files in the copy list failed.");
            assert.equal(2, results.complete.length, "Only the two fixtures were copied.");

            assert.ok(path.existsSync(destDir + '/test_concat_a.js'), "Fixture test_concat_a.js was copied.");
            assert.ok(path.existsSync(destDir + '/test_concat_b.js'), "Fixture test_concat_b.js was copied.");
        }, { excludes : ['test_concat_b.js'] });

        beforeExit(function() {
            assert.ok(callbackDone, "Callback was actually called.");
        });
    },

    'test cprf copies specified source directory without trailing slash into destination' : function(beforeExit, assert) {
        var destDir = temp.mkdirSync('cprftest_dir_todir'),
            callbackDone = false;

        cprf.cprf(['./test/fixtures'], destDir, function(err, results) {
            callbackDone = true;

            assert.ok(!err, "Cprf did not call back with an error.");

            assert.ok(path.existsSync(destDir + '/fixtures/test_concat_a.js'), "Fixture test_concat_a.js was copied.");
            assert.ok(path.existsSync(destDir + '/fixtures/test_concat_b.js'), "Fixture test_concat_b.js was copied.");
        });

        beforeExit(function() {
            assert.ok(callbackDone, "Callback was actually called.");
        });
    }
};