var utils = require('utils'),
    path = require('path');

// All tests expect the buildy module folder to be the CWD.
// Run with expresso -I lib or -I lib_cov for coverage
// TODO: utils callback functions are not uniform in their parameters
module.exports = {
    'test concatSync with null destination returns a string with non-zero length' : function(beforeExit, assert) {
        var output = utils.concatSync(null, ['./test/fixtures/test1.js', './test/fixtures/test2.js']);
        assert.type(output, 'string');
    },

    'smoke test applyTemplateSync' : function(beforeExit, assert) {
        var templateVars = {
                content : "template test content"
            },
            output = utils.applyTemplateSync(null, './test/fixtures/test.handlebars', templateVars);

        assert.equal(output, templateVars.content);
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
           assert.equal(data, testString);
        });
    },



    'smoke test lint' : function(beforeExit, assert) {
        utils.lint({
           sourceFile : './test/fixtures/test1.js'
        }, {}, function(result) {
           assert.isNotNull(result);
           assert.isDefined(result);
        });
    },

    'smoke test minify' : function(beforeExit, assert) {
        utils.minify({
            sourceFile : './test/fixtures/test1.js'
        }, function (err, data) {
           assert.isNotNull(data);
           assert.isDefined(data);
        });
    },

    'smoke test cssLint' : function(beforeExit, assert) {
        utils.cssLint({
            sourceFile : './test/fixtures/test1.css'
        }, function(result) {
            assert.isNotNull(result);
            assert.isDefined(result);
        });
    },

    'smoke test cssMinify' : function(beforeExit, assert) {
        utils.cssMinify({
            sourceFile : './test/fixtures/test1.css'
        }, function(err, result) {
            assert.ok(!err);
            assert.isDefined(result);
        });
    }
};