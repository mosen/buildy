var utils = require('utils'),
    path  = require('path'),
    fs    = require('fs');

// All tests expect the buildy module folder to be the CWD.
// Run with expresso -I lib or -I lib_cov for coverage
// TODO: utils callback functions are not uniform in their parameters
module.exports = {

    // concat (sync)

    'test concatSync with null destination returns a string with non-zero length' : function(beforeExit, assert) {
        var output = utils.concatSync(null, ['./test/fixtures/test1.js', './test/fixtures/test2.js']);
        assert.type(output, 'string');
    },

    'test concatSync with invalid file(s) throws an error' : function(beforeExit, assert) {
        assert.throws(function() {
            utils.concatSync('./test/temp/testconcat1.js', ['./test/fixtures/testx.js', './test/fixtures/testy.js'])
        }, Error);
    },

    'test concatSync with file destination' : function(beforeExit, assert) {
        var testfile = './test/temp/testconcat2.js';

        utils.concatSync(testfile, ['./test/fixtures/test1.js', './test/fixtures/test2.js']);
        assert.ok(path.existsSync('./test/temp/testconcat2.js'));

        beforeExit(function() {
            fs.unlinkSync(testfile);
        });
    },

    'test concatSync with invalid file destination' : function(beforeExit, assert) {
        assert.throws(function() {
            utils.concatSync('./test/temp/invalid_dir/testconcat3.js', ['./test/fixtures/test1.js', './test/fixtures/test2.js']);
        }, Error);
    },

    'test applyTemplateSync with string' : function(beforeExit, assert) {
        var templateVars = {
                content : "template test content"
            },
            output = utils.applyTemplateSync(null, './test/fixtures/test.handlebars', templateVars);

        assert.equal(output, templateVars.content);
    },

    'test applyTemplateSync with file output' : function(beforeExit, assert) {
        var testfile = './test/temp/testtemplate1.js';

        utils.applyTemplateSync(testfile,
            './test/fixtures/test.handlebars',
            { content: "template test content" });

        assert.ok(path.existsSync('./test/temp/testtemplate1.js'));

        beforeExit(function() {
            fs.unlinkSync(testfile);
        });
    },

    // utils.applyTemplate (ASYNC)

    'smoke test applyTemplate' : function(beforeExit, assert) {
        utils.applyTemplate({
            template : "{{test}}",
            model : { "test" : "template test content" }
        }, function(err, data) {
           assert.equal(data, "template test content");
        });
    },

    'test applyTemplate without correct parameters returns error' : function(beforeExit, assert) {
        utils.applyTemplate({
        }, function(err, data) {
           assert.ok(err); // Err is a truthy value
        });
    },

    'test applyTemplate without valid file returns error' : function(beforeExit, assert) {
        utils.applyTemplate({
            templateFile : "./test/fixtures/xyzabc.handlebars",
            model : { "test" : "template test content" }
        }, function(err, data) {
           assert.ok(err);
        });
    },

    'test applyTemplate with template file input' : function(beforeExit, assert) {
        var testString = "template test content";

        utils.applyTemplate({
            templateFile : "./test/fixtures/test.handlebars",
            model : { "content" : testString }
        }, function(err, data) {
            assert.ok(!err);
            assert.equal(data, testString);
        });
    },

    // utils.lint (ASYNC)

    'test lint with source file' : function(beforeExit, assert) {
        utils.lint({
           sourceFile : './test/fixtures/test1.js'
        }, function(err, data) {
            assert.ok(!err);
            assert.isDefined(data);
        });
    },

    'test lint with source string' : function(beforeExit, assert) {
        utils.lint({
           source : 'var x = 1;'
        }, function(err, data) {
            assert.ok(!err);
            assert.isDefined(data);
        });
    },

    'test lint with invalid file input returns error' : function(beforeExit, assert) {
        utils.lint({
           sourceFile : './test/fixtures/testxyz.js'
        }, function(err, data) {
            assert.ok(err);
        });
    },

    'test lint with no valid parameters returns error' : function(beforeExit, assert) {
        utils.lint({}, function(err, data) {
            assert.ok(err);
        });
    },

    'test minify with source file does not error, and returns minified string' : function(beforeExit, assert) {
        utils.minify({
            sourceFile : './test/fixtures/test1.js'
        }, function (err, data) {
            assert.ok(!err);
            assert.isDefined(data);
        });
    },

    'test minify with source string does not error, and returns minified string' : function(beforeExit, assert) {
        utils.minify({
            source : 'var x = 1;'
        }, function (err, data) {
            assert.ok(!err);
            assert.isDefined(data);
        });
    },

    'test minify source to destination file does not error, and the file exists' : function(beforeExit, assert) {
        var testfile = './test/temp/testminify1.js';

        utils.minify({
            source : 'var x = 1;',
            destFile : testfile
        }, function (err, data) {
            assert.ok(!err);
            assert.ok(path.existsSync(testfile));
        });

        beforeExit(function() {
            fs.unlinkSync(testfile);
        });
    },

    'test minify with invalid dest file returns an error' : function(beforeExit, assert) {
        utils.minify({
            source : 'var x = 1;',
            destFile : './test/temp/invalid_dir/testabc.js'
        }, function (err, data) {
            assert.ok(err);
        });
    },

    'test minify with invalid source file returns an error' : function(beforeExit, assert) {
        utils.minify({
            sourceFile : './test/fixtures/testabc.js'
        }, function (err, data) {
            assert.ok(err);
        });
    },

    'test minify with unparseable code returns an error' : function(beforeExit, assert) {
        utils.minify({
            source : 'var x(1) = ^43function;;1'
        }, function (err, data) {
            assert.ok(err);
        });
    },

    'test minify with no parameters returns an error' : function(beforeExit, assert) {
        utils.minify({}, function(err, data) {
            assert.ok(err);
        });
    },


    'smoke test cssLint' : function(beforeExit, assert) {
        utils.cssLint({
            sourceFile : './test/fixtures/test1.css'
        }, function(err, data) {
            assert.ok(!err);
            assert.isDefined(data);
        });
    },

    'smoke test cssMinify' : function(beforeExit, assert) {
        utils.cssMinify({
            sourceFile : './test/fixtures/test1.css'
        }, function(err, data) {
            assert.ok(!err);
            assert.isDefined(data);
        });
    }
};