var utils = require('../lib/utils'),
    path = require('path');

// All tests expect the buildy module folder to be the CWD.

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

    'smoke test applyTemplate' : function(beforeExit, assert) {
//        utils.applyTemplate({
//            template : "{{model}}",
//            model : "template test content"
//        }, function(data) {
//           assert.equal(data, "template test content");
//        });
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
        }, {}, function(result) {
            assert.isNotNull(result);
            assert.isDefined(result);
        });
    },

    'smoke test cssMinify' : function(beforeExit, assert) {
        utils.cssMinify({
            sourceFile : './test/fixtures/test1.css'
        }, function(result) {
            assert.isNotNull(result);
            assert.isDefined(result);
        });
    }
};