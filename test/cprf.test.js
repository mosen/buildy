// Test the Cprf module
var assert = require('assert'),
    cprf = require('../lib/cprf'),
    path = require('path'),
    fs   = require('fs');


module.exports = {
    'smoke test copy' : function(beforeExit, assert) {
        var destFile = './test/temp/test1copy.css';
        var copytest = cprf.copy('./test/fixtures/test1.css', './test/temp/test1copy.css', function(err) {
            assert.ok(!err);
        });

        beforeExit(function() {
           fs.unlinkSync(destFile);
        });
    },

    'copy with non-existent source calls back with error' : function(beforeExit, assert) {
        var destFile = './test/temp/test1copy.css';
        var copytest = cprf.copy('./test/fixtures/test1abc.css', './test/temp/test1copy.css', function(err) {
            assert.ok(err);
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy with directory as source calls back with error' : function(beforeExit, assert) {
        var destFile = './test/temp/test1copy.css';
        var copytest = cprf.copy('./test/fixtures', destFile, function(err) {
            assert.ok(err);
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy with identical source and destination calls back with error' : function(beforeExit, assert) {
        var testfile = './test/fixtures/test1.css';

        var copytest = cprf.copy(testfile, testfile, function(err) {
            assert.ok(err);
        });
    },

    'copy with non existent destination directory and file creates destination directories' : function(beforeExit, assert) {
        var destFile = './test/temp/nonexistent1/test1copy.css';
        var copytest = cprf.copy('./test/fixtures/test1.css', destFile, function(err) {
            assert.ok(path.existsSync(destFile), 'Non existent destination and file are created.');
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy with non existent destination directory creates destination directories' : function(beforeExit, assert) {
        var destFile = './test/temp/nonexistent2';
        var copytest = cprf.copy('./test/fixtures/test1.css', destFile, function(err) {
            assert.ok(path.existsSync(destFile), 'Non existent destination directory is created.');
        });

        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'copy without callback does not emit error' : function(beforeExit, assert) {
        var didThrow = false;
        try {
            var destFile = './test/temp/test1copy.css';
            var copytest = cprf.copy('./test/fixtures/test1.css', destFile);
        } catch (e) {
            didThrow = true;
        } finally {
            assert.ok(!didThrow);
        }
        beforeExit(function() {
           path.exists(destFile, function(exists) {
                fs.unlinkSync(destFile);
           });
        });
    },

    'smoke test cprf' : function(beforeExit, assert) {
        cprf.cprf(['./test/fixtures/test1.css'], './test/temp', function(){

        });

        beforeExit(function() {
           path.exists('./test/temp/test1.css', function(exists) {
                fs.unlinkSync('./test/temp/test1.css');
           });
        });
    },

    'test cprf can handle wildcards' : function(beforeExit, assert) {
        cprf.cprf(['./test/fixtures/*'], './test/temp/test_wildcard1', function(){

        });

        beforeExit(function() {
           path.exists('./test/temp/test_wildcard1', function(exists) {
                fs.unlinkSync('./test/temp/test_wildcard1');
           });
        });
    },

    'test cprf can exclude named files' : function(beforeExit, assert) {
        cprf.cprf(['./test/fixtures/*'], './test/temp/test_wildcard2', function(){
            path.exists('./test/temp/test_wildcard2/test1.js', function(exists) {
                assert.ok(!exists);
            });
        }, { excludes : ['test1.js'] });

        beforeExit(function() {
           path.exists('./test/temp/test_wildcard2', function(exists) {
                fs.unlinkSync('./test/temp/test_wildcard2');
           });
        });
    },

    'smoke test cprf recursive copy' : function(beforeExit, assert) {
        cprf.cprf(['./test/fixtures'], './test/temp', function(){

        });

        beforeExit(function() {
           path.exists('./test/temp/fixtures', function(exists) {
                fs.unlinkSync('./test/temp/fixtures');
           });
        });
    }
}